import { gql } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Heading,
    Spinner,
} from "@chakra-ui/react";
import type { VonageSessionLayoutData } from "@clowdr-app/shared-types/build/vonage";
import React, { useCallback } from "react";
import {
    RoomEventDetailsFragment,
    useGetEventParticipantStreamsSubscription,
    useUpdateEventVonageSessionLayoutMutation,
} from "../../../../../generated/graphql";
import { PairLayoutForm } from "./PairLayoutForm";
import { PictureInPictureLayoutForm } from "./PictureInPictureLayoutForm";
import { SingleLayoutForm } from "./SingleLayoutForm";

export function EventRoomControlPanel({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    gql`
        subscription GetEventParticipantStreams($eventId: uuid!) {
            EventParticipantStream(where: { eventId: { _eq: $eventId } }) {
                ...EventParticipantStreamDetails
            }
        }

        fragment EventParticipantStreamDetails on EventParticipantStream {
            id
            attendeeId
            conferenceId
            eventId
            attendee {
                id
                displayName
                profile {
                    affiliation
                }
            }
            vonageStreamType
            vonageStreamId
        }

        mutation UpdateEventVonageSessionLayout($eventVonageSessionId: uuid!, $layoutData: jsonb!) {
            update_EventVonageSession_by_pk(
                pk_columns: { id: $eventVonageSessionId }
                _set: { layoutData: $layoutData }
            ) {
                id
            }
        }
    `;

    const { data, loading, error } = useGetEventParticipantStreamsSubscription({
        variables: {
            eventId: event.id,
        },
    });

    const [updateLayout] = useUpdateEventVonageSessionLayoutMutation();

    const setLayout = useCallback(
        async (layoutData: VonageSessionLayoutData) => {
            const eventVonageSessionId = event.eventVonageSession?.id;

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
        [event.eventVonageSession?.id, updateLayout]
    );

    return (
        <Box bgColor="green.100" height="100%" p={2}>
            <Heading as="h3" size="sm" mt={5}>
                Broadcast controls
            </Heading>
            {loading ? <Spinner /> : error ? <>An error occured loading participants.</> : undefined}
            {!data ? undefined : data.EventParticipantStream.length === 0 ? (
                <>No participants in event room.</>
            ) : (
                <>
                    <Accordion>
                        <AccordionItem>
                            <AccordionButton>Auto layout</AccordionButton>
                            <AccordionPanel>
                                <Button aria-label="Set stream layout to automatic mode">Use auto layout</Button>
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Side-by-side layout</AccordionButton>
                            <AccordionPanel>
                                <PairLayoutForm streams={data.EventParticipantStream} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Fullscreen layout</AccordionButton>
                            <AccordionPanel>
                                <SingleLayoutForm streams={data.EventParticipantStream} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Picture-in-picture layout</AccordionButton>
                            <AccordionPanel>
                                <PictureInPictureLayoutForm
                                    streams={data.EventParticipantStream}
                                    setLayout={setLayout}
                                />
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </>
            )}
            <Heading as="h3" size="sm" mt={5}>
                Raised hands
            </Heading>
        </Box>
    );
}
