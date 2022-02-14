import { AspectRatio, Box, Center } from "@chakra-ui/react";
import React from "react";
import * as portals from "react-reverse-portal";
import type { VizLayout_BestFit_Screenshare } from "../../Components/LayoutTypes";
import { VisualLayoutType } from "../../Components/LayoutTypes";

export function BestFit_Screenshare({ visualLayout }: { visualLayout: VizLayout_BestFit_Screenshare }): JSX.Element {
    return visualLayout.type === VisualLayoutType.BestFit_Screenshare_HorizontalSplit ? (
        <Center borderColor="gray.900" w="100%" h="100%">
            <AspectRatio ratio={16 / 9} w="100%" maxH="100%" bgColor="gray.500" pos="relative">
                <Box>
                    <Box w="100%" h="80%" bgColor="gray.500" top={0} left={0} pos="absolute">
                        {visualLayout.screenshareViewport ? (
                            <portals.OutPortal
                                node={visualLayout.screenshareViewport.component}
                                enableVideo={true}
                                resolution="high"
                                framerate={30}
                            />
                        ) : undefined}
                    </Box>
                    {visualLayout.viewports.map((viewport, idx) => (
                        <Box
                            w="20%"
                            h="20%"
                            bgColor="gray.700"
                            top="80%"
                            left={idx * 20 + "%"}
                            pos="absolute"
                            key={viewport.streamId ?? viewport.connectionId}
                        >
                            <portals.OutPortal
                                node={viewport.component}
                                enableVideo={true}
                                resolution="high"
                                framerate={30}
                            />
                        </Box>
                    ))}
                </Box>
            </AspectRatio>
        </Center>
    ) : (
        <Center borderColor="gray.900" w="100%" h="100%">
            <AspectRatio ratio={16 / 9} w="100%" maxH="100%" bgColor="gray.500" pos="relative">
                <Box>
                    <Box w="85%" h="100%" bgColor="gray.500" top={0} left="15%" pos="absolute">
                        {visualLayout.screenshareViewport ? (
                            <portals.OutPortal
                                node={visualLayout.screenshareViewport.component}
                                enableVideo={true}
                                resolution="high"
                                framerate={30}
                            />
                        ) : undefined}
                    </Box>
                    {visualLayout.viewports.map((viewport, idx) => (
                        <AspectRatio
                            ratio={15 / 11.25}
                            w="15%"
                            bgColor="gray.700"
                            top={idx * 20 + "%"}
                            left="0px"
                            pos="absolute"
                            key={viewport.streamId ?? viewport.connectionId}
                        >
                            <Box>
                                <portals.OutPortal
                                    node={viewport.component}
                                    enableVideo={true}
                                    resolution="high"
                                    framerate={30}
                                />
                            </Box>
                        </AspectRatio>
                    ))}
                </Box>
            </AspectRatio>
        </Center>
    );
}
