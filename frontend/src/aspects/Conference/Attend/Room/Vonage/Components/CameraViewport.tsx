import { Box, Button } from "@chakra-ui/react";
import type OT from "@opentok/client";
import React, { useEffect, useMemo, useState } from "react";
import { useFullScreenHandle } from "react-full-screen";
import { validate } from "uuid";
import type { RegistrantDataFragment } from "../../../../../../generated/graphql";
import FAIcon from "../../../../../Icons/FAIcon";
import { useRegistrant } from "../../../../RegistrantsContext";
import { StateType } from "../VonageGlobalState";
import { useVonageGlobalState } from "../VonageGlobalStateProvider";
import CameraContainer from "./CameraContainer";
import CameraPlaceholderImage from "./CameraPlaceholder";
import MuteRemoveControlBar from "./MuteRemoveControlBar";
import ActivityOverlay from "./Overlays/ActivityOverlay";
import CameraOverlay from "./Overlays/StatusOverlay";

interface VideoStatus {
    streamHasVideo: boolean;
    warning?: "quality";
    error?: "codec-not-supported" | "quality" | "exceeds-max-streams";
}

export function CameraViewport({
    registrantId,
    stream,
    connection,
    isTalkingRef,
    enableVideo = true,
    resolution = "normal",
    framerate: inputFramerate,
    children,
}: {
    registrantId?: string;
    connection?: OT.Connection;
    stream?: OT.Stream;
    enableVideo?: boolean;
    resolution?: "low" | "normal" | "high";
    framerate?: 7 | 15 | 30;
    isTalkingRef?: React.MutableRefObject<{
        timestamp: number;
        talking: boolean;
    } | null>;
    children?: JSX.Element;
}): JSX.Element {
    const fullScreen = useFullScreenHandle();

    const smallDimensions = useMemo<OT.Dimensions>(() => ({ width: 160, height: 120 }), []);
    const normalDimensions = useMemo<OT.Dimensions>(() => ({ width: 480, height: 360 }), []);
    const highResDimensions = useMemo<OT.Dimensions>(() => ({ width: 1280, height: 720 }), []);
    const lowFrameRate = 7;
    const normalFrameRate = 15;
    const highFrameRate = 30;
    const framerate =
        inputFramerate ??
        (resolution === "low" ? lowFrameRate : resolution === "high" ? highFrameRate : normalFrameRate);

    const vonage = useVonageGlobalState();
    const [subscriber, setSubscriber] = useState<OT.Subscriber | null>(null);

    const [streamHasAudio, setStreamHasAudio] = useState<boolean | undefined>(undefined);
    const [audioBlocked, setAudioBlocked] = useState<boolean>(false);
    const [videoStatus, setVideoStatus] = useState<VideoStatus | undefined>(
        stream ? { streamHasVideo: stream.hasVideo } : undefined
    );

    const registrantIdObj = useMemo(() => {
        if (registrantId) {
            return { registrant: registrantId };
        }
        if (!connection?.data) {
            return null;
        }
        try {
            const data = JSON.parse(connection.data);
            return data["registrantId"] && validate(data["registrantId"]) ? { registrant: data["registrantId"] } : null;
        } catch (e) {
            console.warn("Couldn't parse registrant ID from Vonage subscriber data", connection.data);
            return null;
        }
    }, [connection?.data, registrantId]);
    const registrant = useRegistrant(registrantIdObj);

    useEffect(() => {
        // Vonage provides no working way to un-set the style, so never attempt to reset to the original
        if (subscriber && registrant?.profile?.photoURL_350x350) {
            subscriber.setStyle("backgroundImageURI", registrant?.profile?.photoURL_350x350);
        }
    }, [registrant, subscriber]);

    useEffect(() => {
        if (subscriber) {
            try {
                subscriber.subscribeToVideo(enableVideo);
            } catch (e) {
                console.error("Failed to subscribe to video", e);
            }
        }
    }, [enableVideo, subscriber]);

    useEffect(() => {
        try {
            if (subscriber && subscriber.stream?.hasVideo) {
                subscriber.setPreferredResolution(
                    resolution === "low"
                        ? smallDimensions
                        : resolution === "high"
                        ? highResDimensions
                        : normalDimensions
                );
                subscriber.setPreferredFrameRate(framerate);
            }
        } catch (e) {
            console.error("Failed to set preferred resolution or framerate", e);
        }
    }, [highResDimensions, normalDimensions, resolution, framerate, smallDimensions, subscriber]);

    useEffect(() => {
        if (!stream) {
            return;
        }

        if (!fullScreen.node.current) {
            console.error("No element to inject stream into", stream.streamId);
            return;
        }

        if (vonage.state.type !== StateType.Connected) {
            console.error("Must be connected to session before subscribing");
            return;
        }

        try {
            const subscriber = vonage.state.session.subscribe(stream, fullScreen.node.current, {
                insertMode: "append",
                height: "100%",
                width: "100%",
                preferredResolution:
                    resolution === "low"
                        ? smallDimensions
                        : resolution === "high"
                        ? highResDimensions
                        : normalDimensions,
                preferredFrameRate: framerate,
                // If you supply an empty style object it will break the default styling.
                ...(registrant?.profile?.photoURL_350x350
                    ? {
                          style: {
                              backgroundImageURI: registrant.profile.photoURL_350x350,
                              videoDisabledDisplayMode: "off",
                          },
                      }
                    : {}),
            });

            setSubscriber(subscriber);

            subscriber.on("videoDisabled", (event) => {
                switch (event.reason) {
                    case "codecNotSupported":
                        setVideoStatus((status) => status && { ...status, error: "codec-not-supported" });
                        break;
                    case "quality":
                        setVideoStatus((status) => status && { ...status, error: "quality" });
                        break;
                    case "subscribeToVideo":
                        setVideoStatus((status) => status && { ...status, error: "exceeds-max-streams" });
                        break;
                    case "publishVideo":
                    default:
                        setVideoStatus((status) => status && { ...status, streamHasVideo: false, error: undefined });
                        break;
                }
            });

            subscriber.on("videoEnabled", () => {
                setVideoStatus((status) => ({ ...status, streamHasVideo: true, error: undefined }));
            });

            subscriber.on("videoDisableWarning", () => {
                setVideoStatus((status) => status && { ...status, warning: "quality" });
            });

            subscriber.on("videoDisableWarningLifted", () => {
                setVideoStatus((status) => status && { ...status, warning: undefined });
            });

            subscriber.on("audioBlocked", () => {
                setAudioBlocked(true);
            });

            subscriber.on("audioUnblocked", () => {
                setAudioBlocked(false);
            });

            setVideoStatus((status) => ({ ...status, streamHasVideo: stream.hasVideo }));

            return () => {
                try {
                    if (vonage.state.type !== StateType.Connected) {
                        throw new Error("Cannot unsubscribe from stream unless session is connected");
                    }
                    if (vonage.state.session.connection) {
                        vonage.state.session.unsubscribe(subscriber);
                    }
                } catch (e) {
                    console.log("Could not unsubscribe from stream");
                } finally {
                    setSubscriber(null);
                }
            };
        } catch (e) {
            console.error("Error during subscriber creation", e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stream]);

    useEffect(() => {
        if (vonage.state.type === StateType.Connected) {
            const streamPropertyChangedHandler = (event: any) => {
                if (event.changedProperty === "hasAudio" && event.stream.streamId === stream?.streamId) {
                    setStreamHasAudio(event.newValue);
                }
                if (event.changedProperty === "hasVideo" && event.stream.streamId === stream?.streamId) {
                    setVideoStatus((status) => ({ ...status, streamHasVideo: event.newValue }));
                }
            };

            setStreamHasAudio(stream?.hasAudio);
            vonage.state.session.on("streamPropertyChanged", streamPropertyChangedHandler);

            return () => {
                if (vonage.state.type === StateType.Connected) {
                    vonage.state.session.off("streamPropertyChanged", streamPropertyChangedHandler);
                }
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vonage.state.type, stream]);

    const cameraContainer = useMemo(() => <CameraContainer ref={fullScreen.node} />, [fullScreen.node]);
    return (
        <CameraViewportInner
            registrant={registrant}
            streamHasAudio={streamHasAudio}
            enableVideo={enableVideo}
            audioBlocked={audioBlocked}
            videoStatus={videoStatus}
            isTalkingRef={isTalkingRef}
            streamId={stream?.streamId}
            connectionId={connection?.connectionId}
            subscriber={subscriber}
        >
            <>
                {children ?? cameraContainer}
                {stream?.videoType === "screen" ? (
                    <Button
                        pos="absolute"
                        zIndex={600}
                        top={2}
                        right={2}
                        size="sm"
                        onClick={() => {
                            fullScreen.enter();
                        }}
                    >
                        <FAIcon iconStyle="s" icon="expand-alt" />
                    </Button>
                ) : undefined}
            </>
        </CameraViewportInner>
    );
}

interface Props {
    registrant: RegistrantDataFragment | null;
    streamHasAudio?: boolean;
    enableVideo: boolean;
    audioBlocked: boolean;
    videoStatus: VideoStatus | undefined;
    isTalkingRef?: React.MutableRefObject<{
        timestamp: number;
        talking: boolean;
    } | null>;
    streamId?: string;
    connectionId?: string;
    subscriber?: OT.Subscriber | null;
    children: JSX.Element;
}

function CameraViewportInner({
    registrant,
    streamHasAudio,
    audioBlocked,
    enableVideo,
    videoStatus,
    isTalkingRef,
    streamId,
    connectionId,
    subscriber,
    children,
}: Props): JSX.Element {
    const [isTalking, setIsTalking] = useState<boolean>(false);

    useEffect(() => {
        if (isTalkingRef) {
            const activityRef = isTalkingRef;
            subscriber?.on("audioLevelUpdated", (event) => {
                const now = Date.now();
                // console.log("Audio level", event.audioLevel);
                const activity = activityRef.current;
                const wasTalking = !!activity?.talking;
                if (event.audioLevel > 0.05) {
                    if (!activity || now - activity.timestamp > 3000) {
                        // was either not previously talking or last spoke a long time ago
                        activityRef.current = { timestamp: now, talking: false };
                    } else if (activity.talking) {
                        activity.timestamp = now;
                    } else if (now - activity.timestamp > 500) {
                        // detected audio activity for more than 1s
                        // for the first time.
                        activity.talking = true;
                    }
                } else if (activityRef.current && activity && now - activity.timestamp > 3000) {
                    // this event never seems to fire with an audioLevel of 0 but this
                    // code is here just in case some browsers behave differently.
                    activityRef.current.talking = false;
                }

                if (wasTalking !== activityRef.current?.talking) {
                    setIsTalking(!!activityRef.current?.talking);
                }
            });
        }

        return () => {
            subscriber?.off("audioLevelUpdated");
            subscriber?.off("videoDisabled");
            subscriber?.off("videoEnabled");
        };
    }, [subscriber, isTalkingRef]);

    const cameraHidden =
        !!videoStatus &&
        videoStatus.streamHasVideo &&
        !enableVideo &&
        (!videoStatus.error || videoStatus.error === "exceeds-max-streams");
    return (
        <Box position="relative" height="100%" width="100%" overflow="hidden" pos="absolute" top={0} left={0}>
            <CameraPlaceholderImage registrant={registrant} />
            {children}
            <CameraOverlay
                registrant={registrant}
                microphoneEnabled={streamHasAudio}
                cameraHidden={cameraHidden}
                videoStatus={videoStatus}
                audioBlocked={audioBlocked}
            />
            <ActivityOverlay talking={isTalking} />
            {connectionId ? <MuteRemoveControlBar streamId={streamId} connectionId={connectionId} /> : undefined}
        </Box>
    );
}
