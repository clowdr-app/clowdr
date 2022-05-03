import * as R from "ramda";
import React, { useMemo } from "react";
import type { ItemPresentationFragment, ScheduleEventFragment } from "../../../../generated/graphql";
import ScheduleList from "../Schedule/ScheduleList";

export function ItemEvents({
    sessions,
    presentations,
    autoExpandPresentations = true,
    currentRoomId,
}: {
    sessions: readonly ScheduleEventFragment[];
    presentations: readonly ItemPresentationFragment[];
    autoExpandPresentations?: boolean;
    currentRoomId?: string;
}): JSX.Element {
    const allSessions = useMemo(
        () =>
            R.sortBy<ScheduleEventFragment>(
                (x) => x.scheduledStartTime,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                R.uniqBy((x) => x.id, [...sessions, ...presentations.filter((x) => !!x.session).map((x) => x.session!)])
            ),
        [presentations, sessions]
    );
    return allSessions.length ? (
        <ScheduleList
            events={allSessions}
            includeTypeName
            autoExpandPresentations={autoExpandPresentations}
            includeAbstract={false}
            currentRoomId={currentRoomId}
            promptMoveOnLiveEvent={true}
        />
    ) : (
        <></>
    );
}
