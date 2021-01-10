import { gql } from "@apollo/client";
import { Box, HStack } from "@chakra-ui/react";
import React, { useCallback } from "react";
import {
    EventPersonRole_Enum,
    RoomEventDetailsFragment,
    useGetEventDetailsQuery,
    useGetEventVonageTokenMutation,
} from "../../../../../generated/graphql";
import useUserId from "../../../../Auth/useUserId";
import { useEventRoles } from "../../../../Event/useEventRole";
import ApolloQueryWrapper from "../../../../GQL/ApolloQueryWrapper";
import { OpenTokProvider } from "../../../../Vonage/OpenTokProvider";
import { VonageRoomStateProvider } from "../../../../Vonage/useVonageRoom";
import { VonageRoom } from "../Vonage/VonageRoom";
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
    });

    const userId = useUserId();
    const { roles } = useEventRoles(userId ?? "", result.data?.Event_by_pk ?? null);

    const getAccessToken = useCallback(async () => {
        const result = await getEventVonageToken();
        if (!result.data?.joinEventVonageSession?.accessToken) {
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinEventVonageSession.accessToken;
    }, [getEventVonageToken]);

    return (
        <ApolloQueryWrapper queryResult={result} getter={(data) => data.Event_by_pk}>
            {(event: RoomEventDetailsFragment) => (
                <VonageRoomStateProvider>
                    <OpenTokProvider>
                        <HStack alignItems="stretch">
                            <Box flexGrow={1}>
                                {event.eventVonageSession ? (
                                    <VonageRoom
                                        vonageSessionId={event.eventVonageSession.sessionId}
                                        getAccessToken={getAccessToken}
                                    />
                                ) : (
                                    <>No room session available.</>
                                )}
                            </Box>
                            {roles.find(
                                (role) => role === EventPersonRole_Enum.Chair || role === EventPersonRole_Enum.Presenter
                            ) ? (
                                <Box width="20%">
                                    <EventRoomControlPanel event={event} />
                                </Box>
                            ) : (
                                <></>
                            )}
                        </HStack>
                    </OpenTokProvider>
                </VonageRoomStateProvider>
            )}
        </ApolloQueryWrapper>
    );
}
