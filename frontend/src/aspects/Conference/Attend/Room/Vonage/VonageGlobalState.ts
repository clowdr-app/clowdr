import OT from "@opentok/client";
import { Mutex } from "async-mutex";
import * as R from "ramda";

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
    onSessionDisconnected: () => void;
    screenSharingSupported: boolean;
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

export class VonageGlobalState {
    private mutex: Mutex = new Mutex();

    public state: StateData = { type: StateType.Uninitialised };

    public async initialiseState(
        getToken: (sessionId: string) => Promise<string>,
        sessionId: string,
        onStreamsChanged: (streams: OT.Stream[]) => void,
        onConnectionsChanged: (connections: OT.Connection[]) => void,
        onSessionDisconnected: () => void
    ): Promise<void> {
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
                getToken,
                sessionId,
                onStreamsChanged,
                onConnectionsChanged,
                onSessionDisconnected,
                screenSharingSupported,
            };
        } finally {
            release();
        }
    }

    public async updateCallbacks(
        onStreamsChanged: () => void,
        onConnectionsChanged: () => void,
        onSessionDisconnected: () => void
    ): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.state.type === StateType.Initialised) {
                this.state = {
                    ...this.state,
                    onStreamsChanged,
                    onConnectionsChanged,
                    onSessionDisconnected,
                };
            } else if (this.state.type === StateType.Connected) {
                this.state = {
                    ...this.state,
                    initialisedState: {
                        ...this.state.initialisedState,
                        onStreamsChanged,
                        onConnectionsChanged,
                        onSessionDisconnected,
                    },
                };
            } else {
                throw new Error("Invalid state transition: must be initialised or connected");
            }
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

            const session = OT.initSession(import.meta.env.SNOWPACK_PUBLIC_OPENTOK_API_KEY, this.state.sessionId, {});
            const token = await this.state.getToken(this.state.sessionId);

            session.on("streamCreated", (event) => this.onStreamCreated(event));
            session.on("streamDestroyed", (event) => this.onStreamDestroyed(event));
            session.on("connectionCreated", (event) => this.onConnectionCreated(event));
            session.on("connectionDestroyed", (event) => this.onConnectionDestroyed(event));
            session.on("sessionDisconnected", (event) => this.onSessionDisconnected(event));

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
        } finally {
            release();
        }
    }

    public async publishCamera(
        targetElement: string | HTMLElement,
        videoDeviceId: string | null,
        audioDeviceId: string | null
    ): Promise<void> {
        const release = await this.mutex.acquire();
        let _publisher: OT.Publisher | undefined;
        try {
            if (this.state.type !== StateType.Connected) {
                throw new Error("Invalid state transition: must be connected");
            }

            const state = this.state;

            if (!videoDeviceId && !audioDeviceId) {
                if (state.camera) {
                    state.session.unpublish(state.camera.publisher);
                    state.camera.publisher.destroy();

                    this.state = {
                        ...this.state,
                        camera: null,
                    };
                }
            } else if (state.camera) {
                if (state.camera.audioDeviceId === audioDeviceId && state.camera.videoDeviceId === videoDeviceId) {
                    // Nothing to do here!
                    return;
                }

                // We must republish if the publisher did not originally have one of the media types enabled
                const mustRepublish =
                    (!state.camera.initialisedWithAudio && audioDeviceId) ||
                    (!state.camera.initialisedWithVideo && videoDeviceId);

                if (mustRepublish) {
                    // First unpublish and destroy the existing publisher
                    state.session.unpublish(state.camera.publisher);
                    state.camera.publisher.destroy();

                    // Now re-initialise with a new publisher
                    const publisher = OT.initPublisher(targetElement, {
                        publishAudio: !!audioDeviceId,
                        publishVideo: !!videoDeviceId,
                        audioSource: audioDeviceId,
                        videoSource: videoDeviceId,
                        resolution: "1280x720",
                        width: "100%",
                        height: "100%",
                        insertMode: "append",
                        showControls: false,
                    });

                    _publisher = publisher;

                    await new Promise<void>((resolve, reject) => {
                        state.session.publish(publisher, (error: OT.OTError | undefined) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    });

                    this.state = {
                        ...state,
                        camera: {
                            audioDeviceId,
                            videoDeviceId,
                            initialisedWithAudio: !!audioDeviceId,
                            initialisedWithVideo: !!videoDeviceId,
                            publisher,
                        },
                    };
                } else {
                    // Otherwise, we can simply switch the sources
                    if (audioDeviceId !== state.camera.audioDeviceId) {
                        if (audioDeviceId) {
                            await state.camera.publisher.setAudioSource(audioDeviceId);
                            state.camera.publisher.publishAudio(true);
                        } else {
                            state.camera.publisher.publishAudio(false);
                        }
                    }

                    if (videoDeviceId !== state.camera.videoDeviceId) {
                        if (videoDeviceId) {
                            await state.camera.publisher.setVideoSource(videoDeviceId);
                            state.camera.publisher.publishVideo(true);
                        } else {
                            state.camera.publisher.publishVideo(false);
                        }
                    }

                    this.state = {
                        ...state,
                        camera: {
                            ...state.camera,
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
                    resolution: "1280x720",
                    width: "100%",
                    height: "100%",
                    insertMode: "append",
                    showControls: false,
                });

                _publisher = publisher;

                await new Promise<void>((resolve, reject) => {
                    state.session.publish(publisher, (error: OT.OTError | undefined) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });

                this.state = {
                    ...state,
                    camera: {
                        audioDeviceId,
                        videoDeviceId,
                        initialisedWithAudio: !!audioDeviceId,
                        initialisedWithVideo: !!videoDeviceId,
                        publisher,
                    },
                };
            }
        } catch (e) {
            if (_publisher) {
                _publisher.destroy();
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
                width: "100%",
                height: "100%",
                insertMode: "append",
                showControls: false,
            });

            _publisher = publisher;

            await new Promise<void>((resolve, reject) => {
                state.session.publish(publisher, (error: OT.OTError | undefined) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

            this.state = {
                ...this.state,
                screen: publisher,
            };
        } catch (e) {
            if (_publisher) {
                _publisher.destroy();
            }
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

            const callback = this.state.initialisedState.onSessionDisconnected;
            // TODO: handle exceptions

            this.state = {
                ...this.state.initialisedState,
            };

            callback();
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
                connections: R.uniqBy((connection) => connection.connectionId, [
                    ...this.state.connections,
                    event.connection,
                ]),
            };

            this.state.initialisedState.onConnectionsChanged(this.state.connections);
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

            const callback = this.state.initialisedState.onSessionDisconnected;
            this.state.session.off();

            this.state = {
                ...this.state.initialisedState,
                type: StateType.Initialised,
            };

            callback();
        } finally {
            release();
        }
    }

    constructor() {
        // todo
    }
}

export const State = new VonageGlobalState();
