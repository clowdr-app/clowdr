import type OT from "@opentok/client";
import React, { useEffect, useRef } from "react";
import { useOpenTok } from "../../../../Vonage/useOpenTok";

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
                insertMode: "replace",
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

    return <div ref={ref}></div>;
}
