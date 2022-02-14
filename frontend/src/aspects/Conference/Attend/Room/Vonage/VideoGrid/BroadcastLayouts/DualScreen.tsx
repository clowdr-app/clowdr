import { AspectRatio, Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import * as portals from "react-reverse-portal";
import CameraPlaceholderImage from "../../Components/CameraPlaceholder";
import type { VizLayout_DualScreen } from "../../Components/LayoutTypes";
import { VisualLayoutType } from "../../Components/LayoutTypes";
import StreamChooser from "../../Components/StreamChooser";

export function DualScreen({
    visualLayout,
    allowedToControlLayout,
    isRecordingMode,
}: {
    visualLayout: VizLayout_DualScreen;
    allowedToControlLayout: boolean;
    isRecordingMode: boolean;
}): JSX.Element {
    const el = useMemo(() => {
        switch (visualLayout.type) {
            case VisualLayoutType.DualScreen_Horizontal: {
                const sideBoxes: JSX.Element[] = visualLayout.sideAreaViewports.map((viewport, idx) => (
                    <AspectRatio
                        ratio={1}
                        w="14%"
                        bgColor="gray.700"
                        top={idx * 25 + "%"}
                        left="0px"
                        pos="absolute"
                        key={viewport?.streamId ?? viewport?.connectionId ?? "position" + idx}
                    >
                        <Box>
                            {viewport ? (
                                <portals.OutPortal
                                    node={viewport.component}
                                    enableVideo={true}
                                    resolution="high"
                                    framerate={30}
                                />
                            ) : (
                                <CameraPlaceholderImage />
                            )}
                            {allowedToControlLayout ? (
                                <StreamChooser
                                    positionKey={"position" + (idx + 3)}
                                    centered={false}
                                    isRecordingMode={isRecordingMode}
                                />
                            ) : undefined}
                        </Box>
                    </AspectRatio>
                ));

                if (visualLayout.sideAreaViewports.length < 4) {
                    sideBoxes.push(
                        <AspectRatio
                            ratio={1}
                            w="14%"
                            bgColor="gray.700"
                            top={visualLayout.sideAreaViewports.length * 25 + "%"}
                            left="0px"
                            pos="absolute"
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 3)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey={"position" + (visualLayout.sideAreaViewports.length + 3)}
                                        centered={true}
                                        isRecordingMode={isRecordingMode}
                                    />
                                ) : undefined}
                            </Box>
                        </AspectRatio>
                    );
                }

                return (
                    <AspectRatio ratio={16 / 9} w="100%" bgColor="gray.500" mr={1} pos="relative">
                        <Box>
                            <Box
                                w="86%"
                                h={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                bgColor="gray.500"
                                top={0}
                                left="14%"
                                pos="absolute"
                            >
                                {visualLayout.largeAreaViewport1 ? (
                                    <portals.OutPortal
                                        node={visualLayout.largeAreaViewport1.component}
                                        enableVideo={true}
                                        resolution="high"
                                        framerate={30}
                                    />
                                ) : undefined}
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport1}
                                        isRecordingMode={isRecordingMode}
                                    />
                                ) : undefined}
                            </Box>
                            <Box
                                w="86%"
                                h={visualLayout.narrow === 2 ? "25%" : visualLayout.narrow === 1 ? "75%" : "50%"}
                                bgColor="gray.500"
                                top={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                left="14%"
                                pos="absolute"
                            >
                                {visualLayout.largeAreaViewport2 ? (
                                    <portals.OutPortal
                                        node={visualLayout.largeAreaViewport2.component}
                                        enableVideo={true}
                                        resolution="high"
                                        framerate={30}
                                    />
                                ) : undefined}
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey="position2"
                                        centered={!visualLayout.largeAreaViewport2}
                                        isRecordingMode={isRecordingMode}
                                    />
                                ) : undefined}
                            </Box>
                            {sideBoxes}
                        </Box>
                    </AspectRatio>
                );
            }
            case VisualLayoutType.DualScreen_Vertical: {
                const sideBoxes: JSX.Element[] = visualLayout.sideAreaViewports.map((viewport, idx) => (
                    <AspectRatio
                        ratio={1}
                        w="14%"
                        bgColor="gray.700"
                        top="75%"
                        left={(100 - 4 * 14) / 2 + idx * 14 + "%"}
                        pos="absolute"
                        key={viewport?.streamId ?? viewport?.connectionId ?? "position" + idx}
                    >
                        <Box>
                            {viewport ? (
                                <portals.OutPortal
                                    node={viewport.component}
                                    enableVideo={true}
                                    resolution="high"
                                    framerate={30}
                                />
                            ) : (
                                <CameraPlaceholderImage />
                            )}
                            {allowedToControlLayout ? (
                                <StreamChooser
                                    positionKey={"position" + (idx + 3)}
                                    centered={false}
                                    isRecordingMode={isRecordingMode}
                                />
                            ) : undefined}
                        </Box>
                    </AspectRatio>
                ));

                if (visualLayout.sideAreaViewports.length < 4) {
                    sideBoxes.push(
                        <AspectRatio
                            ratio={1}
                            w="14%"
                            bgColor="gray.700"
                            top="75%"
                            left={(100 - 4 * 14) / 2 + visualLayout.sideAreaViewports.length * 14 + "%"}
                            pos="absolute"
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 3)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey={"position" + (visualLayout.sideAreaViewports.length + 3)}
                                        centered={true}
                                        isRecordingMode={isRecordingMode}
                                    />
                                ) : undefined}
                            </Box>
                        </AspectRatio>
                    );
                }

                return (
                    <AspectRatio ratio={16 / 9} w="100%" bgColor="gray.500" mr={1} pos="relative">
                        <Box>
                            <Box
                                w={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                h="75%"
                                bgColor="gray.600"
                                top={0}
                                left={0}
                                pos="absolute"
                            >
                                {visualLayout.largeAreaViewport1 ? (
                                    <portals.OutPortal
                                        node={visualLayout.largeAreaViewport1.component}
                                        enableVideo={true}
                                        resolution="high"
                                        framerate={30}
                                    />
                                ) : undefined}
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport1}
                                        isRecordingMode={isRecordingMode}
                                    />
                                ) : undefined}
                            </Box>
                            <Box
                                w={visualLayout.narrow === 2 ? "25%" : visualLayout.narrow === 1 ? "75%" : "50%"}
                                h="75%"
                                bgColor="gray.500"
                                top={0}
                                left={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                pos="absolute"
                            >
                                {visualLayout.largeAreaViewport2 ? (
                                    <portals.OutPortal
                                        node={visualLayout.largeAreaViewport2.component}
                                        enableVideo={true}
                                        resolution="high"
                                        framerate={30}
                                    />
                                ) : undefined}
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey="position2"
                                        centered={!visualLayout.largeAreaViewport2}
                                        isRecordingMode={isRecordingMode}
                                    />
                                ) : undefined}
                            </Box>
                            {sideBoxes}
                        </Box>
                    </AspectRatio>
                );
            }
        }
    }, [
        allowedToControlLayout,
        isRecordingMode,
        visualLayout.largeAreaViewport1,
        visualLayout.largeAreaViewport2,
        visualLayout.narrow,
        visualLayout.sideAreaViewports,
        visualLayout.type,
    ]);

    return el;
}
