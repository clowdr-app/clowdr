import { gql } from "@apollo/client";
import { Button, Stack, Text, useToast } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    EventProgramPersonDetailsFragment,
    Room_EventSummaryFragment,
    Room_Mode_Enum,
    useMakeEventRoomJoinRequestMutation,
    useMyEventRoomJoinRequestSubscription,
} from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import useCurrentRegistrant from "../../useCurrentRegistrant";

gql`
    mutation MakeEventRoomJoinRequest($registrantId: uuid!, $conferenceId: uuid!, $eventId: uuid!) {
        insert_schedule_EventRoomJoinRequest_one(
            object: { registrantId: $registrantId, conferenceId: $conferenceId, eventId: $eventId }
        ) {
            id
        }
    }

    subscription MyEventRoomJoinRequest($registrantId: uuid!, $conferenceId: uuid!, $eventId: uuid!) {
        schedule_EventRoomJoinRequest(
            where: {
                registrantId: { _eq: $registrantId }
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
    eventPeople: readonly EventProgramPersonDetailsFragment[];
    onGoBackstage?: () => void;
}): JSX.Element {
    const [loading, setLoading] = useState<boolean>(false);
    const registrant = useCurrentRegistrant();
    const toast = useToast();

    const [makeEventRoomJoinRequestMutation] = useMakeEventRoomJoinRequestMutation();
    const makeEventRoomJoinRequest = useCallback(async () => {
        setLoading(true);

        try {
            await makeEventRoomJoinRequestMutation({
                variables: {
                    registrantId: registrant.id,
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
    }, [registrant.id, currentRoomEvent?.conferenceId, currentRoomEvent?.id, makeEventRoomJoinRequestMutation, toast]);

    const { data: eventRoomJoinRequestData, error } = useMyEventRoomJoinRequestSubscription({
        variables: {
            registrantId: registrant.id,
            conferenceId: currentRoomEvent?.conferenceId ?? "00000000-0000-0000-0000-000000000000",
            eventId: currentRoomEvent?.id ?? "00000000-0000-0000-0000-000000000000",
        },
    });
    useQueryErrorToast(error, true, "useMyEventRoomJoinRequestSubscription");

    const [myEventPeople, setMyEventPeople] = useState<EventProgramPersonDetailsFragment[] | null>(null);
    useEffect(() => {
        const people =
            eventPeople?.filter(
                (eventProgramPerson) =>
                    eventProgramPerson.eventId === currentRoomEvent?.id &&
                    registrant.id === eventProgramPerson.person.registrantId
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
    }, [registrant.id, currentRoomEvent?.id, eventPeople]);

    const roomModeName = useMemo(() => {
        switch (currentRoomEvent?.intendedRoomModeName) {
            case undefined:
            case Room_Mode_Enum.Exhibition:
            case Room_Mode_Enum.None:
            case Room_Mode_Enum.Shuffle:
            case Room_Mode_Enum.VideoPlayer:
                return "";
            case Room_Mode_Enum.Breakout:
                return "breakout";
            case Room_Mode_Enum.Prerecorded:
                return "prerecorded";
            case Room_Mode_Enum.QAndA:
                return "Q&A";
            case Room_Mode_Enum.Presentation:
                return "presentation";
            case Room_Mode_Enum.Zoom:
                return "Zoom";
        }
    }, [currentRoomEvent?.intendedRoomModeName]);

    return currentRoomEvent &&
        [Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(currentRoomEvent.intendedRoomModeName) ? (
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
        ) : eventRoomJoinRequestData?.schedule_EventRoomJoinRequest &&
          eventRoomJoinRequestData.schedule_EventRoomJoinRequest.length > 0 ? (
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
