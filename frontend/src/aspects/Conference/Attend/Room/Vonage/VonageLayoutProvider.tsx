import { gql } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import {
    assertVonageSessionLayoutData,
    VonageSessionLayoutData,
    VonageSessionLayoutType,
} from "@clowdr-app/shared-types/build/vonage";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import {
    useInsertVonageSessionLayoutMutation,
    useVonageLayoutProvider_GetLatestVonageSessionLayoutQuery,
} from "../../../../../generated/graphql";
import { useConference } from "../../../useConference";

gql`
    query VonageLayoutProvider_GetLatestVonageSessionLayout($vonageSessionId: String!) {
        video_VonageSessionLayout(
            where: { vonageSessionId: { _eq: $vonageSessionId } }
            order_by: { created_at: desc }
            limit: 1
        ) {
            id
            layoutData
        }
    }

    mutation InsertVonageSessionLayout($vonageSessionId: String!, $conferenceId: uuid!, $layoutData: jsonb!) {
        insert_video_VonageSessionLayout_one(
            object: { vonageSessionId: $vonageSessionId, conferenceId: $conferenceId, layoutData: $layoutData }
        ) {
            id
        }
    }
`;

export interface VonageLayout {
    layout: VonageSessionLayoutData;
    updateLayout: (layout: VonageSessionLayoutData) => void;
    saveLayout: () => Promise<void>;
    broadcastLayoutMode: boolean;
}

export const VonageLayoutContext = React.createContext<VonageLayout | undefined>(undefined);

export function useVonageLayout(): VonageLayout {
    const ctx = React.useContext(VonageLayoutContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function VonageLayoutProvider({
    vonageSessionId,
    children,
    broadcastLayoutMode,
}: PropsWithChildren<{ vonageSessionId: string; broadcastLayoutMode: boolean }>): JSX.Element {
    const result = useVonageLayoutProvider_GetLatestVonageSessionLayoutQuery({
        variables: {
            vonageSessionId,
        },
    });
    const initialLayoutData = useMemo((): VonageSessionLayoutData | null => {
        if (!result.data?.video_VonageSessionLayout.length) {
            return null;
        }
        try {
            assertVonageSessionLayoutData(result.data.video_VonageSessionLayout[0].layoutData);
            return result.data.video_VonageSessionLayout[0].layoutData;
        } catch (e) {
            return null;
        }
    }, [result.data?.video_VonageSessionLayout]);
    const [layoutData, setLayoutData] = useState<VonageSessionLayoutData | null>(null);

    const currentLayout: VonageSessionLayoutData = useMemo(
        () =>
            layoutData ??
            initialLayoutData ?? { type: VonageSessionLayoutType.BestFit, screenShareType: "verticalPresentation" },
        [initialLayoutData, layoutData]
    );

    const [insertLayout] = useInsertVonageSessionLayoutMutation();
    const toast = useToast();
    const { id: conferenceId } = useConference();

    const saveLayout = useCallback(async () => {
        if (!vonageSessionId) {
            console.error("No Vonage session available for layout insert");
            throw new Error("No Vonage session available for layout insert");
        }

        try {
            await insertLayout({
                variables: {
                    conferenceId,
                    vonageSessionId,
                    layoutData,
                },
            });
        } catch (e) {
            console.error("Failed to insert Vonage layout", e);
            toast({
                status: "error",
                title: "Could not set the Vonage layout",
                description: "If this error persists, you may need to leave and re-enter the room.",
            });
        }
    }, [layoutData, conferenceId, vonageSessionId, toast, insertLayout]);

    const layout: VonageLayout = useMemo(
        () => ({
            layout: currentLayout,
            updateLayout: setLayoutData,
            saveLayout,
            broadcastLayoutMode,
        }),
        [currentLayout, saveLayout, broadcastLayoutMode]
    );

    useEffect(() => {
        setLayoutData(null);
    }, [vonageSessionId]);

    return <VonageLayoutContext.Provider value={layout}>{children}</VonageLayoutContext.Provider>;
}
