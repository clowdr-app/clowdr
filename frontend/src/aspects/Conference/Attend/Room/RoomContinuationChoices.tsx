import type { ExtendedContinuationTo } from "@midspace/shared-types/continuation";
import { ContinuationDefaultFor } from "@midspace/shared-types/continuation";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
    ContinuationChoices_ContinuationFragment,
    RoomPage_RoomDetailsFragment,
    Room_EventSummaryFragment,
} from "../../../../generated/graphql";
import { Schedule_EventProgramPersonRole_Enum, Schedule_Mode_Enum } from "../../../../generated/graphql";
import { useRealTime } from "../../../Hooks/useRealTime";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import ContinuationChoices from "../Continuation/ContinuationChoices";

export default function RoomContinuationChoices({
    currentRoomEvent,
    nextRoomEvent,
    roomDetails,
    showBackstage,
    currentRegistrantId,
    currentBackstageEventId,
    moveToNextBackstage,
}: {
    currentRoomEvent: Room_EventSummaryFragment | null;
    nextRoomEvent: Room_EventSummaryFragment | null;
    roomDetails: RoomPage_RoomDetailsFragment;
    showBackstage: boolean;
    currentRegistrantId: string;
    currentBackstageEventId: string | null;
    moveToNextBackstage?: () => void;
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
    const [extraChoices, setExtraChoices] = useState<{
        eventId: string | null;
        choices: readonly ContinuationChoices_ContinuationFragment[];
    }>({
        eventId: null,
        choices: [],
    });
    const [supressContinuationChoices, setSuppressContinuationChoices] = useState<boolean>(false);

    const currentRegistrant = useCurrentRegistrant();

    useEffect(() => {
        if (currentRoomEvent) {
            const nextEventHasBackstage = nextRoomEvent?.modeName === Schedule_Mode_Enum.Livestream;

            setSuppressContinuationChoices(nextEventHasBackstage && nextRoomEvent?.id === currentBackstageEventId);

            const scheduledStartTime = Date.parse(currentRoomEvent.scheduledStartTime);
            if (now5s - scheduledStartTime > 30000) {
                setContinuationChoicesFrom((old) =>
                    !old || !("eventId" in old) || old.eventId !== currentRoomEvent.id
                        ? {
                              eventId: currentRoomEvent.id,
                              itemId: currentRoomEvent.itemId ?? null,
                              endsAt: currentRoomEvent.scheduledEndTime
                                  ? Date.parse(currentRoomEvent.scheduledEndTime)
                                  : 0,
                          }
                        : old
                );
                const noBackstage = currentRoomEvent.modeName !== Schedule_Mode_Enum.Livestream;

                const currentRegistrantIsNeededOnNextEventBackstage =
                    nextEventHasBackstage &&
                    !!nextRoomEvent?.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id);
                const includeAutoMoveBackstageContinuation =
                    showBackstage &&
                    currentRegistrantIsNeededOnNextEventBackstage &&
                    nextRoomEvent?.id !== currentBackstageEventId;
                if (includeAutoMoveBackstageContinuation) {
                    setExtraChoices((old) =>
                        old?.eventId !== currentRoomEvent.id
                            ? {
                                  eventId: currentRoomEvent.id,
                                  choices: [
                                      {
                                          colour: "#B9095B",
                                          defaultFor: ContinuationDefaultFor.All,
                                          description: "Move to your next backstage",
                                          id: uuidv4(),
                                          isActiveChoice: false,
                                          priority: Number.NEGATIVE_INFINITY,
                                          to: {
                                              type: "function",
                                              f: moveToNextBackstage,
                                          } as ExtendedContinuationTo,
                                      },
                                  ],
                              }
                            : old
                    );
                } else {
                    setExtraChoices({
                        eventId: null,
                        choices: [],
                    });
                }

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
            setContinuationChoicesFrom((old) => (!old || ("endsAt" in old && now5s > old.endsAt + 30000) ? null : old));
        }
    }, [
        currentRoomEvent,
        roomDetails.shuffleRooms,
        now5s,
        showBackstage,
        currentRegistrantId,
        nextRoomEvent?.modeName,
        nextRoomEvent?.eventPeople,
        currentRegistrant.id,
        moveToNextBackstage,
        nextRoomEvent?.id,
        currentBackstageEventId,
    ]);

    return continuationChoicesFrom && !supressContinuationChoices ? (
        <ContinuationChoices
            from={continuationChoicesFrom}
            isBackstage={continuationIsBackstage}
            noBackstage={continuationNoBackstage}
            currentRole={continuationRole}
            currentRoomId={roomDetails.id}
            extraChoices={extraChoices.choices}
        />
    ) : (
        <></>
    );
}
