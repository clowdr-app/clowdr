import { gql } from "@apollo/client";
import { Button, Stack, Text, useToast } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    EventPersonDetailsFragment,
    RoomMode_Enum,
    Room_EventSummaryFragment,
    useMakeEventRoomJoinRequestMutation,
    useMyEventRoomJoinRequestSubscription,
} from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import useCurrentAttendee from "../../useCurrentAttendee";

gql`
    mutation MakeEventRoomJoinRequest($attendeeId: uuid!, $conferenceId: uuid!, $eventId: uuid!) {
        insert_EventRoomJoinRequest_one(
            object: { attendeeId: $attendeeId, conferenceId: $conferenceId, eventId: $eventId }
        ) {
            id
        }
    }

    subscription MyEventRoomJoinRequest($attendeeId: uuid!, $conferenceId: uuid!, $eventId: uuid!) {
        EventRoomJoinRequest(
            where: {
                attendeeId: { _eq: $attendeeId }
                conferenceId: { _eq: $conferenceId }
                eventId: { _eq: $eventId }
            }
        ) {
            id
            approved
        }
    }
`;

export function HandUpButton({
    currentRoomEvent,
    eventPeople,
    onGoBackstage,
}: {
    currentRoomEvent: Room_EventSummaryFragment | null;
    eventPeople: readonly EventPersonDetailsFragment[];
    onGoBackstage?: () => void;
}): JSX.Element {
    const [loading, setLoading] = useState<boolean>(false);
    const attendee = useCurrentAttendee();
    const toast = useToast();

    const [makeEventRoomJoinRequestMutation] = useMakeEventRoomJoinRequestMutation();
    const makeEventRoomJoinRequest = useCallback(async () => {
        setLoading(true);

        try {
            await makeEventRoomJoinRequestMutation({
                variables: {
                    attendeeId: attendee.id,
                    conferenceId: currentRoomEvent?.conferenceId,
                    eventId: currentRoomEvent?.id,
                },
            });
        } catch (e) {
            toast({
                title: "Could not request to join the room",
                status: "error",
            });
        }
        setLoading(false);
    }, [attendee.id, currentRoomEvent?.conferenceId, currentRoomEvent?.id, makeEventRoomJoinRequestMutation, toast]);

    const { data: eventRoomJoinRequestData, error } = useMyEventRoomJoinRequestSubscription({
        variables: {
            attendeeId: attendee.id,
            conferenceId: currentRoomEvent?.conferenceId ?? "00000000-0000-0000-0000-000000000000",
            eventId: currentRoomEvent?.id ?? "00000000-0000-0000-0000-000000000000",
        },
    });
    useQueryErrorToast(error, "useMyEventRoomJoinRequestSubscription");

    const [myEventPeople, setMyEventPeople] = useState<EventPersonDetailsFragment[] | null>(null);
    useEffect(() => {
        const people =
            eventPeople?.filter(
                (eventPerson) => eventPerson.eventId === currentRoomEvent?.id && attendee.id === eventPerson.attendeeId
            ) ?? [];

        if (myEventPeople && myEventPeople.length === 0 && people.length > 0) {
            toast({
                status: "success",
                title: "You have been granted access to go backstage",
                description: (
                    <Button onClick={onGoBackstage} colorScheme="teal" mt={2}>
                        Go backstage now
                    </Button>
                ),
                duration: 30000,
                isClosable: true,
                position: "bottom-right",
            });
        }

        setMyEventPeople(people);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendee.id, currentRoomEvent?.id, eventPeople]);

    const roomModeName = useMemo(() => {
        switch (currentRoomEvent?.intendedRoomModeName) {
            case undefined:
                return "";
            case RoomMode_Enum.Breakout:
                return "breakout";
            case RoomMode_Enum.Prerecorded:
                return "prerecorded";
            case RoomMode_Enum.QAndA:
                return "Q&A";
            case RoomMode_Enum.Presentation:
                return "presentation";
            case RoomMode_Enum.Zoom:
                return "Zoom";
        }
    }, [currentRoomEvent?.intendedRoomModeName]);

    return currentRoomEvent &&
        [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(currentRoomEvent.intendedRoomModeName) ? (
        myEventPeople && myEventPeople.length > 0 ? (
            onGoBackstage ? (
                <Button mt={5} size="lg" height="auto" py={5} onClick={onGoBackstage} colorScheme="green">
                    <Stack>
                        <Text fontSize="2xl">Join {roomModeName}</Text>
                        <Text fontSize="md">Go backstage to join</Text>
                    </Stack>
                </Button>
            ) : (
                <></>
            )
        ) : eventRoomJoinRequestData?.EventRoomJoinRequest &&
          eventRoomJoinRequestData.EventRoomJoinRequest.length > 0 ? (
            <Button mt={5} isDisabled={true} colorScheme="green">
                Waiting for join request to be approved
            </Button>
        ) : (
            <Button mt={5} isLoading={loading} onClick={makeEventRoomJoinRequest} colorScheme="green">
                Request to join {roomModeName} room
            </Button>
        )
    ) : (
        <></>
    );
}
