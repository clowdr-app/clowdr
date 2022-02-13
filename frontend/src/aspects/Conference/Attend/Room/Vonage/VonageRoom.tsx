import React, { useCallback, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { gql } from "urql";
import {
    useDeleteEventParticipantMutation,
    useSaveVonageRoomRecordingMutation,
} from "../../../../../generated/graphql";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import { useRaiseHandState } from "../../../../RaiseHand/RaiseHandProvider";
import { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import { PermissionInstructionsContext } from "../VideoChat/PermissionInstructionsContext";
import { VonageComputedStateProvider } from "./State/VonageComputedStateContext";
import type { VonageLayout } from "./State/VonageLayoutProvider";
import { VonageLayoutProvider } from "./State/VonageLayoutProvider";
import { VonageRoomStateProvider } from "./State/VonageRoomProvider";
import type { CompleteGetAccessToken } from "./useGetAccessToken";
import { AutoplayProvider } from "./VideoPlayback/AutoplayContext";
import { VonageVideoPlaybackProvider } from "./VideoPlayback/VonageVideoPlaybackContext";
import { VonageRoomInner } from "./VonageRoomInner";

gql`
    mutation DeleteEventParticipant($eventId: uuid!, $registrantId: uuid!) {
        delete_schedule_EventProgramPerson(
            where: {
                eventId: { _eq: $eventId }
                person: { registrantId: { _eq: $registrantId } }
                roleName: { _eq: PARTICIPANT }
            }
        ) {
            returning {
                id
            }
        }
    }

    mutation SaveVonageRoomRecording($recordingId: uuid!, $registrantId: uuid!) {
        insert_registrant_SavedVonageRoomRecording_one(
            object: { recordingId: $recordingId, registrantId: $registrantId }
            on_conflict: { constraint: SavedVonageRoomRecording_recordingId_registrantId_key, update_columns: [] }
        ) {
            id
            recordingId
            registrantId
            isHidden
        }
    }
`;

export function VonageRoom({
    roomId,
    eventId,
    vonageSessionId,
    getAccessToken,
    disable,
    isBackstageRoom,
    raiseHandPrejoinEventId,
    isRaiseHandWaiting,
    requireMicrophoneOrCamera = false,
    completeJoinRef,
    completeGetAccessToken,
    onLeave,
    canControlRecording,
    eventIsFuture,
}: {
    roomId: string | null;
    eventId: string | null;
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
    disable: boolean;
    isBackstageRoom: boolean;
    raiseHandPrejoinEventId: string | null;
    isRaiseHandWaiting?: boolean;
    requireMicrophoneOrCamera?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    completeGetAccessToken?: CompleteGetAccessToken | null;
    onLeave?: () => void;
    canControlRecording: boolean;
    layout?: VonageLayout;
    eventIsFuture?: boolean;
}): JSX.Element {
    const mRegistrant = useMaybeCurrentRegistrant();

    const location = useLocation();
    const locationParts = (location.pathname.startsWith("/") ? location.pathname.substr(1) : location.pathname).split(
        "/"
    );
    // Array(5) [ "conference", "demo2021", "room", "96b73184-a5ae-4356-81d7-5f99689d1413" ]
    const roomCouldBeInUse = locationParts[0] === "conference" && locationParts[2] === "room";

    const raiseHand = useRaiseHandState();

    const [, deleteEventParticipant] = useDeleteEventParticipantMutation();

    const { onPermissionsProblem } = useContext(PermissionInstructionsContext);

    const [, saveVonageRoomRecording] = useSaveVonageRoomRecordingMutation();

    const onRecordingIdReceived = useCallback(
        (recordingId: string) => {
            if (mRegistrant) {
                saveVonageRoomRecording({
                    recordingId,
                    registrantId: mRegistrant.id,
                });
            }
        },
        [mRegistrant, saveVonageRoomRecording]
    );

    const cancelJoin = useMemo(
        () =>
            isBackstageRoom && raiseHandPrejoinEventId
                ? () => {
                      if (raiseHandPrejoinEventId) {
                          raiseHand.lower(raiseHandPrejoinEventId);
                      }
                  }
                : undefined,
        [isBackstageRoom, raiseHand, raiseHandPrejoinEventId]
    );

    return mRegistrant ? (
        <VonageRoomStateProvider
            onPermissionsProblem={onPermissionsProblem}
            isBackstageRoom={isBackstageRoom}
            canControlRecording={canControlRecording}
            joinRoomButtonText={
                isBackstageRoom ? (raiseHandPrejoinEventId ? "I'm ready" : "Connect to the backstage") : undefined
            }
            joiningRoomButtonText={undefined}
            requireMicrophoneOrCamera={requireMicrophoneOrCamera}
            completeGetAccessToken={completeGetAccessToken}
            eventIsFuture={eventIsFuture}
            eventId={eventId ?? undefined}
            roomId={roomId ?? undefined}
        >
            <ChatProfileModalProvider>
                <VonageLayoutProvider vonageSessionId={vonageSessionId}>
                    <VonageComputedStateProvider
                        getAccessToken={getAccessToken}
                        vonageSessionId={vonageSessionId}
                        overrideJoining={
                            isBackstageRoom && raiseHandPrejoinEventId && isRaiseHandWaiting ? true : undefined
                        }
                        beginJoin={
                            isBackstageRoom && raiseHandPrejoinEventId
                                ? () => {
                                      if (raiseHandPrejoinEventId) {
                                          raiseHand.raise(raiseHandPrejoinEventId);
                                      }
                                  }
                                : undefined
                        }
                        completeJoinRef={completeJoinRef}
                        onRoomJoined={
                            isBackstageRoom && eventId
                                ? (joined) => {
                                      if (!joined) {
                                          if (eventId) {
                                              deleteEventParticipant({
                                                  eventId,
                                                  registrantId: mRegistrant.id,
                                              });
                                          }

                                          onLeave?.();
                                      }
                                  }
                                : undefined
                        }
                        cancelJoin={cancelJoin}
                        onRecordingIdReceived={onRecordingIdReceived}
                    >
                        <AutoplayProvider>
                            <VonageVideoPlaybackProvider
                                vonageSessionId={vonageSessionId}
                                canControlPlayback={canControlRecording}
                            >
                                <VonageRoomInner
                                    stop={!roomCouldBeInUse || disable}
                                    roomId={roomId ?? undefined}
                                    eventId={eventId ?? undefined}
                                />
                            </VonageVideoPlaybackProvider>
                        </AutoplayProvider>
                    </VonageComputedStateProvider>
                </VonageLayoutProvider>
            </ChatProfileModalProvider>
        </VonageRoomStateProvider>
    ) : (
        <></>
    );
}
