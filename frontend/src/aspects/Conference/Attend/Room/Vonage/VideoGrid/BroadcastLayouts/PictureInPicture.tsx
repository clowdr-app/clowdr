import { AspectRatio, Box } from "@chakra-ui/react";
import React from "react";
import * as portals from "react-reverse-portal";
import type { VizLayout_PiP } from "../../Components/LayoutTypes";
import StreamChooser from "../../Components/StreamChooser";

export function PictureInPicture({
    visualLayout,
    allowedToControlLayout,
    isRecordingMode,
}: {
    visualLayout: VizLayout_PiP;
    allowedToControlLayout: boolean;
    isRecordingMode: boolean;
}): JSX.Element {
    return (
        <AspectRatio ratio={16 / 9} w="100%" bgColor="gray.500" mr={1} pos="relative">
            <Box>
                <Box w="100%" h="100%" bgColor="gray.500" top={0} left={0} pos="absolute" zIndex={50}>
                    {visualLayout.fullscreenViewport ? (
                        <portals.OutPortal
                            node={visualLayout.fullscreenViewport.component}
                            enableVideo={true}
                            resolution="high"
                            framerate={30}
                        />
                    ) : undefined}
                    {allowedToControlLayout ? (
                        <StreamChooser
                            positionKey="position1"
                            centered={!visualLayout.fullscreenViewport}
                            isRecordingMode={isRecordingMode}
                        />
                    ) : undefined}
                </Box>
                <AspectRatio
                    ratio={1}
                    w="15.67%"
                    bgColor="gray.700"
                    bottom="20px"
                    right="20px"
                    pos="absolute"
                    zIndex={60}
                >
                    <Box>
                        {visualLayout.insetViewport ? (
                            <portals.OutPortal
                                node={visualLayout.insetViewport.component}
                                enableVideo={true}
                                resolution="high"
                                framerate={30}
                            />
                        ) : undefined}
                        {allowedToControlLayout ? (
                            <StreamChooser
                                positionKey="position2"
                                centered={!visualLayout.insetViewport}
                                isRecordingMode={isRecordingMode}
                            />
                        ) : undefined}
                    </Box>
                </AspectRatio>
            </Box>
        </AspectRatio>
    );
}
