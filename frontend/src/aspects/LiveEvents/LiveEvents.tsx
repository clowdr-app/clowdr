import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import type { ScheduleEventFragment } from "../../generated/graphql";
import { Order_By, useSelectSchedulePageQuery } from "../../generated/graphql";
import { useAuthParameters } from "../GQL/AuthParameters";
import { useRealTime } from "../Hooks/useRealTime";
import { roundDownToNearest, roundUpToNearest } from "../Utils/MathUtils";

interface LiveEventsContext {
    liveEvents: ReadonlyArray<ScheduleEventFragment>;
    upcomingEvents: ReadonlyArray<ScheduleEventFragment>;
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
    const { conferenceId } = useAuthParameters();

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

    const [response] = useSelectSchedulePageQuery({
        variables: {
            where: {
                conferenceId: { _eq: conferenceId },
                scheduledEndTime: { _gte: nowStr },
                scheduledStartTime: { _lte: nowCutoffStr },
            },
            includeAbstract: false,
            includeItemEvents: false,
            limit: 10000000,
            ordering: [{ scheduledStartTime: Order_By.Asc }, { scheduledEndTime: Order_By.Asc }],
        },
        pause: !conferenceId,
        requestPolicy: "cache-and-network",
    });

    const nowQuick = useRealTime(60 * 1000);
    const [liveEvents, setLiveEvents] = useState<ScheduleEventFragment[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEventFragment[]>([]);

    useEffect(() => {
        const newLiveEvents = response.data?.schedule_Event
            ? R.sortBy<ScheduleEventFragment>(
                  (x) => Date.parse(x.scheduledStartTime),
                  R.sortBy<ScheduleEventFragment>(
                      (x) => x.id,
                      R.filter(
                          (x) =>
                              Date.parse(x.scheduledStartTime) <= nowQuick + 60 * 1000 &&
                              Date.parse(x.scheduledEndTime) >= nowQuick - 60 * 1000,
                          response.data.schedule_Event
                      )
                  )
              )
            : [];
        const newUpcomingEvents = response.data?.schedule_Event
            ? R.sortBy<ScheduleEventFragment>(
                  (x) => Date.parse(x.scheduledStartTime),
                  R.sortBy<ScheduleEventFragment>(
                      (x) => x.id,
                      R.filter(
                          (x) => Date.parse(x.scheduledStartTime) > nowQuick + 60 * 1000,
                          response.data.schedule_Event
                      )
                  )
              )
            : [];

        setLiveEvents((oldLiveEvents) =>
            oldLiveEvents.length !== newLiveEvents.length ||
            newLiveEvents.some((x, idx) => idx >= oldLiveEvents.length || oldLiveEvents[idx].id !== x.id)
                ? newLiveEvents
                : oldLiveEvents
        );
        setUpcomingEvents((oldUpcomingEvents) =>
            oldUpcomingEvents.length !== newUpcomingEvents.length ||
            newUpcomingEvents.some((x, idx) => idx >= oldUpcomingEvents.length || oldUpcomingEvents[idx].id !== x.id)
                ? newUpcomingEvents
                : oldUpcomingEvents
        );
    }, [nowQuick, response.data?.schedule_Event]);

    const ctx = useMemo<LiveEventsContext>(
        () => ({
            liveEvents,
            upcomingEvents,
        }),
        [liveEvents, upcomingEvents]
    );
    return <context.Provider value={ctx}>{children}</context.Provider>;
}
