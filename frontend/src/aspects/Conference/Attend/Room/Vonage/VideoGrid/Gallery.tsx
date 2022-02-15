import { AspectRatio, Box, GridItem, SimpleGrid } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as portals from "react-reverse-portal";
import usePolling from "../../../../../Hooks/usePolling";
import useResizeObserver from "../../../../../Hooks/useResizeObserver";
import type { Viewport } from "../Components/LayoutTypes";
import VideoChatVideoPlayer from "../VideoPlayback/VideoChatVideoPlayer";

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
    const [overflowAreaColumns, setOverflowAreaColumns] = useState<number>(2);

    const cameraFeeds = useMemo(() => viewports.filter((x) => x.type === "camera"), [viewports]);
    const screenFeeds = useMemo(() => viewports.filter((x) => x.type === "screen"), [viewports]);

    const [enabledStreamIds, setEnabledStreamIds] = useState<string[]>([]);
    const computeEnabledStreamIds = useCallback(() => {
        const cameraStreamIds = viewports
            .filter((x) => x.type === "camera" && !!x.streamId && !x.isSelf)
            .map((x) => x.streamId) as string[];
        const sortedStreamIds = cameraStreamIds.sort((x, y) => {
            const xIsTalking = streamActivities.get(x)?.current;
            const yIsTalking = streamActivities.get(y)?.current;
            if (xIsTalking?.talking) {
                if (yIsTalking?.talking) {
                    return yIsTalking.timestamp - xIsTalking.timestamp;
                } else {
                    return -1;
                }
            } else if (yIsTalking?.talking) {
                return 1;
            } else {
                return 0;
            }
        });
        const limitedStreamIds = sortedStreamIds.slice(0, screenFeeds.length ? 4 : 10);
        setEnabledStreamIds((oldEnabledStreamIds) =>
            oldEnabledStreamIds.length !== limitedStreamIds.length ||
            limitedStreamIds.some((x) => !oldEnabledStreamIds.includes(x)) ||
            oldEnabledStreamIds.some((x) => !limitedStreamIds.includes(x))
                ? limitedStreamIds
                : oldEnabledStreamIds
        );
    }, [screenFeeds.length, streamActivities, viewports]);
    usePolling(computeEnabledStreamIds, 1500);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const containerResizeObserver = useResizeObserver(containerRef);
    useEffect(() => {
        if (containerResizeObserver.length > 0) {
            const observation = containerResizeObserver[0];
            const width = observation.contentRect.width;
            if (width < 400) {
                setOverflowAreaColumns(2);
            } else if (width < 900) {
                setOverflowAreaColumns(3);
            } else if (width < 1200) {
                setOverflowAreaColumns(4);
            } else if (width < 1600) {
                setOverflowAreaColumns(5);
            } else if (width < 2000) {
                setOverflowAreaColumns(6);
            } else if (width < 2500) {
                setOverflowAreaColumns(8);
            } else {
                setOverflowAreaColumns(10);
            }
        }
    }, [containerResizeObserver]);

    return (
        <Box ref={containerRef}>
            <VideoChatVideoPlayer />
            {viewports.length > 0 ? (
                <SimpleGrid columns={overflowAreaColumns} gap={2} mt={2}>
                    {screenFeeds.map((viewport) => (
                        <GridItem
                            as={AspectRatio}
                            ratio={16 / 9}
                            maxH="calc(90vh - 350px)"
                            key={viewport.streamId ?? viewport.connectionId}
                            pos="relative"
                            width="100%"
                            colSpan={overflowAreaColumns}
                        >
                            <portals.OutPortal
                                node={viewport.component}
                                enableVideo={true}
                                resolution="high"
                                framerate={30}
                            />
                        </GridItem>
                    ))}
                    {cameraFeeds.map((viewport) => (
                        <GridItem
                            as={AspectRatio}
                            ratio={1}
                            key={viewport.streamId ?? viewport.connectionId}
                            pos="relative"
                            width="100%"
                        >
                            <portals.OutPortal
                                node={viewport.component}
                                enableVideo={
                                    !!viewport.streamId &&
                                    (viewport.isSelf ||
                                        cameraFeeds.length <= 1 ||
                                        enabledStreamIds.includes(viewport.streamId) ||
                                        viewport.type === "screen")
                                }
                                resolution={
                                    screenFeeds.length || enabledStreamIds.length > 10
                                        ? "low"
                                        : enabledStreamIds.length <= 5
                                        ? "high"
                                        : "normal"
                                }
                                framerate={
                                    screenFeeds.length || enabledStreamIds.length > 10
                                        ? 7
                                        : enabledStreamIds.length <= 5
                                        ? 30
                                        : 15
                                }
                            />
                        </GridItem>
                    ))}
                </SimpleGrid>
            ) : undefined}
        </Box>
    );
}
