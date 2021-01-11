import { gql } from "@apollo/client";
import { Badge, Box, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";
import {
    EventPersonDetailsFragment,
    RoomEventDetailsFragment,
    useGetEventParticipantStreamsSubscription,
    useUnapprovedEventRoomJoinRequestsSubscription,
} from "../../../../../generated/graphql";
import { BroadcastControlPanel } from "./BroadcastControlPanel";
import { EventPeopleControlPanel } from "./EventPeopleControlPanel";
import { LiveIndicator } from "./LiveIndicator";

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
            <LiveIndicator event={event} />
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
