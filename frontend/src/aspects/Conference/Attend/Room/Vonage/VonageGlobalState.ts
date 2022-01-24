import { assert } from "@midspace/assert";
import type { VonageVideoPlaybackCommandSignal } from "@midspace/shared-types/video/vonage-video-playback-command";
import { vonageVideoPlaybackCommandSignal } from "@midspace/shared-types/video/vonage-video-playback-command";
import type { VonageSessionLayoutData } from "@midspace/shared-types/vonage";
import { isVonageSessionLayoutData } from "@midspace/shared-types/vonage";
import OT from "@opentok/client";
import { Mutex } from "async-mutex";
import * as R from "ramda";
import { StoredObservable } from "../../../../Observable";
import { transparentImage } from "../../../../Vonage/resources";

export type CameraResolutions = "640x480" | "1280x720";

export enum StateType {
    Uninitialised,
    Initialised,
    Connected,
}
type StateData = UninitialisedStateData | InitialisedStateData | ConnectedStateData;

interface UninitialisedStateData {
    type: StateType.Uninitialised;
}

interface InitialisedStateData {
    type: StateType.Initialised;
    getToken: (sessionId: string) => Promise<string>;
    sessionId: string;
    onStreamsChanged: (streams: OT.Stream[]) => void;
    onConnectionsChanged: (connections: OT.Connection[]) => void;
    onSessionConnected: (isConnected: boolean) => void;
    onCameraStreamDestroyed: (reason: string) => void;
    onScreenStreamDestroyed: (reason: string) => void;
    screenSharingSupported: boolean;
    onCameraStreamCreated: () => void;
    onScreenStreamCreated: () => void;
    onMuteForced: () => void;
    onRecordingStarted: () => void;
    onRecordingStopped: () => void;
    onRecordingIdReceived: (recordingId: string) => void;
    onLayoutReceived: (layoutData: { layout: VonageSessionLayoutData; createdAt: number }) => void;
    onVideoPlaybackSignalReceived: (command: VonageVideoPlaybackCommandSignal) => void;
    onTranscript: (data: TranscriptData) => void;
}

interface ConnectedStateData {
    type: StateType.Connected;
    initialisedState: InitialisedStateData;
    session: OT.Session;
    camera: null | {
        videoDeviceId: string | null;
        audioDeviceId: string | null;
        publisher: OT.Publisher;
        initialisedWithVideo: boolean;
        initialisedWithAudio: boolean;
    };
    screen: null | OT.Publisher;
    streams: OT.Stream[];
    connections: OT.Connection[];
}

export interface TranscriptData {
    registrant: { id: string; name: string };
    isPartial: boolean;
    transcript: string;
}

export class VonageGlobalState {
    private mutex: Mutex = new Mutex();

    private _state: StateData = { type: StateType.Uninitialised };
    public get state(): StateData {
        return this._state;
    }
    public set state(value: StateData) {
        this._state = value;

        this.IsConnected.publish(this.state.type === StateType.Connected);
        this.CameraEnabled.publish(
            this.state.type === StateType.Connected ? this.state.camera?.publisher?.stream?.hasVideo ?? false : false
        );
    }
    public IsConnected = new StoredObservable<boolean>(this.state.type === StateType.Connected);
    public CameraEnabled = new StoredObservable<boolean>(
        this.state.type === StateType.Connected ? this.state.camera?.publisher?.stream?.hasVideo ?? false : false
    );

    public get camera(): OT.Publisher | null {
        return this.state.type === StateType.Connected ? this.state.camera?.publisher ?? null : null;
    }

    public get screen(): OT.Publisher | null {
        return this.state.type === StateType.Connected ? this.state.screen : null;
    }

    public get canForceMute(): boolean | null {
        return this.state.type === StateType.Connected ? this.state.session.capabilities.forceMute !== 0 : null;
    }

    public get canForceUnpublish(): boolean | null {
        return this.state.type === StateType.Connected ? this.state.session.capabilities.forceUnpublish !== 0 : null;
    }

    public get canForceDisconnect(): boolean | null {
        return this.state.type === StateType.Connected ? this.state.session.capabilities.forceDisconnect !== 0 : null;
    }

    public async setGetTokenFunction(getToken: (sessionId: string) => Promise<string>): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state.getToken = getToken;
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.getToken = getToken;
            }
        } catch (e) {
            console.error("VonageGlobalState: setGetTokenFunction failure", e);
            throw e;
        } finally {
            release();
        }
    }

    public async initialiseState(input: {
        getToken: (sessionId: string) => Promise<string>;
        sessionId: string;
        onStreamsChanged: (streams: OT.Stream[]) => void;
        onConnectionsChanged: (connections: OT.Connection[]) => void;
        onSessionConnected: (isConnected: boolean) => void;
        onCameraStreamDestroyed: (reason: string) => void;
        onScreenStreamDestroyed: (reason: string) => void;
        onCameraStreamCreated: () => void;
        onScreenStreamCreated: () => void;
        onMuteForced: () => void;
        onRecordingStarted: () => void;
        onRecordingStopped: () => void;
        onRecordingIdReceived: (recordingId: string) => void;
        onLayoutReceived: (layoutData: { layout: VonageSessionLayoutData; createdAt: number }) => void;
        onVideoPlaybackSignalReceived: (command: VonageVideoPlaybackCommandSignal) => void;
        onTranscript: (data: TranscriptData) => void;
    }): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            // todo: disconnect from previous session etc if initialised.
            if (this.state.type === StateType.Connected) {
                throw new Error("Invalid state transition: must not be connected when initialising");
            }

            const screenSharingSupported = await new Promise<boolean>((resolve) => {
                OT.checkScreenSharingCapability((response) => {
                    if (!response.supported || response.extensionRegistered === false) {
                        // This browser does not support screen sharing
                        return resolve(false);
                    }
                    return resolve(true);
                });
            });

            this.state = {
                type: StateType.Initialised,
                screenSharingSupported,
                ...input,
            };
        } catch (e) {
            console.error("VonageGlobalState: initialiseState failure", e);
            throw e;
        } finally {
            release();
        }
    }

    public async connectToSession(): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Initialised) {
                throw new Error("Invalid state transition: must be initialised");
            }

            assert.string(import.meta.env.VITE_OPENTOK_API_KEY);
            const session = OT.initSession(import.meta.env.VITE_OPENTOK_API_KEY, this.state.sessionId, {});
            const token = await this.state.getToken(this.state.sessionId);

            session.on("streamCreated", (event) =>
                this.onStreamCreated(event).catch((e) =>
                    console.error("VonageGlobalState: error handling streamCreated", e)
                )
            );
            session.on("streamDestroyed", (event) =>
                this.onStreamDestroyed(event).catch((e) =>
                    console.error("VonageGlobalState: error handling streamDestroyed", e)
                )
            );
            session.on("streamPropertyChanged", (event) =>
                this.onStreamPropertyChanged(event).catch((e) =>
                    console.error("VonageGlobalState: error handling streamDestroyed", e)
                )
            );
            session.on("connectionCreated", (event) =>
                this.onConnectionCreated(event).catch((e) =>
                    console.error("VonageGlobalState: error handling connectionCreated", e)
                )
            );
            session.on("connectionDestroyed", (event) =>
                this.onConnectionDestroyed(event).catch((e) =>
                    console.error("VonageGlobalState: error handling connectionDestroyed", e)
                )
            );
            session.on("sessionConnected", (event) =>
                this.onSessionConnected(event).catch((e) =>
                    console.error("VonageGlobalState: error handling sessionConnected", e)
                )
            );
            session.on("sessionDisconnected", (event) =>
                this.onSessionDisconnected(event).catch((e) =>
                    console.error("VonageGlobalState: error handling sessionDisconnected", e)
                )
            );
            session.on("muteForced", (event) =>
                this.onMuteForced(event).catch((e) => console.error("VonageGlobalState: error handling muteForced", e))
            );
            session.on("archiveStarted", (event) =>
                this.onArchiveStarted(event).catch((e) =>
                    console.error("VonageGlobalState: error handling archiveStarted", e)
                )
            );
            session.on("archiveStopped", (event) =>
                this.onArchiveStopped(event).catch((e) =>
                    console.error("VonageGlobalState: error handling archiveStopped", e)
                )
            );
            session.on("signal:recordingId", (event: any) =>
                this.onRecordingIdReceived(event.data).catch((e) =>
                    console.error("VonageGlobalState: error handling recordingId signal", e)
                )
            );
            session.on("signal:layout-signal", (event: any) =>
                this.onLayoutReceived(event.data).catch((e) =>
                    console.error("VonageGlobalState: error handling layout signal", e)
                )
            );
            session.on("signal:video-playback", (event: any) => {
                if (event.from === null) {
                    this.onVideoPlaybackSignalReceived(event.data).catch((e) =>
                        console.error("VonageGlobalState: error handling play video signal", e)
                    );
                } else {
                    console.warn("VonageGlobalState: received video playback signal from a peer (ignored)", event);
                }
            });
            session.on("signal:transcript", (event: any) =>
                this.onTranscriptReceived(event.data).catch((e) =>
                    console.error("VonageGlobalState: error handling transcript signal", e)
                )
            );

            await new Promise<void>((resolve, reject) => {
                session.connect(token, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

            this.state = {
                type: StateType.Connected,
                initialisedState: this.state,
                session,
                camera: null,
                screen: null,
                streams: [],
                connections: [],
            };
        } catch (e) {
            console.error("VonageGlobalState: connectToSession failure", e);
            throw e;
        } finally {
            release();
        }
    }

    public async publishCamera(
        targetElement: string | HTMLElement,
        videoDeviceId: string | null,
        audioDeviceId: string | null,
        resolution: CameraResolutions = "640x480"
    ): Promise<void> {
        const frameRate = resolution === "1280x720" ? 30 : 15;

        const release = await this.mutex.acquire();
        let _publisher: OT.Publisher | undefined;
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected");
            }

            const existingState = this.state;

            if (!videoDeviceId && !audioDeviceId) {
                if (existingState.camera) {
                    existingState.session.unpublish(existingState.camera.publisher);
                    existingState.camera.publisher.destroy();

                    this.state = {
                        ...this.state,
                        camera: null,
                    };
                    this.state.initialisedState.onCameraStreamDestroyed("mediaStopped");
                }
            } else if (existingState.camera) {
                if (
                    existingState.camera.audioDeviceId === audioDeviceId &&
                    existingState.camera.videoDeviceId === videoDeviceId
                ) {
                    // Nothing to do here!
                    return;
                }

                // We must republish if the publisher did not originally have one of the media types enabled
                const mustRepublish =
                    (!existingState.camera.initialisedWithAudio && audioDeviceId) ||
                    (!existingState.camera.initialisedWithVideo && videoDeviceId);

                if (mustRepublish) {
                    // First unpublish and destroy the existing publisher
                    existingState.session.unpublish(existingState.camera.publisher);
                    existingState.camera.publisher.destroy();

                    // Now re-initialise with a new publisher
                    const publisher = OT.initPublisher(targetElement, {
                        publishAudio: !!audioDeviceId,
                        publishVideo: !!videoDeviceId,
                        audioSource: audioDeviceId,
                        videoSource: videoDeviceId,
                        resolution,
                        frameRate,
                        width: "100%",
                        height: "100%",
                        insertMode: "append",
                        showControls: false,
                        style: {
                            backgroundImageURI: transparentImage,
                        },

                        echoCancellation: true,
                        noiseSuppression: true,
                        fitMode: "cover",
                        videoContentHint: "motion",
                    });

                    _publisher = publisher;

                    await new Promise<void>((resolve, reject) => {
                        existingState.session.publish(publisher, (error: OT.OTError | undefined) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    });
                    publisher.on("streamDestroyed", (event) =>
                        this.onCameraStreamDestroyed(event).catch((e) =>
                            console.error("VonageGlobalState: error handling streamDestroyed", e)
                        )
                    );

                    this.state = {
                        ...existingState,
                        camera: {
                            audioDeviceId,
                            videoDeviceId,
                            initialisedWithAudio: !!audioDeviceId,
                            initialisedWithVideo: !!videoDeviceId,
                            publisher,
                        },
                    };
                    this.state.initialisedState.onCameraStreamCreated();
                } else {
                    // Otherwise, we can simply switch the sources
                    if (audioDeviceId !== existingState.camera.audioDeviceId) {
                        if (audioDeviceId) {
                            await existingState.camera.publisher.setAudioSource(audioDeviceId);
                            existingState.camera.publisher.publishAudio(true);
                        } else {
                            existingState.camera.publisher.publishAudio(false);
                        }
                    }

                    if (videoDeviceId !== existingState.camera.videoDeviceId) {
                        if (videoDeviceId) {
                            await existingState.camera.publisher.setVideoSource(videoDeviceId);
                            existingState.camera.publisher.publishVideo(true);
                        } else {
                            existingState.camera.publisher.publishVideo(false);
                        }
                    }

                    this.state = {
                        ...existingState,
                        camera: {
                            ...existingState.camera,
                            audioDeviceId,
                            videoDeviceId,
                        },
                    };
                }
            } else {
                const publisher = OT.initPublisher(targetElement, {
                    publishAudio: !!audioDeviceId,
                    publishVideo: !!videoDeviceId,
                    audioSource: audioDeviceId,
                    videoSource: videoDeviceId,
                    resolution,
                    frameRate,
                    width: "100%",
                    height: "100%",
                    insertMode: "append",
                    showControls: false,
                    style: {
                        backgroundImageURI: transparentImage,
                    },

                    echoCancellation: true,
                    noiseSuppression: true,
                    fitMode: "cover",
                    videoContentHint: "motion",
                });

                _publisher = publisher;

                await new Promise<void>((resolve, reject) => {
                    existingState.session.publish(publisher, (error: OT.OTError | undefined) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
                publisher.on("streamDestroyed", (event) =>
                    this.onCameraStreamDestroyed(event).catch((_e) =>
                        console.error("VonageGlobalState: error handling streamDestroyed")
                    )
                );

                this.state = {
                    ...existingState,
                    camera: {
                        audioDeviceId,
                        videoDeviceId,
                        initialisedWithAudio: !!audioDeviceId,
                        initialisedWithVideo: !!videoDeviceId,
                        publisher,
                    },
                };
                this.state.initialisedState.onCameraStreamCreated();
            }
        } catch (e) {
            console.error("VonageGlobalState: publishCamera failure", e);
            if (_publisher) {
                _publisher.destroy();
            }
            if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onCameraStreamDestroyed("mediaStopped");
            }
            throw e;
        } finally {
            release();
        }
    }

    public async publishScreen(screenPublishContainerRef: HTMLElement | string): Promise<void> {
        const release = await this.mutex.acquire();
        let _publisher: OT.Publisher | undefined;
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to publish screen");
            }

            const state = this.state;

            if (this.state.screen) {
                throw new Error("Screen is already published");
            }

            const publisher = OT.initPublisher(screenPublishContainerRef, {
                videoSource: "screen",
                resolution: "1280x720",
                maxResolution: { width: 1920, height: 1920 },
                width: "100%",
                height: "100%",
                insertMode: "append",
                showControls: false,
                videoContentHint: "text",
                echoCancellation: false,
                noiseSuppression: false,
            });

            _publisher = publisher;

            publisher.on("streamCreated", () => {
                try {
                    // We may need to manually apply the constraints to work around a bug in the Vonage client
                    const track = publisher.getVideoSource().track;
                    if (!track) {
                        console.warn("No track detected after stream creation");
                        return;
                    }
                    const settings = track.getSettings();
                    if (!settings.width || settings.width > 1280 || !settings.height || settings.height > 1280) {
                        const existingConstraints = track.getConstraints();
                        console.warn("Vonage client failed to apply MediaStreamConstraints, re-applying", {
                            settings,
                            existingConstraints,
                        });
                        track.applyConstraints({
                            ...existingConstraints,
                            width: { ideal: 1280, max: 1280 },
                            height: { ideal: 720, max: 1280 },
                        });
                    }
                } catch (err) {
                    console.error("Error while checking MediaStreamConstraint application", { err });
                }
            });

            await new Promise<void>((resolve, reject) => {
                state.session.publish(publisher, (error: OT.OTError | undefined) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            publisher.on("streamDestroyed", (event) =>
                this.onScreenStreamDestroyed(event).catch((e) =>
                    console.error("VonageGlobalState: error handling streamDestroyed", e)
                )
            );

            this.state = {
                ...this.state,
                screen: publisher,
            };
            this.state.initialisedState.onScreenStreamCreated();
        } catch (e) {
            console.error("VonageGlobalState: publishScreen failure", e);
            if (_publisher) {
                _publisher.destroy();
            }
            if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onScreenStreamDestroyed("mediaStopped");
            }
            throw e;
        } finally {
            release();
        }
    }

    public async unpublishScreen(): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to unpublish screen");
            }

            if (!this.state.screen) {
                throw new Error("Screen is already unpublished");
            }

            this.state.session.unpublish(this.state.screen);

            this.state = {
                ...this.state,
                screen: null,
            };
            this.state.initialisedState.onScreenStreamDestroyed("unpublished");
        } catch (e) {
            console.error("VonageGlobalState: unpublishScreen failure", e);
            throw e;
        } finally {
            release();
        }
    }

    public async disconnect(): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to disconnect");
            }

            if (this.state.camera) {
                this.state.session.unpublish(this.state.camera.publisher);
                this.state.camera.publisher.destroy();
            }

            if (this.state.screen) {
                this.state.session.unpublish(this.state.screen);
                this.state.screen.destroy();
            }

            this.state.session.off();
            this.state.session.disconnect();

            const callback = this.state.initialisedState.onSessionConnected;
            // TODO: handle exceptions

            this.state = {
                ...this.state.initialisedState,
            };

            callback(false);
        } catch (e) {
            console.error("VonageGlobalState: disconnect failure", e);
            throw e;
        } finally {
            release();
        }
    }

    public async forceMute(streamId: string): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to force mute");
            }

            const stream = this.state.streams.find((stream) => stream.streamId === streamId);
            if (!stream) {
                throw new Error("Could not force mute the specified stream: Stream not found.");
            }

            await this.state.session.forceMuteStream(stream);
        } catch (e) {
            console.error("VonageGlobalState: force mute failure", e);
            throw e;
        } finally {
            release();
        }
    }

    public async forceUnpublish(streamId: string): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to force unpublish");
            }

            const stream = this.state.streams.find((stream) => stream.streamId === streamId);
            if (!stream) {
                throw new Error("Could not force unpublish the specified stream: Stream not found.");
            }

            const session = this.state.session;
            await new Promise<void>((resolve, reject) =>
                session.forceUnpublish(stream, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                })
            );
        } catch (e) {
            console.error("VonageGlobalState: force unpublish failure", e);
            throw e;
        } finally {
            release();
        }
    }

    public async forceDisconnect(connectionId: string): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to force mute");
            }

            const connection = this.state.connections.find((connection) => connection.connectionId === connectionId);
            if (!connection) {
                throw new Error("Could not force disconnect the specified connection: Connection not found.");
            }

            const session = this.state.session;
            await new Promise<void>((resolve, reject) =>
                session.forceDisconnect(connection, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                })
            );
        } catch (e) {
            console.error("VonageGlobalState: force disconnect failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onStreamCreated(event: OT.Event<"streamCreated", OT.Session> & { stream: OT.Stream }): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to add stream");
            }

            this.state = {
                ...this.state,
                streams: R.uniqBy((stream) => stream.streamId, [...this.state.streams, event.stream]),
            };

            this.state.initialisedState.onStreamsChanged(this.state.streams);
        } catch (e) {
            console.error("VonageGlobalState: onStreamCreated failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onStreamDestroyed(
        event: OT.Event<"streamDestroyed", OT.Session> & { stream: OT.Stream }
    ): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to remove stream");
            }

            this.state = {
                ...this.state,
                streams: this.state.streams.filter((x) => x.streamId !== event.stream.streamId),
            };

            this.state.initialisedState.onStreamsChanged(this.state.streams);
        } catch (e) {
            console.error("VonageGlobalState: onStreamDestroyed failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onStreamPropertyChanged(
        event: OT.Event<"streamPropertyChanged", OT.Session> & { stream: OT.Stream } & (
                | { changedProperty: "hasAudio"; oldValue: boolean; newValue: boolean }
                | { changedProperty: "hasVideo"; oldValue: boolean; newValue: boolean }
                | { changedProperty: "videoDimensions"; oldValue: OT.Dimensions; newValue: OT.Dimensions }
            )
    ): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to update stream property");
            }

            if (
                event.stream.streamId === this.state.camera?.publisher?.stream?.streamId &&
                event.changedProperty === "hasVideo"
            ) {
                this.CameraEnabled.publish(
                    this.state.type === StateType.Connected
                        ? this.state.camera?.publisher?.stream?.hasVideo ?? false
                        : false
                );
            }
        } catch (e) {
            console.error("VonageGlobalState: onStreamPropertyChanged failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onConnectionCreated(
        event: OT.Event<"connectionCreated", OT.Session> & { connection: OT.Connection }
    ): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to add connection");
            }

            this.state = {
                ...this.state,
                connections: R.uniqBy(
                    (connection) => connection.connectionId,
                    [...this.state.connections, event.connection]
                ),
            };

            this.state.initialisedState.onConnectionsChanged(this.state.connections);
        } catch (e) {
            console.error("VonageGlobalState: onConnectionCreated failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onConnectionDestroyed(
        event: OT.Event<"connectionDestroyed", OT.Session> & { connection: OT.Connection }
    ): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to add connection");
            }

            this.state = {
                ...this.state,
                connections: this.state.connections.filter((x) => x.connectionId !== event.connection.connectionId),
            };

            this.state.initialisedState.onConnectionsChanged(this.state.connections);
        } catch (e) {
            console.error("VonageGlobalState: onConnectionDestroyed failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onSessionDisconnected(event: OT.Event<"sessionDisconnected", OT.Session>): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected to disconnect");
            }

            event.preventDefault();

            const callback = this.state.initialisedState.onSessionConnected;
            this.state.session.off();

            this.state = {
                ...this.state.initialisedState,
                type: StateType.Initialised,
            };

            callback(false);
        } catch (e) {
            console.error("VonageGlobalState: onSessionDisconnected failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onSessionConnected(_event: OT.Event<"sessionConnected", OT.Session>): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Uninitialised) {
                throw new Error("Invalid state transition: must be connected to disconnect");
            }

            let callback;
            if (this.state.type === StateType.Initialised) {
                callback = this.state.onSessionConnected;
            } else {
                callback = this.state.initialisedState.onSessionConnected;
            }

            callback(true);
        } catch (e) {
            console.error("VonageGlobalState: onSessionConnected failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onCameraStreamDestroyed(
        event: OT.Event<"streamDestroyed", OT.Publisher> & { stream: OT.Stream; reason: string }
    ): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state.onCameraStreamDestroyed(event.reason);
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onCameraStreamDestroyed(event.reason);
            }
        } catch (e) {
            console.error("VonageGlobalState: onCameraStreamDestroyed failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onScreenStreamDestroyed(
        event: OT.Event<"streamDestroyed", OT.Publisher> & { stream: OT.Stream; reason: string }
    ): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state.onScreenStreamDestroyed(event.reason);
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onScreenStreamDestroyed(event.reason);
            }
        } catch (e) {
            console.error("VonageGlobalState: onScreenStreamDestroyed failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onMuteForced(_event: OT.Event<"muteForced", OT.Session>): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state.onMuteForced();
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onMuteForced();
            }
        } catch (e) {
            console.error("VonageGlobalState: onMuteForced failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onArchiveStarted(_event: OT.Event<"archiveStarted", OT.Session>): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state.onRecordingStarted();
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onRecordingStarted();
            }
        } catch (e) {
            console.error("VonageGlobalState: onArchiveStarted failure", e);
            throw e;
        } finally {
            release();
        }
    }
    private async onArchiveStopped(_event: OT.Event<"archiveStopped", OT.Session>): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state.onRecordingStopped();
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onRecordingStopped();
            }
        } catch (e) {
            console.error("VonageGlobalState: onArchiveStopped failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onRecordingIdReceived(recordingId: string): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state.onRecordingIdReceived(recordingId);
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onRecordingIdReceived(recordingId);
            }
        } catch (e) {
            console.error("VonageGlobalState: onRecordingIdReceived failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onLayoutReceived(layoutData: any): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (
                !layoutData ||
                typeof layoutData !== "object" ||
                !("layout" in layoutData) ||
                !("createdAt" in layoutData) ||
                !layoutData.layout ||
                !layoutData.createdAt ||
                typeof layoutData.createdAt !== "number" ||
                !isVonageSessionLayoutData(layoutData.layout)
            ) {
                throw new Error("Layout data is not valid");
            }

            if (this.state.type === StateType.Initialised) {
                this.state.onLayoutReceived(layoutData);
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onLayoutReceived(layoutData);
            }
        } catch (e) {
            console.error("VonageGlobalState: onLayoutReceived failure", e);
            throw e;
        } finally {
            release();
        }
    }

    private async onVideoPlaybackSignalReceived(data: unknown): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            const signal = vonageVideoPlaybackCommandSignal.parse(data);

            if (this.state.type === StateType.Initialised) {
                this.state.onVideoPlaybackSignalReceived(signal);
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onVideoPlaybackSignalReceived(signal);
            }
        } catch (e) {
            console.error("VonageGlobalState: onVideoPlaybackSignalReceived failure", e);
            throw e;
        } finally {
            release();
        }
    }

    // public async startPlayingVideo(elementId: string): Promise<void> {
    //     if (this.state.type === StateType.Connected) {
    //         this.state.session.signal(
    //             {
    //                 type: "play-video",
    //                 data: elementId,
    //             },
    //             (err) => {
    //                 if (err) {
    //                     console.error("Error sending play video signal", err);
    //                 }
    //             }
    //         );
    //     }
    // }

    private async onTranscriptReceived(transcriptData: any): Promise<void> {
        try {
            const transcript: TranscriptData = JSON.parse(transcriptData);

            if (this.state.type === StateType.Initialised) {
                this.state.onTranscript(transcript);
            } else if (this.state.type === StateType.Connected) {
                this.state.initialisedState.onTranscript(transcript);
            }
        } catch (e) {
            console.error("VonageGlobalState: onTranscriptReceived failure", e);
            throw e;
        }
    }

    public async sendTranscript(registrantId: string, registrantName: string, isPartial: boolean, transcript: string) {
        if (this.state.type === StateType.Connected) {
            this.state.session.signal(
                {
                    type: "transcript",
                    data: JSON.stringify({
                        registrant: { id: registrantId, name: registrantName },
                        isPartial,
                        transcript,
                    }),
                },
                (err) => {
                    if (err) {
                        console.error("Error sending transcript signal", err);
                    }
                }
            );
        }
    }

    constructor() {
        // todo
    }
}

export const State = new VonageGlobalState();
