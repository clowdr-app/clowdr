import { useDisclosure, useToast } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import {
    isVonageSessionLayoutData,
    VonageSessionLayoutType,
    type VonageSessionLayoutData,
} from "@midspace/shared-types/vonage";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    Registrant_RegistrantRole_Enum,
    useInsertVonageSessionLayoutMutation,
    useVonageLayoutProvider_GetLatestVonageSessionLayoutQuery,
} from "../../../../../../generated/graphql";
import { makeContext } from "../../../../../GQL/make-context";
import { useConference } from "../../../../useConference";
import useCurrentRegistrant from "../../../../useCurrentRegistrant";
import { VonageComputedStateContext } from "./VonageComputedStateContext";

export interface AvailableStream {
    streamId?: string;
    connectionId: string;
    registrantName?: string;
    type: "camera" | "screen";
}

export interface VonageBroadcastLayout {
    layout: { layout: VonageSessionLayoutData; createdAt: number };
    updateLayout: (
        layout:
            | { layout: VonageSessionLayoutData; createdAt: number }
            | ((old: { layout: VonageSessionLayoutData; createdAt: number } | null) => {
                  layout: VonageSessionLayoutData;
                  createdAt: number;
              } | null)
    ) => void;
    saveLayout: (layoutData?: { layout: VonageSessionLayoutData; createdAt: number }) => Promise<void>;
    refetchLayout: () => void;

    availableStreams: AvailableStream[];
    setAvailableStreams: (streams: AvailableStream[]) => void;

    layoutChooser_isOpen: boolean;
    layoutChooser_onOpen: () => void;
    layoutChooser_onClose: () => void;
}

export type RoomOrEventId =
    | { type: "event"; id: string }
    | { type: "room"; id: string }
    | { type: "room-with-event"; roomId: string; eventId: string };

export function useVonageBroadcastLayout(
    vonageSessionId: string,
    roomOrEventId: RoomOrEventId | null
): VonageBroadcastLayout {
    const [result, refetchLayout] = useVonageLayoutProvider_GetLatestVonageSessionLayoutQuery({
        variables: {
            vonageSessionId,
        },
        pause: !vonageSessionId.length,
    });
    const [initialLayoutData, setInitialLayoutData] = useState<{
        layout: VonageSessionLayoutData;
        createdAt: number;
    } | null>(null);
    const [layoutData, setLayoutData] = useState<{ layout: VonageSessionLayoutData; createdAt: number } | null>(null);
    useEffect(() => {
        if (!result.data?.video_VonageSessionLayout.length) {
            return;
        }
        if (isVonageSessionLayoutData(result.data.video_VonageSessionLayout[0].layoutData)) {
            setLayoutData(null);
            setInitialLayoutData({
                layout: result.data.video_VonageSessionLayout[0].layoutData,
                createdAt: Date.parse(result.data.video_VonageSessionLayout[0].created_at),
            });
        }
    }, [result.data?.video_VonageSessionLayout]);

    const currentLayout: { layout: VonageSessionLayoutData; createdAt: number } = useMemo(
        () =>
            layoutData ??
            initialLayoutData ?? {
                layout: {
                    type: VonageSessionLayoutType.BestFit,
                    screenShareType: "verticalPresentation",
                },
                createdAt: Date.now(),
            },
        [initialLayoutData, layoutData]
    );

    // todo: make permissions work for event layouts
    const [, insertLayout] = useInsertVonageSessionLayoutMutation();
    const toast = useToast();
    const { id: conferenceId } = useConference();

    const [availableStreams, setAvailableStreams] = useState<AvailableStream[]>([]);

    const registrant = useCurrentRegistrant();

    const saveContext = useMemo(() => {
        if (!roomOrEventId) {
            return undefined;
        }
        if (registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer) {
            return makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            });
        }
        switch (roomOrEventId.type) {
            case "room":
                return makeContext({
                    [AuthHeader.Role]: HasuraRoleName.RoomAdmin,
                    [AuthHeader.RoomId]: roomOrEventId.id,
                });
            case "room-with-event":
                return makeContext({
                    [AuthHeader.Role]: HasuraRoleName.RoomMember,
                    [AuthHeader.RoomId]: roomOrEventId.roomId,
                });
            case "event":
                return makeContext({
                    [AuthHeader.Role]: HasuraRoleName.Attendee,
                });
        }
    }, [roomOrEventId]);

    const saveLayout = useCallback(
        async (_layoutData?: { layout: VonageSessionLayoutData; createdAt: number } | null) => {
            if (!vonageSessionId) {
                console.error("No Vonage session available for layout insert");
                throw new Error("No Vonage session available for layout insert");
            }

            try {
                let data: any = _layoutData?.layout ?? layoutData?.layout;
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
                    setLayoutData({
                        layout: data,
                        createdAt: _layoutData?.createdAt ?? layoutData?.createdAt ?? Date.now(),
                    });
                    const result = await insertLayout(
                        {
                            conferenceId,
                            vonageSessionId,
                            layoutData: data,
                        },
                        saveContext
                    );
                    if (result.error) {
                        throw result.error;
                    }
                }
            } catch (e) {
                console.error("Failed to insert Vonage layout", e);
                toast({
                    status: "error",
                    title: "Could not set the layout",
                    description: "If this error persists, you may need to leave and re-enter the room.",
                });
            }
        },
        [
            vonageSessionId,
            layoutData?.layout,
            layoutData?.createdAt,
            availableStreams,
            insertLayout,
            conferenceId,
            saveContext,
            toast,
        ]
    );

    const {
        isOpen: layoutChooser_isOpen,
        onOpen: layoutChooser_onOpen,
        onClose: layoutChooser_onClose,
    } = useDisclosure();

    const layout: VonageBroadcastLayout = useMemo(
        () => ({
            layout: currentLayout,
            updateLayout: setLayoutData,
            saveLayout,
            refetchLayout: () => refetchLayout(),
            availableStreams,
            setAvailableStreams,
            layoutChooser_isOpen,
            layoutChooser_onOpen,
            layoutChooser_onClose,
        }),
        [
            currentLayout,
            saveLayout,
            refetchLayout,
            availableStreams,
            layoutChooser_isOpen,
            layoutChooser_onOpen,
            layoutChooser_onClose,
        ]
    );

    useEffect(() => {
        setLayoutData(null);
    }, [vonageSessionId]);

    const { layoutData: receivedLayoutData } = useContext(VonageComputedStateContext);
    useEffect(() => {
        if (receivedLayoutData) {
            setLayoutData(receivedLayoutData);
        }
    }, [receivedLayoutData]);

    return layout;
}
