import { ContinuationDefaultFor } from "@clowdr-app/shared-types/build/continuation";
import React, { useEffect, useState } from "react";
import {
    RoomPage_RoomDetailsFragment,
    Room_EventSummaryFragment,
    Room_Mode_Enum,
    Schedule_EventProgramPersonRole_Enum,
} from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import ContinuationChoices from "../Continuation/ContinuationChoices";

export default function RoomContinuationChoices({
    currentRoomEvent,
    roomDetails,
    showBackstage,
    currentRegistrantId,
}: {
    currentRoomEvent: Room_EventSummaryFragment | null;
    roomDetails: RoomPage_RoomDetailsFragment;
    showBackstage: boolean;
    currentRegistrantId: string;
}): JSX.Element {
    const now5s = useRealTime(5000);
    const [continuationChoicesFrom, setContinuationChoicesFrom] = useState<
        | { eventId: string; itemId: string | null; endsAt: number }
        | { shufflePeriodId: string; shuffleRoomEndsAt: number }
        | null
    >(null);
    const [continuationIsBackstage, setContinuationIsBackstage] = useState<boolean>(false);
    const [continuationNoBackstage, setContinuationNoBackstage] = useState<boolean>(false);
    const [continuationRole, setContinuationRole] = useState<ContinuationDefaultFor>(ContinuationDefaultFor.None);

    useEffect(() => {
        if (currentRoomEvent) {
            const startTime = Date.parse(currentRoomEvent.startTime);
            if (now5s - startTime > 45000) {
                setContinuationChoicesFrom((old) =>
                    !old || !("eventId" in old) || old.eventId !== currentRoomEvent.id
                        ? {
                              eventId: currentRoomEvent.id,
                              itemId: currentRoomEvent.itemId ?? null,
                              endsAt: currentRoomEvent.endTime ? Date.parse(currentRoomEvent.endTime) : 0,
                          }
                        : old
                );
                const noBackstage =
                    currentRoomEvent.intendedRoomModeName !== Room_Mode_Enum.Presentation &&
                    currentRoomEvent.intendedRoomModeName !== Room_Mode_Enum.QAndA;
                setContinuationIsBackstage(showBackstage);
                setContinuationNoBackstage(noBackstage);
                const roleName = !noBackstage
                    ? currentRoomEvent?.eventPeople.find((x) => x.person?.registrantId === currentRegistrantId)
                          ?.roleName
                    : undefined;
                if (roleName === Schedule_EventProgramPersonRole_Enum.Chair) {
                    setContinuationRole(ContinuationDefaultFor.Chairs);
                } else if (roleName === Schedule_EventProgramPersonRole_Enum.Presenter) {
                    setContinuationRole(ContinuationDefaultFor.Presenters);
                } else if (!noBackstage) {
                    setContinuationRole(ContinuationDefaultFor.Viewers);
                } else {
                    setContinuationRole(ContinuationDefaultFor.None);
                }
            }
        } else if (roomDetails.shuffleRooms.length > 0) {
            setContinuationChoicesFrom((old) =>
                !old ||
                !("shufflePeriodId" in old) ||
                old.shufflePeriodId !== roomDetails.shuffleRooms[0].shufflePeriodId
                    ? {
                          shufflePeriodId: roomDetails.shuffleRooms[0].shufflePeriodId,
                          shuffleRoomEndsAt:
                              Date.parse(roomDetails.shuffleRooms[0].startedAt) +
                              roomDetails.shuffleRooms[0].durationMinutes * 60 * 1000,
                      }
                    : old
            );
            setContinuationIsBackstage(false);
            setContinuationNoBackstage(true);
            setContinuationRole(ContinuationDefaultFor.None);
        } else {
            setContinuationChoicesFrom((old) => (!old || ("endsAt" in old && now5s > old.endsAt + 45000) ? null : old));
        }
    }, [currentRoomEvent, roomDetails.shuffleRooms, now5s, showBackstage, currentRegistrantId]);

    return continuationChoicesFrom ? (
        <ContinuationChoices
            from={continuationChoicesFrom}
            isBackstage={continuationIsBackstage}
            noBackstage={continuationNoBackstage}
            currentRole={continuationRole}
            currentRoomId={roomDetails.id}
        />
    ) : (
        <></>
    );
}
