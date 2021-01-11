import { gql } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    List,
    ListItem,
    Spinner,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    useToast,
} from "@chakra-ui/react";
import type { VonageSessionLayoutData } from "@clowdr-app/shared-types/build/vonage";
import React, { useCallback, useState } from "react";
import {
    EventParticipantStreamDetailsFragment,
    EventPersonDetailsFragment,
    EventRoomJoinRequestDetailsFragment,
    RoomEventDetailsFragment,
    useApproveEventRoomJoinRequestMutation,
    useGetEventParticipantStreamsSubscription,
    useUnapprovedEventRoomJoinRequestsSubscription,
    useUpdateEventVonageSessionLayoutMutation,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Icons/FAIcon";
import { PairLayoutForm } from "./PairLayoutForm";
import { PictureInPictureLayoutForm } from "./PictureInPictureLayoutForm";
import { SingleLayoutForm } from "./SingleLayoutForm";

export function EventRoomControlPanel({
    event,
    eventPeople,
}: {
    event: RoomEventDetailsFragment;
    eventPeople: readonly EventPersonDetailsFragment[];
}): JSX.Element {
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

        subscription UnapprovedEventRoomJoinRequests($conferenceId: uuid!, $eventId: uuid!) {
            EventRoomJoinRequest(
                where: { conferenceId: { _eq: $conferenceId }, eventId: { _eq: $eventId }, approved: { _eq: false } }
            ) {
                ...EventRoomJoinRequestDetails
            }
        }

        fragment EventRoomJoinRequestDetails on EventRoomJoinRequest {
            id
            attendee {
                id
                displayName
            }
        }
    `;

    const {
        data: streamsData,
        loading: streamsLoading,
        error: streamsError,
    } = useGetEventParticipantStreamsSubscription({
        variables: {
            eventId: event.id,
        },
    });

    const {
        data: joinRequestsData,
        loading: joinRequestsLoading,
        error: joinRequestsError,
    } = useUnapprovedEventRoomJoinRequestsSubscription({
        variables: {
            eventId: event.id,
            conferenceId: event.conferenceId,
        },
    });

    return (
        <Box height="100%" p={2}>
            <Tabs>
                <TabList>
                    <Tab>Broadcast layout</Tab>
                    <Tab>
                        Raised hands
                        <Badge ml={2} colorScheme="green">
                            {joinRequestsData?.EventRoomJoinRequest.length ?? 0}
                        </Badge>
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        {streamsLoading ? (
                            <Spinner />
                        ) : streamsError ? (
                            <>An error occured loading participants.</>
                        ) : undefined}
                        <BroadcastControlPanel
                            streams={streamsData?.EventParticipantStream ?? null}
                            eventVonageSessionId={event.eventVonageSession?.id ?? null}
                        />
                    </TabPanel>
                    <TabPanel>
                        {joinRequestsLoading ? (
                            <Spinner />
                        ) : joinRequestsError ? (
                            <>An error occured loading join requests.</>
                        ) : undefined}
                        <EventPeopleControlPanel
                            unapprovedJoinRequests={joinRequestsData?.EventRoomJoinRequest ?? []}
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}

function BroadcastControlPanel({
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
                                <Button aria-label="Set stream layout to automatic mode">Use auto layout</Button>
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

function EventPeopleControlPanel({
    unapprovedJoinRequests,
}: {
    unapprovedJoinRequests: readonly EventRoomJoinRequestDetailsFragment[];
}): JSX.Element {
    return (
        <>
            <Heading as="h3" size="sm" my={2}>
                Raised hands
            </Heading>
            {unapprovedJoinRequests.length === 0 ? <>No hands are raised at the moment.</> : <></>}
            <List>
                {unapprovedJoinRequests.map((joinRequest) => (
                    <ListItem key={joinRequest.id}>
                        <JoinRequest joinRequest={joinRequest} />
                    </ListItem>
                ))}
            </List>
        </>
    );
}

gql`
    mutation ApproveEventRoomJoinRequest($eventRoomJoinRequestId: uuid!) {
        update_EventRoomJoinRequest_by_pk(pk_columns: { id: $eventRoomJoinRequestId }, _set: { approved: true }) {
            id
        }
    }
`;

function JoinRequest({ joinRequest }: { joinRequest: EventRoomJoinRequestDetailsFragment }): JSX.Element {
    const [loading, setLoading] = useState<boolean>(false);
    const [approveJoinRequestMutation] = useApproveEventRoomJoinRequestMutation();
    const toast = useToast();

    const approveJoinRequest = useCallback(async () => {
        setLoading(true);

        try {
            await approveJoinRequestMutation({
                variables: {
                    eventRoomJoinRequestId: joinRequest.id,
                },
            });
        } catch (e) {
            toast({
                title: "Could not approve join request",
                status: "error",
            });
        }
        setLoading(false);
    }, [approveJoinRequestMutation, joinRequest.id, toast]);

    return (
        <HStack my={2}>
            <FAIcon icon="hand-paper" iconStyle="s" />
            <Text>{joinRequest.attendee.displayName}</Text>
            <Button
                onClick={approveJoinRequest}
                aria-label={`Add ${joinRequest.attendee.displayName} to the event room`}
                isLoading={loading}
                p={0}
                colorScheme="green"
                size="xs"
            >
                <FAIcon icon="check-circle" iconStyle="s" />{" "}
            </Button>
        </HStack>
    );
}
