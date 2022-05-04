import type { PropsWithChildren } from "react";
import React, { useMemo } from "react";
import { gql } from "urql";
import type { RoomOrEventId, VonageBroadcastLayout } from "./useVonageBroadcastLayout";
import { useVonageBroadcastLayout } from "./useVonageBroadcastLayout";
import type { VonageDisplay } from "./useVonageDisplay";
import { useVonageDisplay } from "./useVonageDisplay";
import type { RecordingControlRoles } from "./VonageRoomProvider";

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

    mutation InsertVonageSessionLayout(
        $vonageSessionId: String!
        $conferenceId: uuid!
        $layoutData: jsonb!
        $subconferenceId: uuid
    ) {
        insert_video_VonageSessionLayout(
            objects: {
                vonageSessionId: $vonageSessionId
                conferenceId: $conferenceId
                layoutData: $layoutData
                subconferenceId: $subconferenceId
            }
        ) {
            affected_rows
        }
    }
`;

export interface VonageLayout {
    layout: VonageBroadcastLayout;
    display: VonageDisplay;
}

export interface Props {
    vonageSessionId: string;
    type: RoomOrEventId | null;
    canControlRecordingAs: RecordingControlRoles;
}

export const VonageLayoutContext = React.createContext<VonageLayout | undefined>(undefined);

function useValue(props: Props): VonageLayout {
    const layout = useVonageBroadcastLayout(props.vonageSessionId, props.type, props.canControlRecordingAs);
    const display = useVonageDisplay();

    return useMemo(
        (): VonageLayout => ({
            layout,
            display,
        }),
        [display, layout]
    );
}

export function VonageLayoutProvider(props: PropsWithChildren<Props>): JSX.Element {
    return <VonageLayoutContext.Provider value={useValue(props)}>{props.children}</VonageLayoutContext.Provider>;
}

export function useVonageLayout(): VonageLayout {
    const ctx = React.useContext(VonageLayoutContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
