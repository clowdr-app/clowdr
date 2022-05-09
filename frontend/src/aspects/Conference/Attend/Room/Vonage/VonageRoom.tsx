import { AuthHeader } from "@midspace/shared-types/auth";
import React, { useCallback, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { gql } from "urql";
import {
    useDeleteEventParticipantMutation,
    useSaveVonageRoomRecordingMutation,
} from "../../../../../generated/graphql";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import { makeContext } from "../../../../GQL/make-context";
import { useRaiseHandState } from "../../../../RaiseHand/RaiseHandProvider";
import { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import { PermissionInstructionsContext } from "../VideoChat/PermissionInstructionsContext";
import type { RoomOrEventId, VonageBroadcastLayout } from "./State/useVonageBroadcastLayout";
import { VonageComputedStateProvider } from "./State/VonageComputedStateContext";
import { VonageLayoutProvider } from "./State/VonageLayoutProvider";
import type { RecordingControlRoles } from "./State/VonageRoomProvider";
import { VonageRoomProvider } from "./State/VonageRoomProvider";
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
    canControlRecordingAs,
    eventIsFuture,
    extraLayoutButtons,
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
    canControlRecordingAs: RecordingControlRoles;
    layout?: VonageBroadcastLayout;
    eventIsFuture?: boolean;
    extraLayoutButtons?: JSX.Element;
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
                saveVonageRoomRecording(
                    {
                        recordingId,
                        registrantId: mRegistrant.id,
                    },
                    makeContext({
                        [AuthHeader.IncludeRoomIds]: "true",
                    })
                );
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

    const roomType = useMemo(
        (): RoomOrEventId | null =>
            roomId
                ? eventId && !eventIsFuture
                    ? {
                          type: "room-with-event",
                          roomId,
                          eventId,
                      }
                    : {
                          type: "room",
                          id: roomId,
                      }
                : eventId
                ? {
                      type: "event",
                      id: eventId,
                  }
                : null,
        [eventId, eventIsFuture, roomId]
    );

    return mRegistrant ? (
        <VonageRoomProvider
            onPermissionsProblem={onPermissionsProblem}
            isBackstageRoom={isBackstageRoom}
            canControlRecordingAs={canControlRecordingAs}
            joinRoomButtonText={
                isBackstageRoom ? (raiseHandPrejoinEventId ? "I'm ready" : "Connect to the backstage") : undefined
            }
            joiningRoomButtonText={undefined}
            requireMicrophoneOrCamera={requireMicrophoneOrCamera}
            completeGetAccessToken={completeGetAccessToken}
            eventIsFuture={eventIsFuture}
            eventId={eventId ?? undefined}
            roomId={roomId ?? undefined}
            extraLayoutButtons={extraLayoutButtons ?? undefined}
        >
            <ChatProfileModalProvider>
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
                    <VonageLayoutProvider
                        vonageSessionId={vonageSessionId}
                        type={roomType}
                        canControlRecordingAs={canControlRecordingAs}
                    >
                        <AutoplayProvider>
                            <VonageVideoPlaybackProvider
                                vonageSessionId={vonageSessionId}
                                canControlPlaybackAs={canControlRecordingAs}
                            >
                                <VonageRoomInner stop={!roomCouldBeInUse || disable} />
                            </VonageVideoPlaybackProvider>
                        </AutoplayProvider>
                    </VonageLayoutProvider>
                </VonageComputedStateProvider>
            </ChatProfileModalProvider>
        </VonageRoomProvider>
    ) : (
        <></>
    );
}
