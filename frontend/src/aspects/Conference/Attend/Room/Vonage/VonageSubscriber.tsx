import { Box } from "@chakra-ui/react";
import type OT from "@opentok/client";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    const [talking, setTalking] = useState<boolean>(false);
    const [subscriber, setSubscriber] = useState<OT.Subscriber | null>(null);

    useEffect(() => {
        if (onChangeActivity) {
            onChangeActivity(talking);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [talking]);

    useEffect(() => {
        if (subscriber) {
            subscriber.subscribeToVideo(enableVideo);
        }
    }, [enableVideo, subscriber]);

    useEffect(() => {
        subscriber?.setPreferredResolution(
            resolution === "low" ? smallDimensions : resolution === "high" ? highResDimensions : normalDimensions
        );
        subscriber?.setPreferredFrameRate(
            resolution === "low" ? lowFrameRate : resolution === "high" ? highFrameRate : normalFrameRate
        );
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

        const subscriber = vonage.state.session.subscribe(stream, ref.current, {
            insertMode: "append",
            height: "100%",
            width: "100%",
            preferredResolution:
                resolution === "low" ? smallDimensions : resolution === "high" ? highResDimensions : normalDimensions,
            preferredFrameRate:
                resolution === "low" ? lowFrameRate : resolution === "high" ? highFrameRate : normalFrameRate,
        });

        setSubscriber(subscriber);

        let activity: null | { timestamp: number; talking: boolean } = null;
        subscriber.on("audioLevelUpdated", (event) => {
            const now = Date.now();
            if (event.audioLevel > 0.2) {
                if (!activity) {
                    activity = { timestamp: now, talking: false };
                } else if (activity.talking) {
                    activity.timestamp = now;
                } else if (now - activity.timestamp > 1000) {
                    // detected audio activity for more than 1s
                    // for the first time.
                    activity.talking = true;
                    setTalking(true);
                }
            } else if (activity && now - activity.timestamp > 3000) {
                // detected low audio activity for more than 3s
                if (activity.talking) {
                    setTalking(false);
                }
                activity = null;
            }
        });

        return () => {
            try {
                if (vonage.state.type !== StateType.Connected) {
                    throw new Error("Cannot unsubscribe from stream unless session is connected");
                }
                if (vonage.state.session.connection) {
                    vonage.state.session.unsubscribe(subscriber);
                }
                setSubscriber(null);
            } catch (e) {
                console.log("Could not unsubscribe from stream");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box position="relative" height="100%" width="100%" overflow="hidden">
            <Box ref={ref} position="absolute" zIndex="100" left="0" top="0" height="100%" width="100%" />
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
            <Box position="absolute" left="0.4rem" bottom="0.35rem" zIndex="200" width="100%">
                <VonageOverlay connectionData={stream.connection.data} />
            </Box>
        </Box>
    );
}
