import { gql } from "@apollo/client";
import { useDisclosure, useToast } from "@chakra-ui/react";
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
        insert_video_VonageSessionLayout(
            objects: { vonageSessionId: $vonageSessionId, conferenceId: $conferenceId, layoutData: $layoutData }
        ) {
            affected_rows
        }
    }
`;

export interface AvailableStream {
    streamId?: string;
    connectionId: string;
    registrantName?: string;
    type: "camera" | "screen";
}

export interface VonageLayout {
    layout: VonageSessionLayoutData;
    updateLayout: (layout: VonageSessionLayoutData) => void;
    saveLayout: (_layoutData?: VonageSessionLayoutData) => Promise<void>;

    availableStreams: AvailableStream[];
    setAvailableStreams: (streams: AvailableStream[]) => void;

    layoutChooser_isOpen: boolean;
    layoutChooser_onOpen: () => void;
    layoutChooser_onClose: () => void;
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

    const currentLayout: VonageSessionLayoutData = useMemo(
        () =>
            layoutData ??
            initialLayoutData ?? { type: VonageSessionLayoutType.BestFit, screenShareType: "verticalPresentation" },
        [initialLayoutData, layoutData]
    );

    const [insertLayout] = useInsertVonageSessionLayoutMutation();
    const toast = useToast();
    const { id: conferenceId } = useConference();

    const [availableStreams, setAvailableStreams] = useState<AvailableStream[]>([]);

    const saveLayout = useCallback(
        async (_layoutData?: VonageSessionLayoutData) => {
            if (!vonageSessionId) {
                console.error("No Vonage session available for layout insert");
                throw new Error("No Vonage session available for layout insert");
            }

            try {
                let data: any = _layoutData ?? layoutData;
                if (data) {
                    for (let idx = 1; idx < 7; idx++) {
                        const key = "position" + idx;
                        if (key in data && data[key]) {
                            if ("streamId" in data[key]) {
                                const streamId = data[key].streamId;
                                if (!availableStreams.some((x) => x.streamId === streamId)) {
                                    delete data[key];
                                }
                            } else {
                                const connectionId = data[key].connectionId;
                                if (!availableStreams.some((x) => x.connectionId === connectionId)) {
                                    delete data[key];
                                }
                            }
                        }
                    }

                    switch (data.type) {
                        case VonageSessionLayoutType.BestFit:
                            data = {
                                type: VonageSessionLayoutType.BestFit,
                                screenShareType: data.screenShareType ?? "verticalPresentation",
                            } as VonageSessionLayoutData;
                            break;
                        case VonageSessionLayoutType.Single:
                            data = {
                                type: VonageSessionLayoutType.Single,
                                position1: data.position1,
                            } as VonageSessionLayoutData;
                            break;
                        case VonageSessionLayoutType.Pair:
                            data = {
                                type: VonageSessionLayoutType.Pair,
                                position1: data.position1,
                                position2: data.position2,
                            } as VonageSessionLayoutData;
                            break;
                        case VonageSessionLayoutType.PictureInPicture:
                            data = {
                                type: VonageSessionLayoutType.PictureInPicture,
                                position1: data.position1,
                                position2: data.position2,
                            } as VonageSessionLayoutData;
                            break;
                        case VonageSessionLayoutType.Fitted4:
                            data = {
                                type: VonageSessionLayoutType.Fitted4,
                                side: data.side ?? "left",
                                position1: data.position1,
                                position2: data.position2,
                                position3: data.position3,
                                position4: data.position4,
                                position5: data.position5,
                            } as VonageSessionLayoutData;
                            break;
                        case VonageSessionLayoutType.DualScreen:
                            data = {
                                type: VonageSessionLayoutType.DualScreen,
                                splitDirection: data.splitDirection ?? "horizontal",
                                narrowStream: data.narrowStream ?? null,
                                position1: data.position1,
                                position2: data.position2,
                                position3: data.position3,
                                position4: data.position4,
                                position5: data.position5,
                                position6: data.position6,
                            } as VonageSessionLayoutData;
                            break;
                    }
                }

                if (data) {
                    setLayoutData(data);
                    await insertLayout({
                        variables: {
                            conferenceId,
                            vonageSessionId,
                            layoutData: data,
                        },
                    });
                }
            } catch (e) {
                console.error("Failed to insert Vonage layout", e);
                toast({
                    status: "error",
                    title: "Could not set the Vonage layout",
                    description: "If this error persists, you may need to leave and re-enter the room.",
                });
            }
        },
        [vonageSessionId, layoutData, availableStreams, insertLayout, conferenceId, toast]
    );

    const {
        isOpen: layoutChooser_isOpen,
        onOpen: layoutChooser_onOpen,
        onClose: layoutChooser_onClose,
    } = useDisclosure();

    const layout: VonageLayout = useMemo(
        () => ({
            layout: currentLayout,
            updateLayout: setLayoutData,
            saveLayout,
            availableStreams,
            setAvailableStreams,
            layoutChooser_isOpen,
            layoutChooser_onOpen,
            layoutChooser_onClose,
        }),
        [currentLayout, saveLayout, availableStreams, layoutChooser_isOpen, layoutChooser_onOpen, layoutChooser_onClose]
    );

    useEffect(() => {
        setLayoutData(null);
    }, [vonageSessionId]);

    return <VonageLayoutContext.Provider value={layout}>{children}</VonageLayoutContext.Provider>;
}
