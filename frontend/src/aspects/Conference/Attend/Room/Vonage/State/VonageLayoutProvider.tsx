import type { PropsWithChildren } from "react";
import React, { useMemo } from "react";
import { gql } from "urql";
import type { RoomOrEventId, VonageBroadcastLayout } from "./useVonageBroadcastLayout";
import { useVonageBroadcastLayout } from "./useVonageBroadcastLayout";
import type { VonageDisplay } from "./useVonageDisplay";
import { useVonageDisplay } from "./useVonageDisplay";

gql`
    query VonageLayoutProvider_GetLatestVonageSessionLayout($vonageSessionId: String!) {
        video_VonageSessionLayout(
            where: { vonageSessionId: { _eq: $vonageSessionId } }
            order_by: { created_at: desc }
            limit: 1
        ) {
            id
            layoutData
            created_at
            vonageSessionId
        }
    }

    mutation InsertVonageSessionLayout($vonageSessionId: String!, $conferenceId: uuid!, $layoutData: jsonb!) {
        insert_video_VonageSessionLayout(
            objects: { vonageSessionId: $vonageSessionId, conferenceId: $conferenceId, layoutData: $layoutData }
        ) {
            affected_rows
        }
    }
`;

export interface VonageLayout {
    layout: VonageBroadcastLayout;
    display: VonageDisplay;
}

export const VonageLayoutContext = React.createContext<VonageLayout | undefined>(undefined);

function useValue(vonageSessionId: string, type: RoomOrEventId | null): VonageLayout {
    const layout = useVonageBroadcastLayout(vonageSessionId, type);
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
    type,
    children,
}: PropsWithChildren<{ vonageSessionId: string; type: RoomOrEventId | null }>): JSX.Element {
    return (
        <VonageLayoutContext.Provider value={useValue(vonageSessionId, type)}>{children}</VonageLayoutContext.Provider>
    );
}

export function useVonageLayout(): VonageLayout {
    const ctx = React.useContext(VonageLayoutContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
