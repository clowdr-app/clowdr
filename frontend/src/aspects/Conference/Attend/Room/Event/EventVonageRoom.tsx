import { gql } from "@apollo/client";
import { Box, HStack } from "@chakra-ui/react";
import React, { useCallback } from "react";
import {
    EventPersonRole_Enum,
    RoomEventDetailsFragment,
    useGetEventVonageTokenMutation,
} from "../../../../../generated/graphql";
import useUserId from "../../../../Auth/useUserId";
import { useEventRoles } from "../../../../Event/useEventRole";
import { OpenTokProvider } from "../../../../Vonage/OpenTokProvider";
import { VonageRoom } from "../Vonage/VonageRoom";
import { EventRoomControlPanel } from "./EventRoomControlPanel";

gql`
    mutation GetEventVonageToken($eventId: uuid!) {
        joinEventVonageSession(eventId: $eventId) {
            accessToken
        }
    }
`;

export function EventVonageRoom({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    const [getEventVonageToken] = useGetEventVonageTokenMutation({
        variables: {
            eventId: event.id,
        },
    });

    const userId = useUserId();
    const { roles } = useEventRoles(userId ?? "", event);

    const getAccessToken = useCallback(async () => {
        const result = await getEventVonageToken();
        if (!result.data?.joinEventVonageSession?.accessToken) {
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinEventVonageSession.accessToken;
    }, [getEventVonageToken]);

    return event.eventVonageSession ? (
        <OpenTokProvider>
            <HStack alignItems="stretch">
                <Box flexGrow={1}>
                    <VonageRoom vonageSessionId={event.eventVonageSession.sessionId} getAccessToken={getAccessToken} />
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
    ) : (
        <>No video session exists </>
    );
}
