import { Box } from "@chakra-ui/react";
import type OT from "@opentok/client";
import React, { useEffect, useRef } from "react";
import { useOpenTok } from "../../../../Vonage/useOpenTok";
import { VonageOverlay } from "./VonageOverlay";

export function VonageSubscriber({ stream }: { stream: OT.Stream }): JSX.Element {
    const [_openTokProps, openTokMethods] = useOpenTok();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) {
            console.error("No element to inject stream into", stream.streamId);
            return;
        }
        openTokMethods.subscribe({
            stream,
            element: ref.current,
            options: {
                insertMode: "append",
                height: "100%",
                width: "100%",
            },
        });

        return () => {
            try {
                openTokMethods.unsubscribe({
                    stream,
                });
            } catch (e) {
                console.log("Could not unsubscribe from stream");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box position="relative" height="100%" width="100%" overflow="hidden">
            <Box ref={ref} position="absolute" zIndex="100" left="0" top="0" height="100%" width="100%" />
            <Box position="absolute" left="0.4rem" bottom="0.2rem" zIndex="200">
                <VonageOverlay connectionData={stream.connection.data} />
            </Box>
        </Box>
    );
}
