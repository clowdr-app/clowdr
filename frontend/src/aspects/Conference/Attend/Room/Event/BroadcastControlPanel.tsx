import { gql } from "@apollo/client";
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Button, Heading } from "@chakra-ui/react";
import type { VonageSessionLayoutData } from "@clowdr-app/shared-types/build/vonage";
import React, { useCallback } from "react";
import {
    EventParticipantStreamDetailsFragment,
    useUpdateEventVonageSessionLayoutMutation,
} from "../../../../../generated/graphql";
import { PairLayoutForm } from "./PairLayoutForm";
import { PictureInPictureLayoutForm } from "./PictureInPictureLayoutForm";
import { SingleLayoutForm } from "./SingleLayoutForm";

gql`
    mutation UpdateEventVonageSessionLayout($eventVonageSessionId: uuid!, $layoutData: jsonb!) {
        update_EventVonageSession_by_pk(pk_columns: { id: $eventVonageSessionId }, _set: { layoutData: $layoutData }) {
            id
        }
    }
`;

export function BroadcastControlPanel({
    streams,
    eventVonageSessionId,
}: {
    streams: readonly EventParticipantStreamDetailsFragment[] | null;
    eventVonageSessionId: string | null;
}): JSX.Element {
    const [updateLayout] = useUpdateEventVonageSessionLayoutMutation();

    const setLayout = useCallback(
        async (layoutData: VonageSessionLayoutData) => {
            if (!eventVonageSessionId) {
                console.error("No Vonage session available for layout update");
                throw new Error("No Vonage session available for layout update");
            }

            await updateLayout({
                variables: {
                    eventVonageSessionId,
                    layoutData,
                },
            });
        },
        [eventVonageSessionId, updateLayout]
    );
    return (
        <>
            <Heading as="h3" size="sm" mt={2} mb={2}>
                Broadcast controls
            </Heading>
            {!streams ? undefined : streams.length === 0 ? (
                <>No streams that can be broadcast.</>
            ) : (
                <>
                    <Accordion>
                        <AccordionItem>
                            <AccordionButton>Auto layout</AccordionButton>
                            <AccordionPanel>
                                <Button colorScheme="green" aria-label="Set stream layout to automatic mode">
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
