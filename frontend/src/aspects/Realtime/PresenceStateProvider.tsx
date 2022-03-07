import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthParameters } from "../GQL/AuthParameters";
import type { PresenceState } from "./PresenceState";
import { State } from "./PresenceState";

export const PresenceStateContext = React.createContext<PresenceState>(State);

export function usePresenceState(): PresenceState {
    return React.useContext(PresenceStateContext);
}

export function PresenceStateProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    useEffect(() => {
        State.setup();
        return () => {
            State.teardown();
        };
    }, []);

    const location = useLocation();
    useEffect(() => {
        // console.log("Page changed", location.pathname);
        State.pageChanged(location.pathname);
    }, [location.pathname]);

    const { conferenceId } = useAuthParameters();
    useEffect(() => {
        State.conferenceId = conferenceId ?? undefined;
    }, [conferenceId]);

    return <PresenceStateContext.Provider value={State}>{children}</PresenceStateContext.Provider>;
}
