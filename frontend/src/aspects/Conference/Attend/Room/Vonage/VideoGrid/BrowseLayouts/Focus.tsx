import { Box, Center, Flex, IconButton, Tooltip } from "@chakra-ui/react";
import useSize from "@react-hook/size";
import React, { useEffect, useMemo, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import * as portals from "react-reverse-portal";
import FAIcon from "../../../../../../Chakra/FAIcon";
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

    const fullScreenHandle = useFullScreenHandle();

    return (
        <Flex
            flexDir="column"
            overflow="hidden"
            w="100%"
            h="100%"
            alignItems="stretch"
            css={{
                ".focus-full-screen": {
                    position: "relative",
                    flexShrink: 1,
                    width: "100%",
                    height: "80%",
                },
            }}
        >
            <FullScreen handle={fullScreenHandle} className="focus-full-screen">
                <Box p={2} position="absolute" top="0px" right="0px" zIndex={500}>
                    <Tooltip label={fullScreenHandle.active ? "Exit fullscreen" : "Enter fullscreen"}>
                        <IconButton
                            size="xs"
                            aria-label={fullScreenHandle.active ? "Exit fullscreen" : "Enter fullscreen"}
                            icon={
                                <FAIcon iconStyle="s" icon={fullScreenHandle.active ? "compress-alt" : "expand-alt"} />
                            }
                            onClick={fullScreenHandle.active ? fullScreenHandle.exit : fullScreenHandle.enter}
                        />
                    </Tooltip>
                </Box>
                <Flex flexDir="row" w="100%" h="100%" justifyContent="center" alignItems="stretch" flexShrink={1}>
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
            </FullScreen>

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
