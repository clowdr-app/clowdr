import { gql } from "@apollo/client";
import { Box, HStack } from "@chakra-ui/react";
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
                <HStack alignItems="stretch" flexWrap="wrap">
                    <Box flexGrow={1}>
                        {event.eventVonageSession && sharedRoomContext ? (
                            <portals.OutPortal
                                node={sharedRoomContext.portalNode}
                                vonageSessionId={event.eventVonageSession.sessionId}
                                getAccessToken={getAccessToken}
                                disable={false}
                                isBackstageRoom={true}
                            />
                        ) : (
                            <>No room session available.</>
                        )}
                    </Box>
                    <Box>
                        <EventRoomControlPanel event={event} />
                    </Box>
                </HStack>
            )}
        </ApolloQueryWrapper>
    );
}
