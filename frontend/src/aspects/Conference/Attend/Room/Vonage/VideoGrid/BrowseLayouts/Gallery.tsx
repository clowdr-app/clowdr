import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Center, Flex, IconButton } from "@chakra-ui/react";
import useSize from "@react-hook/size";
import React, { useEffect, useMemo, useState } from "react";
import type { Viewport } from "../../Components/LayoutTypes";
import { GalleryPage } from "./GalleryPage";

export function Gallery({
    viewports,
    streamActivities,
}: {
    viewports: Viewport[];
    streamActivities: Map<
        string,
        React.MutableRefObject<{
            timestamp: number;
            talking: boolean;
        } | null>
    >;
}): JSX.Element {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, containerHeight] = useSize(containerRef);
    const minPreferredEdgeLength = 100 * (window.devicePixelRatio ?? 1);

    const [maxColumns, maxRows] = useMemo(() => {
        const minEdgeLength = Math.min(minPreferredEdgeLength, containerWidth, containerHeight);

        return [Math.floor(containerWidth / minEdgeLength), Math.floor(containerHeight / minEdgeLength)];
    }, [containerHeight, containerWidth, minPreferredEdgeLength]);

    const maxPerPage = maxColumns * maxRows;
    const pages = Math.ceil(viewports.length / maxPerPage);

    const [currentPage, setCurrentPage] = useState<number>(0);

    const pageViewports = useMemo(
        () => viewports.slice(currentPage * maxPerPage, Math.min((currentPage + 1) * maxPerPage, viewports.length)),
        [currentPage, maxPerPage, viewports]
    );

    useEffect(() => {
        if (currentPage >= pages) {
            setCurrentPage(pages - 1);
        }
    }, [currentPage, pages]);

    return (
        <Box position="relative" w="100%" h="100%" overflow="hidden">
            <Center ref={containerRef} h="100%" w="100%" isolation="isolate">
                <GalleryPage
                    maxColumns={maxColumns}
                    viewports={pageViewports}
                    streamActivities={streamActivities}
                    maxHeight={containerHeight}
                    maxWidth={containerWidth}
                />
            </Center>
            <Flex
                position="absolute"
                top={0}
                left={0}
                h="100%"
                w="100%"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                pointerEvents="none"
            >
                <IconButton
                    aria-label="Go back a page"
                    icon={<ArrowBackIcon />}
                    isDisabled={currentPage <= 0}
                    size="xs"
                    colorScheme="RoomControlBarButton"
                    opacity={0.8}
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    pointerEvents="auto"
                />
                <IconButton
                    aria-label="Go forward a page"
                    icon={<ArrowForwardIcon />}
                    isDisabled={currentPage >= pages - 1}
                    size="xs"
                    colorScheme="RoomControlBarButton"
                    opacity={0.8}
                    onClick={() => setCurrentPage((p) => Math.min(pages - 1, p + 1))}
                    pointerEvents="auto"
                />
            </Flex>
        </Box>
    );
}
