import { Box } from "@chakra-ui/react";
import type OT from "@opentok/client";
import React, { useEffect, useRef, useState } from "react";
import { useOpenTok } from "../../../../Vonage/useOpenTok";
import { VonageOverlay } from "./VonageOverlay";

export function VonageSubscriber({
    stream,
    onChangeActivity,
    enableVideo,
}: {
    stream: OT.Stream;
    onChangeActivity?: (active: boolean) => void;
    enableVideo: boolean;
}): JSX.Element {
    const [, openTokMethods] = useOpenTok();
    const ref = useRef<HTMLDivElement>(null);

    const [talking, setTalking] = useState<boolean>(false);
    const [subscriber, setSubscriber] = useState<OT.Subscriber | null>(null);

    useEffect(() => {
        if (onChangeActivity) {
            onChangeActivity(talking);
        }
    }, [onChangeActivity, talking]);

    useEffect(() => {
        if (subscriber) {
            subscriber.subscribeToVideo(enableVideo);
        }
    }, [enableVideo, subscriber]);

    useEffect(() => {
        if (!ref.current) {
            console.error("No element to inject stream into", stream.streamId);
            return;
        }
        const subscriber = openTokMethods.subscribe({
            stream,
            element: ref.current,
            options: {
                insertMode: "append",
                height: "100%",
                width: "100%",
            },
        });

        setSubscriber(subscriber);

        let activity: null | { timestamp: number; talking: boolean } = null;
        subscriber.on("audioLevelUpdated", function (event) {
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
                openTokMethods.unsubscribe({
                    stream,
                });
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
                border={talking ? "3px solid green" : "0 none"}
            />
            <Box position="absolute" left="0.4rem" bottom="0.35rem" zIndex="200">
                <VonageOverlay connectionData={stream.connection.data} />
            </Box>
        </Box>
    );
}
