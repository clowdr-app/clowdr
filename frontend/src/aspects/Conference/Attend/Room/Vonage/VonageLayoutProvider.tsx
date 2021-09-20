import { gql } from "@apollo/client";
import {
    assertVonageSessionLayoutData,
    VonageSessionLayoutData,
    VonageSessionLayoutType,
} from "@clowdr-app/shared-types/build/vonage";
import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useVonageLayoutProvider_GetLatestVonageSessionLayoutQuery } from "../../../../../generated/graphql";

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
`;

export interface VonageLayout {
    currentLayout: VonageSessionLayoutData;
    updateCurrentLayout: (layout: VonageSessionLayoutData) => void;
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
}: PropsWithChildren<{ vonageSessionId: string }>): JSX.Element {
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
    useEffect(() => {
        setLayoutData(null);
    }, [vonageSessionId]);

    const layout = useMemo(
        () => ({
            currentLayout: layoutData ?? initialLayoutData ?? { type: VonageSessionLayoutType.BestFit },
            updateCurrentLayout: setLayoutData,
        }),
        [initialLayoutData, layoutData]
    );

    return <VonageLayoutContext.Provider value={layout}>{children}</VonageLayoutContext.Provider>;
}
