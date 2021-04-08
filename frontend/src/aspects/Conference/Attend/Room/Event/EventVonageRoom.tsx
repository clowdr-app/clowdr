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
        Event_by_pk(id: $eventId) {
            ...RoomEventDetails
        }
    }

    fragment RoomEventDetails on Event {
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

export function EventVonageRoom({ eventId }: { eventId: string }): JSX.Element {
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
        <ApolloQueryWrapper queryResult={result} getter={(data) => data.Event_by_pk}>
            {(event: RoomEventDetailsFragment) => (
                <VStack justifyContent="stretch" w="100%">
                    <EventRoomControlPanel event={event} />
                    <Box w="100%">
                        {event.eventVonageSession && sharedRoomContext ? (
                            <portals.OutPortal
                                node={sharedRoomContext.vonagePortalNode}
                                vonageSessionId={event.eventVonageSession.sessionId}
                                getAccessToken={getAccessToken}
                                disable={false}
                                isBackstageRoom={true}
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
