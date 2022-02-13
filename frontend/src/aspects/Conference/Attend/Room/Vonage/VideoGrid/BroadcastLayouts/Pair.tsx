import { AspectRatio, Box, Center, Flex } from "@chakra-ui/react";
import React from "react";
import * as portals from "react-reverse-portal";
import type { VizLayout_Pair } from "../../Components/LayoutTypes";
import StreamChooser from "../../Components/StreamChooser";

export function Pair({
    visualLayout,
    allowedToControlLayout,
    isRecordingMode,
}: {
    visualLayout: VizLayout_Pair;
    allowedToControlLayout: boolean;
    isRecordingMode: boolean;
}): JSX.Element {
    return (
        <Center border="3px solid" borderColor="gray.900">
            <AspectRatio
                ratio={16 / 9}
                w="100%"
                maxW="calc((16 / 9) * (90vh - 250px))"
                bgColor="gray.500"
                mr={1}
                pos="relative"
            >
                <Flex w="100%" h="100%">
                    <Box w="50%" h="100%" bgColor="gray.500" mr="1px" pos="relative">
                        {visualLayout.leftViewport ? (
                            <portals.OutPortal
                                node={visualLayout.leftViewport.component}
                                enableVideo={true}
                                resolution="high"
                                framerate={30}
                            />
                        ) : undefined}
                        {allowedToControlLayout ? (
                            <StreamChooser
                                positionKey="position1"
                                centered={!visualLayout.leftViewport}
                                isRecordingMode={isRecordingMode}
                            />
                        ) : undefined}
                    </Box>
                    <Box w="50%" h="100%" bgColor="gray.500" ml="1px" pos="relative">
                        {visualLayout.rightViewport ? (
                            <portals.OutPortal
                                node={visualLayout.rightViewport.component}
                                enableVideo={true}
                                resolution="high"
                                framerate={30}
                            />
                        ) : undefined}
                        {allowedToControlLayout ? (
                            <StreamChooser
                                positionKey="position2"
                                centered={!visualLayout.rightViewport}
                                isRecordingMode={isRecordingMode}
                            />
                        ) : undefined}
                    </Box>
                </Flex>
            </AspectRatio>
        </Center>
    );
}
