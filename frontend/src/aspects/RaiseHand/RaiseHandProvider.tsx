import React, { PropsWithChildren, useMemo } from "react";

interface RaiseHandContext {
    // TODO
}

const raiseHandContext = React.createContext<RaiseHandContext | undefined>(undefined);

export function useRaiseHand(): RaiseHandContext {
    const ctx = React.useContext(raiseHandContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function RaiseHandProvider({
    children,
}: PropsWithChildren<{
    // TODO
}>): JSX.Element {
    const ctx = useMemo(
        () => ({
            // TODO
        }),
        []
    );
    return <raiseHandContext.Provider value={ctx}>{children}</raiseHandContext.Provider>;
}
