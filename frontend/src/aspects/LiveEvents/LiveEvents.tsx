import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import type { MinimalEventInfoFragment } from "../../generated/graphql";
import { useGetEventsInNextHourQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { roundDownToNearest, roundUpToNearest } from "../Generic/MathUtils";
import { useRealTime } from "../Generic/useRealTime";

gql`
    query GetEventsInNextHour($conferenceId: uuid!, $now: timestamptz!, $cutoff: timestamptz!) {
        schedule_Event(
            where: { conferenceId: { _eq: $conferenceId }, endTime: { _gte: $now }, startTime: { _lte: $cutoff } }
        ) {
            ...MinimalEventInfo
        }
    }

    fragment MinimalEventInfo on schedule_Event {
        id
        conferenceId
        startTime
        endTime
        roomId
        room {
            id
            name
        }
    }
`;

interface LiveEventsContext {
    liveEventsByRoom: Record<string, MinimalEventInfoFragment[]>;
    liveEventsInNextHour: readonly MinimalEventInfoFragment[];
}

const context = React.createContext<LiveEventsContext | undefined>(undefined);

export function useLiveEvents(): LiveEventsContext {
    const ctx = React.useContext(context);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

const refetchEventsInterval = 30 * 60 * 1000;
export function LiveEventsProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const conference = useConference();

    const nowSlow = useRealTime(refetchEventsInterval);
    // Load events from the nearest N-minute boundary onwards
    // Note: Rounding is necessary to ensure a consistent time string is sent to the Query hook
    //       so re-renders don't cause multiple (very slightly offset) queries to the database in
    //       quick succession.
    // Note: Rounding _down_ is necessary so that any currently ongoing event doesn't accidentally get
    //       excluded from the results if this query happens to re-run in the last 59 seconds of an event!
    const nowStr = useMemo(() => new Date(roundDownToNearest(nowSlow, refetchEventsInterval)).toISOString(), [nowSlow]);
    const nowCutoffStr = useMemo(
        // Load events up to 1 hour in the future
        // Note: Rounding is necessary to ensure a consistent time string is sent to the Query hook
        //       so re-renders don't cause spam to the database.
        // Note: Rounding up makes sense as it's the dual of the round down above, but it's not strictly
        //       necessary - any rounding would do.
        () => new Date(roundUpToNearest(nowSlow + 60 * 60 * 1000, refetchEventsInterval)).toISOString(),
        [nowSlow]
    );

    const [response] = useGetEventsInNextHourQuery({
        variables: {
            conferenceId: conference.id,
            now: nowStr,
            cutoff: nowCutoffStr,
        },
    });

    const nowQuick = useRealTime(60 * 1000);
    const [liveEvents, setLiveEvents] = useState<MinimalEventInfoFragment[]>([]);

    useEffect(() => {
        const newActiveEvents = response.data?.schedule_Event
            ? R.sortBy<MinimalEventInfoFragment>(
                  (x) => Date.parse(x.startTime),
                  R.sortBy<MinimalEventInfoFragment>(
                      (x) => x.id,
                      R.filter(
                          (x) =>
                              Date.parse(x.startTime) <= nowQuick + 10 * 60 * 1000 &&
                              Date.parse(x.endTime) >= nowQuick - 2 * 60 * 1000,
                          response.data.schedule_Event
                      )
                  )
              )
            : [];

        setLiveEvents((oldActiveEvents) =>
            oldActiveEvents.length !== newActiveEvents.length ||
            newActiveEvents.some((x, idx) => idx >= oldActiveEvents.length || oldActiveEvents[idx].id !== x.id)
                ? newActiveEvents
                : oldActiveEvents
        );
    }, [nowQuick, response.data?.schedule_Event]);

    const ctx = useMemo<LiveEventsContext>(
        () => ({
            liveEventsByRoom: R.groupBy(
                (x) => x.room.id,
                liveEvents.filter((x) => !!x.room)
            ),
            liveEventsInNextHour: response.data?.schedule_Event ?? [],
        }),
        [liveEvents, response.data?.schedule_Event]
    );
    return <context.Provider value={ctx}>{children}</context.Provider>;
}
