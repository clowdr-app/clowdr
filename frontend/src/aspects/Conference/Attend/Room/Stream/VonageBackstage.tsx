import { Box, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useCallback, useContext, useMemo } from "react";
import * as portals from "react-reverse-portal";
import type { RoomEventDetailsFragment } from "../../../../../generated/graphql";
import {
    Registrant_RegistrantRole_Enum,
    Schedule_EventProgramPersonRole_Enum,
    useGetEventDetailsQuery,
    useGetEventVonageTokenMutation,
} from "../../../../../generated/graphql";
import QueryWrapper from "../../../../GQL/QueryWrapper";
import { SharedRoomContext } from "../../../../Room/SharedRoomContextProvider";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import type { VonageRoom } from "../Vonage/VonageRoom";
import { BackstageControls } from "./Controls/BackstageControls";

gql`
    query GetEventDetails($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            ...RoomEventDetails
        }
    }

    fragment RoomEventDetails on schedule_Event {
        id
        conferenceId
        startTime
        name
        durationSeconds
        endTime
        intendedRoomModeName
        eventVonageSession {
            id
            sessionId
            eventId
        }
        eventPeople {
            id
            personId
            person {
                id
                registrantId
            }
            roleName
        }
    }
`;

export function VonageBackstage({
    eventId,
    isRaiseHandPreJoin = false,
    isRaiseHandWaiting,
    completeJoinRef,
    onLeave,
    hlsUri,
}: {
    eventId: string;
    isRaiseHandPreJoin?: boolean;
    isRaiseHandWaiting?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    onLeave?: () => void;
    hlsUri: string | undefined;
}): JSX.Element {
    const [result] = useGetEventDetailsQuery({
        variables: {
            eventId,
        },
        requestPolicy: "network-only",
    });

    return (
        <QueryWrapper queryResult={result} getter={(data) => data.schedule_Event_by_pk}>
            {(event: RoomEventDetailsFragment) => (
                <EventVonageRoomInner
                    event={event}
                    isRaiseHandPreJoin={isRaiseHandPreJoin}
                    isRaiseHandWaiting={isRaiseHandWaiting}
                    completeJoinRef={completeJoinRef}
                    onLeave={onLeave}
                    hlsUri={hlsUri}
                />
            )}
        </QueryWrapper>
    );
}

export function EventVonageRoomInner({
    event,
    isRaiseHandPreJoin = false,
    isRaiseHandWaiting,
    completeJoinRef,
    onLeave,
    hlsUri,
}: {
    event: RoomEventDetailsFragment;
    isRaiseHandPreJoin?: boolean;
    isRaiseHandWaiting?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    onLeave?: () => void;
    hlsUri: string | undefined;
}): JSX.Element {
    const [, getEventVonageToken] = useGetEventVonageTokenMutation();
    const registrant = useCurrentRegistrant();

    const getAccessToken = useCallback(async () => {
        const result = await getEventVonageToken({
            eventId: event.id,
            registrantId: registrant.id,
        });
        if (!result.data?.joinEventVonageSession?.accessToken) {
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinEventVonageSession.accessToken;
    }, [getEventVonageToken, event.id, registrant.id]);

    const sharedRoomContext = useContext(SharedRoomContext);

    const isPresenterOrChairOrOrganizer = useMemo(
        () =>
            registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ||
            event.eventPeople.some(
                (person) =>
                    person.person?.registrantId === registrant.id &&
                    person.roleName !== Schedule_EventProgramPersonRole_Enum.Participant
            ),
        [event.eventPeople, registrant.conferenceRole, registrant.id]
    );

    return (
        <VStack justifyContent="stretch" w="100%" alignItems="flex-start">
            {!isRaiseHandPreJoin ? <BackstageControls event={event} hlsUri={hlsUri} /> : undefined}
            <Box w="100%">
                {event.eventVonageSession && sharedRoomContext ? (
                    <portals.OutPortal<typeof VonageRoom>
                        node={sharedRoomContext.vonagePortalNode}
                        eventId={event.id}
                        vonageSessionId={event.eventVonageSession.sessionId}
                        getAccessToken={getAccessToken}
                        disable={false}
                        isBackstageRoom={true}
                        raiseHandPrejoinEventId={isRaiseHandPreJoin ? event.id : null}
                        isRaiseHandWaiting={isRaiseHandWaiting}
                        requireMicrophoneOrCamera={isRaiseHandPreJoin}
                        completeJoinRef={completeJoinRef}
                        onLeave={onLeave}
                        canControlRecording={isPresenterOrChairOrOrganizer}
                    />
                ) : (
                    <>No room session available.</>
                )}
            </Box>
        </VStack>
    );
}
