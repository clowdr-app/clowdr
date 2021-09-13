import { gql } from "@apollo/client";
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Button, useToast } from "@chakra-ui/react";
import { VonageSessionLayoutData, VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import React, { useCallback } from "react";
import {
    EventParticipantStreamDetailsFragment,
    useUpdateEventVonageSessionLayoutMutation,
} from "../../../../../../generated/graphql";
import { PairLayoutForm } from "./Layouts/PairLayoutForm";
import { PictureInPictureLayoutForm } from "./Layouts/PictureInPictureLayoutForm";
import { SingleLayoutForm } from "./Layouts/SingleLayoutForm";

gql`
    mutation UpdateEventVonageSessionLayout($eventVonageSessionId: uuid!, $layoutData: jsonb!) {
        update_video_EventVonageSession_by_pk(
            pk_columns: { id: $eventVonageSessionId }
            _set: { layoutData: $layoutData }
        ) {
            id
        }
    }
`;

export function LayoutControls({
    live,
    streams,
    eventVonageSessionId,
}: {
    live: boolean;
    streams: readonly EventParticipantStreamDetailsFragment[] | null;
    eventVonageSessionId: string | null;
}): JSX.Element {
    const [updateLayout] = useUpdateEventVonageSessionLayoutMutation();
    const toast = useToast();

    const setLayout = useCallback(
        async (layoutData: VonageSessionLayoutData) => {
            if (!eventVonageSessionId) {
                console.error("No Vonage session available for layout update");
                throw new Error("No Vonage session available for layout update");
            }

            try {
                await updateLayout({
                    variables: {
                        eventVonageSessionId,
                        layoutData,
                    },
                });
            } catch (e) {
                console.error("Failed to update layout of Vonage broadcast", e);
                toast({
                    status: "error",
                    title: "Could not set the broadcast layout",
                    description: "If this error persists, you may need to leave and re-enter the room.",
                });
            }
        },
        [eventVonageSessionId, toast, updateLayout]
    );
    return (
        <>
            {!live ? (
                <>Broadcast controls not available while event is off air.</>
            ) : !streams ? undefined : streams.length === 0 ? (
                <>No streams that can be broadcast.</>
            ) : (
                <>
                    <Accordion>
                        <AccordionItem>
                            <AccordionButton>Auto layout</AccordionButton>
                            <AccordionPanel>
                                <Button
                                    colorScheme="purple"
                                    aria-label="Set stream layout to automatic mode"
                                    onClick={() => setLayout({ type: VonageSessionLayoutType.BestFit })}
                                >
                                    Auto layout
                                </Button>
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Side-by-side layout</AccordionButton>
                            <AccordionPanel>
                                <PairLayoutForm streams={streams} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Fullscreen layout</AccordionButton>
                            <AccordionPanel>
                                <SingleLayoutForm streams={streams} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Picture-in-picture layout</AccordionButton>
                            <AccordionPanel>
                                <PictureInPictureLayoutForm streams={streams} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </>
            )}
        </>
    );
}
