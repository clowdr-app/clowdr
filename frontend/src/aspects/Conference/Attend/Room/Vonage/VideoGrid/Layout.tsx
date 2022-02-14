import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Center, VStack } from "@chakra-ui/react";
import useSize from "@react-hook/size";
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
    const visualLayout = useVisualLayout(layout.layout.layout, viewports);

    const layoutPanelRef = React.useRef(null);
    const [layoutPanelWidth, layoutPanelHeight] = useSize(layoutPanelRef);

    const tooTall = layoutPanelHeight * (16 / 9) >= layoutPanelWidth;
    const height = tooTall ? layoutPanelWidth * (9 / 16) : layoutPanelHeight;
    const width = tooTall ? layoutPanelWidth : layoutPanelHeight * (16 / 9);

    const noVideosEl = useMemo(
        () => (
            <Center h="100%" w="100%">
                <Alert
                    status="info"
                    variant="subtle"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    p={8}
                    maxW="60ch"
                >
                    <AlertIcon boxSize="8" />
                    <AlertTitle fontSize="lg" my={4}>
                        No videos to display.
                    </AlertTitle>
                    <AlertDescription mr={2}>
                        There are no videos to display in TV view right now. Switch to gallery view to see the{" "}
                        {visualLayout.overflowViewports.length} participants in this room.
                    </AlertDescription>
                </Alert>
            </Center>
        ),
        [visualLayout.overflowViewports.length]
    );

    const layoutEl = useMemo(() => {
        switch (visualLayout.type) {
            case VisualLayoutType.BestFit_NoScreenshare:
                return visualLayout.viewports.length ? (
                    <BestFit_NoScreenshare visualLayout={visualLayout} />
                ) : (
                    noVideosEl
                );

            case VisualLayoutType.BestFit_Screenshare_HorizontalSplit:
            case VisualLayoutType.BestFit_Screenshare_VerticalSplit:
                return visualLayout.viewports.length || visualLayout.screenshareViewport ? (
                    <BestFit_Screenshare visualLayout={visualLayout} />
                ) : (
                    noVideosEl
                );

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
    }, [allowedToControlLayout, isRecordingMode, noVideosEl, visualLayout]);

    return (
        <VStack h="100%" justifyContent="center" ref={layoutPanelRef}>
            <Box w={`${width}px`} h={`${height}px`}>
                {layoutEl}
            </Box>
        </VStack>
    );
}
