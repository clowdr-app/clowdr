import * as luxon from "luxon";
import React from "react";

interface ScheduleContext {
    timezone: luxon.Zone;
}

const scheduleContext = React.createContext<ScheduleContext | undefined>(undefined);

export function useSchedule(): ScheduleContext {
    const ctx = React.useContext(scheduleContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function ScheduleProvider({ children }: React.PropsWithChildren<Record<string, any>>): JSX.Element {
    const ctx = React.useMemo(
        () => ({
            timezone: new luxon.LocalZone(),
        }),
        []
    );

    return <scheduleContext.Provider value={ctx}>{children}</scheduleContext.Provider>;
}
