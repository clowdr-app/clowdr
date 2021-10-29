import type { ReactNode } from "react";
import React, { useEffect } from "react";
import type { RaiseHandState } from "./RaiseHandState";
import { State } from "./RaiseHandState";

export const RaiseHandStateContext = React.createContext<RaiseHandState>(State);

export function useRaiseHandState(): RaiseHandState {
    return React.useContext(RaiseHandStateContext);
}

export function RaiseHandProvider({ children }: { children?: ReactNode }): JSX.Element {
    useEffect(() => {
        State.setup();
        return () => {
            State.teardown();
        };
    }, []);

    return <RaiseHandStateContext.Provider value={State}>{children}</RaiseHandStateContext.Provider>;
}
