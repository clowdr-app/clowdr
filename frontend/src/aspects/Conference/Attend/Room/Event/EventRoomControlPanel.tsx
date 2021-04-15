import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Portal,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import { RoomEventDetailsFragment, useGetEventParticipantStreamsSubscription } from "../../../../../generated/graphql";
import useQueryErrorToast from "../../../../GQL/useQueryErrorToast";
import { FAIcon } from "../../../../Icons/FAIcon";
import { BroadcastControlPanel } from "./BroadcastControlPanel";
import { LiveIndicator } from "./LiveIndicator";
import { useEventLiveStatus } from "./useEventLiveStatus";

export function EventRoomControlPanel({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    gql`
        subscription GetEventParticipantStreams($eventId: uuid!) {
            EventParticipantStream(where: { eventId: { _eq: $eventId } }) {
                ...EventParticipantStreamDetails
            }
        }

        fragment EventParticipantStreamDetails on EventParticipantStream {
            id
            attendee {
                id
                displayName
            }
            conferenceId
            eventId
            vonageStreamType
            vonageStreamId
            attendeeId
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
            attendeeId
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
    useQueryErrorToast(streamsError, true, "EventRoomControlBar:GetEventParticipantStreams");

    const { live } = useEventLiveStatus(event);

    return (
        <Box height="100%" p={2}>
            <LiveIndicator event={event} />

            <Popover placement="auto-end">
                <PopoverTrigger>
                    <VStack>
                        <Button
                            aria-label="Advanced broadcast controls"
                            title="Advanced broadcast controls"
                            textAlign="center"
                            mt={4}
                        >
                            <FAIcon icon="toolbox" iconStyle="s" />
                        </Button>
                    </VStack>
                </PopoverTrigger>
                <Portal>
                    <Box zIndex="500" position="relative">
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader>Broadcast controls</PopoverHeader>
                            <PopoverBody>
                                {streamsError ? <>Error loading streams.</> : streamsLoading ? <Spinner /> : undefined}
                                <BroadcastControlPanel
                                    live={live}
                                    streams={streamsData?.EventParticipantStream ?? null}
                                    eventVonageSessionId={event.eventVonageSession?.id ?? null}
                                />
                            </PopoverBody>
                        </PopoverContent>
                    </Box>
                </Portal>
            </Popover>
        </Box>
    );
}
