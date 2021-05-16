import { gql } from "@apollo/client";
import { Box, VStack } from "@chakra-ui/react";
import React, { useCallback } from "react";
import * as portals from "react-reverse-portal";
import {
    RoomEventDetailsFragment,
    useGetEventDetailsQuery,
    useGetEventVonageTokenMutation,
} from "../../../../../generated/graphql";
import ApolloQueryWrapper from "../../../../GQL/ApolloQueryWrapper";
import { useSharedRoomContext } from "../../../../Room/useSharedRoomContext";
import { EventRoomControlPanel } from "./EventRoomControlPanel";

gql`
    mutation GetEventVonageToken($eventId: uuid!) {
        joinEventVonageSession(eventId: $eventId) {
            accessToken
        }
    }

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
        }
    }
`;

export function EventVonageRoom({
    eventId,
    isRaiseHandPreJoin = false,
    isRaiseHandWaiting,
    completeJoinRef,
}: {
    eventId: string;
    isRaiseHandPreJoin?: boolean;
    isRaiseHandWaiting?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
}): JSX.Element {
    const [getEventVonageToken] = useGetEventVonageTokenMutation({
        variables: {
            eventId: eventId,
        },
    });

    const result = useGetEventDetailsQuery({
        variables: {
            eventId,
        },
        fetchPolicy: "network-only",
    });

    const getAccessToken = useCallback(async () => {
        const result = await getEventVonageToken();
        if (!result.data?.joinEventVonageSession?.accessToken) {
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinEventVonageSession.accessToken;
    }, [getEventVonageToken]);

    const sharedRoomContext = useSharedRoomContext();

    return (
        <ApolloQueryWrapper queryResult={result} getter={(data) => data.schedule_Event_by_pk}>
            {(event: RoomEventDetailsFragment) => (
                <VStack justifyContent="stretch" w="100%">
                    {!isRaiseHandPreJoin ? <EventRoomControlPanel event={event} /> : undefined}
                    <Box w="100%">
                        {event.eventVonageSession && sharedRoomContext ? (
                            <portals.OutPortal
                                node={sharedRoomContext.vonagePortalNode}
                                vonageSessionId={event.eventVonageSession.sessionId}
                                getAccessToken={getAccessToken}
                                disable={false}
                                isBackstageRoom={true}
                                raiseHandPrejoinEventId={isRaiseHandPreJoin ? eventId : null}
                                isRaiseHandWaiting={isRaiseHandWaiting}
                                requireMicrophone={isRaiseHandPreJoin}
                                completeJoinRef={completeJoinRef}
                            />
                        ) : (
                            <>No room session available.</>
                        )}
                    </Box>
                </VStack>
            )}
        </ApolloQueryWrapper>
    );
}
