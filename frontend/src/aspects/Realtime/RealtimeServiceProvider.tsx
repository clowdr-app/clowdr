import React, { useEffect } from "react";
import type { RealtimeService } from "./RealtimeService";
import { realtimeService } from "./RealtimeService";

export const RealtimeServiceContext = React.createContext<RealtimeService>(realtimeService);

export function useRealtimeService(): RealtimeService {
    return React.useContext(RealtimeServiceContext);
}

export function RealtimeServiceProvider({
    children,
    token,
    reconnect,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    token: string | null;
    reconnect: () => Promise<void>;
}): JSX.Element {
    useEffect(() => {
        if (token) {
            realtimeService.begin(token);
        }
        return () => {
            realtimeService.end();
        };
    }, [token]);

    useEffect(() => {
        realtimeService.setReconnect(reconnect);
    }, [reconnect]);

    return <RealtimeServiceContext.Provider value={realtimeService}>{children}</RealtimeServiceContext.Provider>;
}
