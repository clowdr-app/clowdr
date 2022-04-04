import { Box, Spinner, VStack } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useCallback, useContext, useMemo } from "react";
import * as portals from "react-reverse-portal";
import { useContextSelector } from "use-context-selector";
import type { Room_EventSummaryFragment } from "../../../../../generated/graphql";
import {
    Registrant_RegistrantRole_Enum,
    Schedule_EventProgramPersonRole_Enum,
    useGetEventVonageTokenMutation,
    useVonageBackstage_GetVonageSessionQuery,
} from "../../../../../generated/graphql";
import extractActualError from "../../../../GQL/ExtractActualError";
import { SharedRoomContext } from "../../../../Room/SharedRoomContextProvider";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { RecordingControlReason } from "../Vonage/State/VonageRoomProvider";
import type { VonageRoom } from "../Vonage/VonageRoom";
import { BackstageContext, BackstageProvider } from "./BackstageContext";
import { BackstageControls } from "./Controls/BackstageControls";

gql`
    query VonageBackstage_GetVonageSession($eventId: uuid!) @cached {
        schedule_Event_by_pk(id: $eventId) {
            ...Event_EventVonageSession
        }
    }

    fragment Event_EventVonageSession on schedule_Event {
        id
        roomId
        eventVonageSession {
            id
            sessionId
            eventId
        }
    }
`;

export function VonageBackstage({
    event,
    isRaiseHandPreJoin = false,
    isRaiseHandWaiting,
    completeJoinRef,
    onLeave,
    hlsUri,
}: {
    event: Room_EventSummaryFragment;
    isRaiseHandPreJoin?: boolean;
    isRaiseHandWaiting?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    onLeave?: () => void;
    hlsUri: string | undefined;
}): JSX.Element {
    const [result] = useVonageBackstage_GetVonageSessionQuery({
        variables: {
            eventId: event.id,
        },
    });

    return (
        <>
            {result.fetching || (!result.data?.schedule_Event_by_pk && result.stale) ? <Spinner /> : undefined}
            {result.data?.schedule_Event_by_pk ? (
                <BackstageProvider hlsUri={hlsUri} event={{ ...event, ...result.data.schedule_Event_by_pk }}>
                    <VonageBackstageInner
                        isRaiseHandPreJoin={isRaiseHandPreJoin}
                        isRaiseHandWaiting={isRaiseHandWaiting}
                        completeJoinRef={completeJoinRef}
                        onLeave={onLeave}
                    />
                </BackstageProvider>
            ) : undefined}
        </>
    );
}

export function VonageBackstageInner({
    isRaiseHandPreJoin = false,
    isRaiseHandWaiting,
    completeJoinRef,
    onLeave,
}: {
    isRaiseHandPreJoin?: boolean;
    isRaiseHandWaiting?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    onLeave?: () => void;
}): JSX.Element {
    const [, getEventVonageToken] = useGetEventVonageTokenMutation();
    const registrant = useCurrentRegistrant();
    const sharedRoomContext = useContext(SharedRoomContext);
    const event = useContextSelector(BackstageContext, (state) => state.event);

    const getAccessToken = useCallback(async () => {
        const result = await getEventVonageToken({
            eventId: event.id,
            registrantId: registrant.id,
        });
        if (!result.data?.joinEventVonageSession?.accessToken) {
            const error = extractActualError(result.error);
            if (error) {
                throw new Error(error);
            }
            throw new Error("No Vonage session ID");
        }
        return result.data?.joinEventVonageSession.accessToken;
    }, [getEventVonageToken, event.id, registrant.id]);

    const canControlRecordingAs = useMemo(() => {
        const reasons: Set<RecordingControlReason> = new Set();
        if (registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer) {
            reasons.add(RecordingControlReason.ConferenceOrganizer);
        }
        if (
            event.eventPeople.some(
                (person) =>
                    person.person?.registrantId === registrant.id &&
                    person.roleName !== Schedule_EventProgramPersonRole_Enum.Participant
            )
        ) {
            reasons.add(RecordingControlReason.EventPerson);
        }
        return reasons;
    }, [event.eventPeople, registrant.conferenceRole, registrant.id]);

    return (
        <VStack h="100%" justifyContent="stretch" w="100%" alignItems="flex-start">
            {!isRaiseHandPreJoin ? <BackstageControls /> : undefined}
            <Box w="100%" flexGrow={1}>
                {event.eventVonageSession && sharedRoomContext?.vonagePortalNode ? (
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
                        canControlRecordingAs={canControlRecordingAs}
                    />
                ) : (
                    <>No room session available.</>
                )}
            </Box>
        </VStack>
    );
}
