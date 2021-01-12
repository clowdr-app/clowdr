import { gql } from "@apollo/client";
import { Badge, Box, HStack, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import {
    EventPersonDetailsFragment,
    EventPersonRole_Enum,
    RoomEventDetailsFragment,
    useGetEventParticipantStreamsSubscription,
    useUnapprovedEventRoomJoinRequestsSubscription,
} from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { BroadcastControlPanel } from "./BroadcastControlPanel";
import { EventPeopleControlPanel } from "./EventPeopleControlPanel";
import { LiveIndicator } from "./LiveIndicator";
import { useEventLiveStatus } from "./useEventLiveStatus";

export function EventRoomControlPanel({
    event,
    eventPeople,
    myRoles,
}: {
    event: RoomEventDetailsFragment;
    eventPeople: readonly EventPersonDetailsFragment[];
    myRoles: EventPersonRole_Enum[];
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

    const joinRequestCount = useMemo(() => joinRequestsData?.EventRoomJoinRequest.length ?? 0, [
        joinRequestsData?.EventRoomJoinRequest.length,
    ]);

    const { live } = useEventLiveStatus(event);

    return (
        <Box height="100%" p={2}>
            <LiveIndicator event={event} />
            <Tabs>
                <TabList>
                    <Tab>Broadcast layout</Tab>
                    <Tab>
                        People
                        <Badge ml={2} colorScheme={joinRequestCount > 0 ? "red" : "blue"}>
                            <HStack>
                                <FAIcon icon="hand-paper" iconStyle="s" fontSize="md" />
                                <Text>{joinRequestCount}</Text>
                            </HStack>
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
                            live={live}
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
                            eventPeople={eventPeople}
                            myRoles={myRoles}
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}
