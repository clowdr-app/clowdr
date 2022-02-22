import React from "react";
import type { VonageGlobalState } from "./VonageGlobalState";
import { State } from "./VonageGlobalState";

export const VonageGlobalStateContext = React.createContext<VonageGlobalState>(State);

export function useVonageGlobalState(): VonageGlobalState {
    return React.useContext(VonageGlobalStateContext);
}
export function VonageGlobalStateProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    return <VonageGlobalStateContext.Provider value={State}>{children}</VonageGlobalStateContext.Provider>;
}
