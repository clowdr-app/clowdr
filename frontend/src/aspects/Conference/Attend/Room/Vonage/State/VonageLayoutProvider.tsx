import type { PropsWithChildren } from "react";
import React, { useMemo } from "react";
import type { VonageBroadcastLayout } from "./useVonageBroadcastLayout";
import { useVonageBroadcastLayout } from "./useVonageBroadcastLayout";
import type { VonageDisplay } from "./useVonageDisplay";
import { useVonageDisplay } from "./useVonageDisplay";

export interface VonageLayout {
    layout: VonageBroadcastLayout;
    display: VonageDisplay;
}

export const VonageLayoutContext = React.createContext<VonageLayout | undefined>(undefined);

function useValue(vonageSessionId: string): VonageLayout {
    const layout = useVonageBroadcastLayout(vonageSessionId);
    const display = useVonageDisplay();

    return useMemo(
        (): VonageLayout => ({
            layout,
            display,
        }),
        [display, layout]
    );
}

export function VonageLayoutProvider({
    vonageSessionId,
    children,
}: PropsWithChildren<{ vonageSessionId: string }>): JSX.Element {
    return <VonageLayoutContext.Provider value={useValue(vonageSessionId)}>{children}</VonageLayoutContext.Provider>;
}

export function useVonageLayout(): VonageLayout {
    const ctx = React.useContext(VonageLayoutContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
