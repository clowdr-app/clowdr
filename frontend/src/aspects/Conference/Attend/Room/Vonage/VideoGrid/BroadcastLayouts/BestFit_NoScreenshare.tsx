import { AspectRatio, Box, Flex } from "@chakra-ui/react";
import React from "react";
import * as portals from "react-reverse-portal";
import type { VizLayout_BestFit_NoScreenshare } from "../../Components/LayoutTypes";

export function BestFit_NoScreenshare({
    visualLayout,
}: {
    visualLayout: VizLayout_BestFit_NoScreenshare;
}): JSX.Element {
    return (
        <Flex flexWrap="wrap" overflow="hidden" w="100%" h="100%">
            {visualLayout.viewports.map((viewport) => (
                <AspectRatio
                    ratio={16 / 9}
                    w={
                        visualLayout.viewports.length === 1
                            ? "100%"
                            : visualLayout.viewports.length <= 4
                            ? "calc(50%)"
                            : visualLayout.viewports.length <= 9
                            ? "calc(33%)"
                            : "calc(25%)"
                    }
                    bgColor="gray.700"
                    pos="relative"
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
        </Flex>
    );
}
