import React, { ReactNode, useEffect } from "react";
import { RaiseHandState, State } from "./RaiseHandState";

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
