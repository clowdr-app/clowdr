import React, { useEffect } from "react";
import type { RealtimeService} from "./RealtimeService";
import { realtimeService } from "./RealtimeService";

export const RealtimeServiceContext = React.createContext<RealtimeService>(realtimeService);

export function useRealtimeService(): RealtimeService {
    return React.useContext(RealtimeServiceContext);
}

export function RealtimeServiceProvider({
    children,
    token,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    token: string;
}): JSX.Element {
    useEffect(() => {
        realtimeService.begin(token);
        return () => {
            realtimeService.end();
        };
    }, [token]);

    return <RealtimeServiceContext.Provider value={realtimeService}>{children}</RealtimeServiceContext.Provider>;
}
