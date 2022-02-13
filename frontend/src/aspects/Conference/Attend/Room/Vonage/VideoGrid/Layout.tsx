import { Box } from "@chakra-ui/react";
import React, { useContext, useMemo } from "react";
import type { Viewport } from "../Components/LayoutTypes";
import { VisualLayoutType } from "../Components/LayoutTypes";
import useVisualLayout from "../Components/useVisualLayout";
import { VonageComputedStateContext } from "../State/VonageComputedStateContext";
import { useVonageLayout } from "../State/VonageLayoutProvider";
import { useVonageRoom } from "../State/VonageRoomProvider";
import { BestFit_NoScreenshare } from "./BroadcastLayouts/BestFit_NoScreenshare";
import { BestFit_Screenshare } from "./BroadcastLayouts/BestFit_Screenshare";
import { DualScreen } from "./BroadcastLayouts/DualScreen";
import { Fitted4 } from "./BroadcastLayouts/Fitted4";
import { Pair } from "./BroadcastLayouts/Pair";
import { PictureInPicture } from "./BroadcastLayouts/PictureInPicture";
import { Single } from "./BroadcastLayouts/Single";

export default function Layout({
    viewports,
    allowedToControlLayout,
}: {
    viewports: Viewport[];
    allowedToControlLayout: boolean;
}): JSX.Element {
    const { settings } = useVonageRoom();
    const { isRecordingActive } = useContext(VonageComputedStateContext);
    const isRecordingMode = settings.isBackstageRoom || isRecordingActive;

    const { layout } = useVonageLayout();
    const visualLayout = useVisualLayout(layout.layout.layout, isRecordingMode, viewports);

    const layoutEl = useMemo(() => {
        switch (visualLayout.type) {
            case VisualLayoutType.BestFit_NoScreenshare:
                return <BestFit_NoScreenshare visualLayout={visualLayout} />;

            case VisualLayoutType.BestFit_Screenshare_HorizontalSplit:
            case VisualLayoutType.BestFit_Screenshare_VerticalSplit:
                return <BestFit_Screenshare visualLayout={visualLayout} />;

            case VisualLayoutType.Single:
                return (
                    <Single
                        visualLayout={visualLayout}
                        allowedToControlLayout={allowedToControlLayout}
                        isRecordingMode={isRecordingMode}
                    />
                );
            case VisualLayoutType.Pair:
                return (
                    <Pair
                        visualLayout={visualLayout}
                        allowedToControlLayout={allowedToControlLayout}
                        isRecordingMode={isRecordingMode}
                    />
                );

            case VisualLayoutType.PictureInPicture:
                return (
                    <PictureInPicture
                        visualLayout={visualLayout}
                        allowedToControlLayout={allowedToControlLayout}
                        isRecordingMode={isRecordingMode}
                    />
                );
            case VisualLayoutType.Fitted4_Left:
            case VisualLayoutType.Fitted4_Bottom:
                return (
                    <Fitted4
                        visualLayout={visualLayout}
                        allowedToControlLayout={allowedToControlLayout}
                        isRecordingMode={isRecordingMode}
                    />
                );
            case VisualLayoutType.DualScreen_Horizontal:
            case VisualLayoutType.DualScreen_Vertical:
                return (
                    <DualScreen
                        visualLayout={visualLayout}
                        allowedToControlLayout={allowedToControlLayout}
                        isRecordingMode={isRecordingMode}
                    />
                );
        }
    }, [allowedToControlLayout, isRecordingMode, visualLayout]);

    return (
        <Box w="100%" h="100%" display="block" overflow="hidden">
            {layoutEl}
        </Box>
    );
}
