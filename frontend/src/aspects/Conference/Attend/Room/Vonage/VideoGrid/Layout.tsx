import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Heading,
    Text,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import useSize from "@react-hook/size";
import React, { useContext, useMemo } from "react";
import FAIcon from "../../../../../Chakra/FAIcon";
import type { Viewport } from "../Components/LayoutTypes";
import { VisualLayoutType } from "../Components/LayoutTypes";
import useVisualLayout from "../Components/useVisualLayout";
import { DisplayType } from "../State/useVonageDisplay";
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
import { Gallery } from "./BrowseLayouts/Gallery";

export default function Layout({
    viewports,
    allowedToControlLayout,
}: {
    viewports: Viewport[];
    allowedToControlLayout: boolean;
}): JSX.Element {
    const { settings } = useVonageRoom();
    const { isRecordingActive, connections } = useContext(VonageComputedStateContext);
    const isRecordingMode = settings.isBackstageRoom || isRecordingActive;

    const { layout, display } = useVonageLayout();
    const visualLayout = useVisualLayout(layout.layout.layout, viewports);

    const layoutPanelRef = React.useRef(null);
    const [layoutPanelWidth, layoutPanelHeight] = useSize(layoutPanelRef);

    const tooTall = layoutPanelHeight * (16 / 9) >= layoutPanelWidth;
    const height = tooTall ? layoutPanelWidth * (9 / 16) : layoutPanelHeight;
    const width = tooTall ? layoutPanelWidth : layoutPanelHeight * (16 / 9);

    const noVideosEl = useMemo(
        () => (
            // <Center h="100%" w="100%">
            <Alert
                status="info"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                px={8}
                py={4}
                my="auto"
                maxW="50ch"
                colorScheme="RoomNoVideoAlert"
            >
                <Wrap align="center" pb={2}>
                    <WrapItem flexGrow={0}>
                        <AlertIcon boxSize="8" />
                    </WrapItem>
                    <WrapItem flexGrow={1} flexBasis="min-content">
                        <AlertTitle fontSize={{ base: "md", md: "lg" }} textAlign="left">
                            Nobody has their video turned on right now
                        </AlertTitle>
                    </WrapItem>
                </Wrap>
                <AlertDescription mr={2} fontSize={{ base: "sm", md: "md" }}>
                    <Text>
                        {settings.isBackstageRoom
                            ? "Nothing will be visible during your event broadcast until someone turns on their camera or shares their screen."
                            : isRecordingActive
                            ? "No video tiles will appear in the recording until someone turns on their camera or shares their screen."
                            : "No video tiles will appear here until someone turns on their camera or shares their screen."}
                    </Text>
                    <Text mt={2}>{`${Math.max(connections.length - 1, 0)} other ${
                        connections.length - 1 === 1 ? "person is" : "people are"
                    } connected to this video chat.`}</Text>
                    {connections.length > 1 ? (
                        <Button
                            onClick={() => display.setChosenDisplay({ type: DisplayType.Browse })}
                            mt={2}
                            colorScheme="RoomControlBarButton"
                            size="xs"
                            leftIcon={<FAIcon icon="chalkboard-teacher" iconStyle="s" />}
                        >
                            Browse all participants
                        </Button>
                    ) : undefined}
                </AlertDescription>
            </Alert>
            // </Center>
        ),
        [connections.length, display, isRecordingActive, settings.isBackstageRoom]
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
        <VStack justifyContent="center" alignItems="stretch" flexGrow={1}>
            <Heading as="h3" size="sm" flexGrow={0} flexShrink={1} pt={2}>
                Preview of {settings.isBackstageRoom ? "stream" : "recording"}
            </Heading>
            <Box flexBasis={0} minH="10em" flexGrow={{ base: 1.5, md: 2.5, lg: 3 }} flexShrink={1} ref={layoutPanelRef}>
                <Box w={`${width}px`} h={`${height}px`} mx="auto" flexGrow={1} flexShrink={1} overflowY="auto">
                    {layoutEl}
                </Box>
            </Box>
            {visualLayout.overflowViewports.length ? (
                <VStack flexBasis={0} minH="5em" flexGrow={1} flexShrink={1}>
                    <Heading as="h3" size="sm" pt={2}>
                        Not included in {settings.isBackstageRoom ? "stream" : "recording"}
                    </Heading>
                    <Gallery viewports={visualLayout.overflowViewports} streamActivities={new Map()} />
                </VStack>
            ) : undefined}
        </VStack>
    );
}
