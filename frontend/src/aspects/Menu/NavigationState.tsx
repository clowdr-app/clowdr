import React, { useMemo, useState } from "react";

interface NavigationState {
    disabled: boolean;
    setDisabled: (update: boolean | ((old: boolean) => boolean)) => void;
}

const NavigationStateContext = React.createContext<NavigationState | undefined>(undefined);

export function useNavigationState(): NavigationState {
    const ctx = React.useContext(NavigationStateContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function NavigationStateProvider({ children }: { children: React.ReactNode | React.ReactNode[] }): JSX.Element {
    const [disabled, setDisabled] = useState<boolean>(false);
    const state = useMemo(
        () => ({
            disabled,
            setDisabled,
        }),
        [disabled]
    );
    return <NavigationStateContext.Provider value={state}>{children}</NavigationStateContext.Provider>;
}
