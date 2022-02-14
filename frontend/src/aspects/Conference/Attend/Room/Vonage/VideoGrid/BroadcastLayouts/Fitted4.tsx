import { AspectRatio, Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import * as portals from "react-reverse-portal";
import CameraPlaceholderImage from "../../Components/CameraPlaceholder";
import type { VizLayout_Fitted4 } from "../../Components/LayoutTypes";
import { VisualLayoutType } from "../../Components/LayoutTypes";
import StreamChooser from "../../Components/StreamChooser";

export function Fitted4({
    visualLayout,
    allowedToControlLayout,
    isRecordingMode,
}: {
    visualLayout: VizLayout_Fitted4;
    allowedToControlLayout: boolean;
    isRecordingMode: boolean;
}): JSX.Element {
    const el = useMemo(() => {
        switch (visualLayout.type) {
            case VisualLayoutType.Fitted4_Left: {
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
                                    positionKey={"position" + (idx + 2)}
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
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 2)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey={"position" + (visualLayout.sideAreaViewports.length + 2)}
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
                            <Box w="86%" h="100%" bgColor="gray.500" top={0} left="14%" pos="absolute">
                                {visualLayout.largeAreaViewport ? (
                                    <portals.OutPortal
                                        node={visualLayout.largeAreaViewport.component}
                                        enableVideo={true}
                                        resolution="high"
                                        framerate={30}
                                    />
                                ) : undefined}
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport}
                                        isRecordingMode={isRecordingMode}
                                    />
                                ) : undefined}
                            </Box>
                            {sideBoxes}
                        </Box>
                    </AspectRatio>
                );
            }
            case VisualLayoutType.Fitted4_Bottom: {
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
                                    positionKey={"position" + (idx + 2)}
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
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 2)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey={"position" + (visualLayout.sideAreaViewports.length + 2)}
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
                            <Box w="100%" h="75%" bgColor="gray.600" top={0} left={0} pos="absolute">
                                {visualLayout.largeAreaViewport ? (
                                    <portals.OutPortal
                                        node={visualLayout.largeAreaViewport.component}
                                        enableVideo={true}
                                        resolution="high"
                                        framerate={30}
                                    />
                                ) : undefined}
                                {allowedToControlLayout ? (
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport}
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
        visualLayout.largeAreaViewport,
        visualLayout.sideAreaViewports,
        visualLayout.type,
    ]);

    return el;
}
