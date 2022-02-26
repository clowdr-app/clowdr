import { Box, Center, Flex } from "@chakra-ui/react";
import useSize from "@react-hook/size";
import React, { useEffect, useMemo, useState } from "react";
import * as portals from "react-reverse-portal";
import type { Viewport } from "../../Components/LayoutTypes";
import { Gallery } from "./Gallery";

export function Focus({
    viewports,
    focusViewports,
    streamActivities,
}: {
    viewports: Viewport[];
    focusViewports: Viewport[];
    streamActivities: Map<
        string,
        React.MutableRefObject<{
            timestamp: number;
            talking: boolean;
        } | null>
    >;
}): JSX.Element {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth] = useSize(containerRef);

    const maxColumns = useMemo(() => {
        const minEdgeLength = 200;
        if (containerWidth < minEdgeLength) {
            return 1;
        }

        return Math.floor(containerWidth / minEdgeLength);
    }, [containerWidth]);

    const pages = Math.ceil(viewports.length / maxColumns);

    const [currentPage, setCurrentPage] = useState<number>(0);

    useEffect(() => {
        if (currentPage >= pages) {
            setCurrentPage(pages - 1);
        }
    }, [currentPage, pages]);

    return (
        <Flex flexDir="column" overflow="hidden" w="100%" h="100%" alignItems="stretch">
            <Flex flexDir="row" w="100%" h="80%" justifyContent="center" alignItems="stretch" flexShrink={1}>
                {focusViewports.map((viewport) => (
                    <Box key={viewport.streamId ?? viewport.connectionId} flexGrow={1} pos="relative">
                        <portals.OutPortal
                            node={viewport.component}
                            enableVideo={true}
                            resolution="high"
                            framerate={30}
                        />
                    </Box>
                ))}
            </Flex>

            <Center
                ref={containerRef}
                w="100%"
                height="20%"
                minHeight="100px"
                py={2}
                flexGrow={1}
                flexShrink={1}
                overflow="hidden"
            >
                <Gallery viewports={viewports} streamActivities={streamActivities} />
            </Center>
        </Flex>
    );
}
