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
import { useVonageLayout, VonageLayoutProvider } from "../Vonage/VonageLayoutProvider";
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
    const result = useGetEventDetailsQuery({
        variables: {
            eventId,
        },
        fetchPolicy: "network-only",
    });

    return (
        <ApolloQueryWrapper queryResult={result} getter={(data) => data.schedule_Event_by_pk}>
            {(event: RoomEventDetailsFragment) =>
                event.eventVonageSession ? (
                    <VonageLayoutProvider vonageSessionId={event.eventVonageSession.sessionId}>
                        <EventVonageRoomInner
                            event={event}
                            isRaiseHandPreJoin={isRaiseHandPreJoin}
                            isRaiseHandWaiting={isRaiseHandWaiting}
                            completeJoinRef={completeJoinRef}
                            onLeave={onLeave}
                            hlsUri={hlsUri}
                        />
                    </VonageLayoutProvider>
                ) : (
                    <>No room session available.</>
                )
            }
        </ApolloQueryWrapper>
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
    const [getEventVonageToken] = useGetEventVonageTokenMutation({
        variables: {
            eventId: event.id,
        },
    });

    const getAccessToken = useCallback(async () => {
        const result = await getEventVonageToken();
        if (!result.data?.joinEventVonageSession?.accessToken) {
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinEventVonageSession.accessToken;
    }, [getEventVonageToken]);

    const sharedRoomContext = useSharedRoomContext();
    const layout = useVonageLayout();

    return (
        <VStack justifyContent="stretch" w="100%">
            {!isRaiseHandPreJoin ? <BackstageControls event={event} hlsUri={hlsUri} /> : undefined}
            <Box w="100%">
                {event.eventVonageSession && sharedRoomContext ? (
                    <portals.OutPortal
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
                        layout={layout}
                    />
                ) : (
                    <>No room session available.</>
                )}
            </Box>
        </VStack>
    );
}
