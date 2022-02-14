import { AspectRatio, Box, Center } from "@chakra-ui/react";
import React from "react";
import * as portals from "react-reverse-portal";
import type { VizLayout_Single } from "../../Components/LayoutTypes";
import StreamChooser from "../../Components/StreamChooser";

export function Single({
    visualLayout,
    allowedToControlLayout,
    isRecordingMode,
}: {
    visualLayout: VizLayout_Single;
    allowedToControlLayout: boolean;
    isRecordingMode: boolean;
}): JSX.Element {
    return (
        <Center h="100%" w="100%" borderColor="gray.900">
            <AspectRatio ratio={16 / 9} w="100%" bgColor="gray.500" mr={1} pos="relative">
                <Box h="100%" w="100%" bgColor="gray.500">
                    {visualLayout.viewport ? (
                        <portals.OutPortal
                            node={visualLayout.viewport.component}
                            enableVideo={true}
                            resolution="high"
                            framerate={30}
                        />
                    ) : undefined}
                    {allowedToControlLayout ? (
                        <StreamChooser
                            positionKey="position1"
                            centered={!visualLayout.viewport}
                            isRecordingMode={isRecordingMode}
                        />
                    ) : undefined}
                </Box>
            </AspectRatio>
        </Center>
    );
}
