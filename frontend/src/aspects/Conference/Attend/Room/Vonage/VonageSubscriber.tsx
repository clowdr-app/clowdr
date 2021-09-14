import { Box } from "@chakra-ui/react";
import type OT from "@opentok/client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import usePolling from "../../../../Generic/usePolling";
import { useRegistrant } from "../../../RegistrantsContext";
import SubscriberControlBar from "./SubscriberControlBar";
import { StateType } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";
import { VonageOverlay } from "./VonageOverlay";

export function VonageSubscriber({
    stream,
    onChangeActivity,
    enableVideo,
    resolution,
}: {
    stream: OT.Stream;
    onChangeActivity?: (active: boolean) => void;
    enableVideo: boolean;
    resolution: "low" | "normal" | "high";
}): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);

    const smallDimensions = useMemo<OT.Dimensions>(() => ({ width: 160, height: 120 }), []);
    const normalDimensions = useMemo<OT.Dimensions>(() => ({ width: 480, height: 360 }), []);
    const highResDimensions = useMemo<OT.Dimensions>(() => ({ width: 1280, height: 720 }), []);
    const lowFrameRate = 7;
    const normalFrameRate = 15;
    const highFrameRate = 30;

    const vonage = useVonageGlobalState();
    const [subscriber, setSubscriber] = useState<OT.Subscriber | null>(null);
    const activityRef = React.useRef<null | { timestamp: number; talking: boolean }>(null);
    const lastTalking = React.useRef<boolean>(false);
    const [talking, setTalking] = useState<boolean>(false);
    const pollCb = useCallback(() => {
        const isTalking = activityRef.current?.talking ?? false;
        if (lastTalking.current !== isTalking) {
            lastTalking.current = isTalking;
            onChangeActivity?.(isTalking);
        }
        setTalking(isTalking);
    }, [onChangeActivity]);
    usePolling(pollCb, 1500, true);

    const [streamHasAudio, setStreamHasAudio] = useState<boolean>(false);
    const [audioBlocked, setAudioBlocked] = useState<boolean>(false);
    const [videoStatus, setVideoStatus] = useState<{
        streamHasVideo: boolean;
        warning?: "quality";
        error?: "codec-not-supported" | "quality" | "exceeds-max-streams";
    }>({ streamHasVideo: stream.hasVideo });

    const registrantIdObj = useMemo(() => {
        if (!stream.connection.data) {
            return null;
        }
        try {
            const data = JSON.parse(stream.connection.data);
            return data["registrantId"] ? { registrant: data["registrantId"] } : null;
        } catch (e) {
            console.warn("Couldn't parse registrant ID from Vonage subscriber data");
            return null;
        }
    }, [stream.connection.data]);

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
                subscriber.setPreferredFrameRate(
                    resolution === "low" ? lowFrameRate : resolution === "high" ? highFrameRate : normalFrameRate
                );
            }
        } catch (e) {
            console.error("Failed to set preferred resolution or framerate", e);
        }
    }, [highResDimensions, normalDimensions, resolution, smallDimensions, subscriber]);

    useEffect(() => {
        if (!ref.current) {
            console.error("No element to inject stream into", stream.streamId);
            return;
        }

        if (vonage.state.type !== StateType.Connected) {
            console.error("Must be connected to session before subscribing");
            return;
        }

        try {
            const subscriber = vonage.state.session.subscribe(stream, ref.current, {
                insertMode: "append",
                height: "100%",
                width: "100%",
                preferredResolution:
                    resolution === "low"
                        ? smallDimensions
                        : resolution === "high"
                        ? highResDimensions
                        : normalDimensions,
                preferredFrameRate:
                    resolution === "low" ? lowFrameRate : resolution === "high" ? highFrameRate : normalFrameRate,
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

            subscriber.on("audioLevelUpdated", (event) => {
                const now = Date.now();
                // console.log("Audio level", event.audioLevel);
                const activity = activityRef.current;
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
            });

            subscriber.on("videoDisabled", (event) => {
                switch (event.reason) {
                    case "codecNotSupported":
                        setVideoStatus((status) => ({ ...status, error: "codec-not-supported" }));
                        break;
                    case "quality":
                        setVideoStatus((status) => ({ ...status, error: "quality" }));
                        break;
                    case "subscribeToVideo":
                        setVideoStatus((status) => ({ ...status, error: "exceeds-max-streams" }));
                        break;
                    case "publishVideo":
                    default:
                        setVideoStatus((status) => ({ ...status, streamHasVideo: false, error: undefined }));
                        break;
                }
                lastTalking.current = false; // Force the callback to be fired again
            });

            subscriber.on("videoEnabled", () => {
                setVideoStatus((status) => ({ ...status, streamHasVideo: true, error: undefined }));
                lastTalking.current = false; // Force the callback to be fired again
            });

            subscriber.on("videoDisableWarning", () => {
                setVideoStatus((status) => ({ ...status, warning: "quality" }));
            });

            subscriber.on("videoDisableWarningLifted", () => {
                setVideoStatus((status) => ({ ...status, warning: undefined }));
            });

            subscriber.on("audioBlocked", () => {
                setAudioBlocked(true);
            });

            subscriber.on("audioUnblocked", () => {
                setAudioBlocked(false);
            });

            const streamPropertyChangedHandler = (event: any) => {
                if (event.changedProperty === "hasAudio" && event.stream.streamId === stream.streamId) {
                    setStreamHasAudio(event.newValue);
                }
                if (event.changedProperty === "hasVideo" && event.stream.streamId === stream.streamId) {
                    setVideoStatus((status) => ({ ...status, streamHasVideo: event.newValue }));
                }
            };

            setStreamHasAudio(stream.hasAudio);
            setVideoStatus((status) => ({ ...status, streamHasVideo: stream.hasVideo }));
            vonage.state.session.on("streamPropertyChanged", streamPropertyChangedHandler);

            return () => {
                try {
                    if (vonage.state.type !== StateType.Connected) {
                        throw new Error("Cannot unsubscribe from stream unless session is connected");
                    }
                    if (vonage.state.session.connection) {
                        vonage.state.session.unsubscribe(subscriber);
                    }
                    vonage.state.session.off("streamPropertyChanged", streamPropertyChangedHandler);
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
    }, []);

    const videoBox = useMemo(
        () => <Box ref={ref} position="absolute" zIndex="100" left="0" top="0" height="100%" width="100%" />,
        []
    );
    const overlayBox = useMemo(
        () => (
            <Box position="absolute" zIndex="200" height="100%" width="100%">
                <VonageOverlay
                    connectionData={stream.connection.data}
                    microphoneEnabled={stream.videoType === "camera" ? streamHasAudio : undefined}
                    cameraHidden={
                        videoStatus.streamHasVideo &&
                        !enableVideo &&
                        (!videoStatus.error || videoStatus.error === "exceeds-max-streams")
                    }
                    videoStatus={videoStatus}
                    audioBlocked={audioBlocked}
                />
            </Box>
        ),
        [stream.connection.data, stream.videoType, streamHasAudio, videoStatus, enableVideo, audioBlocked]
    );

    const controlBar = useMemo(() => {
        return <SubscriberControlBar stream={stream} connection={stream.connection} />;
    }, [stream]);

    return (
        <Box position="relative" height="100%" width="100%" overflow="hidden">
            {videoBox}
            {overlayBox}
            <Box
                position="absolute"
                zIndex="200"
                left="0"
                top="0"
                height="100%"
                width="100%"
                pointerEvents="none"
                border={talking ? "3px solid green" : "0 none"}
            />
            {controlBar}
        </Box>
    );
}
