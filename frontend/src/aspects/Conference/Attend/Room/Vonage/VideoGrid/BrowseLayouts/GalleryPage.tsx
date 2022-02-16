import { GridItem, SimpleGrid } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import * as portals from "react-reverse-portal";
import usePolling from "../../../../../../Hooks/usePolling";
import type { Viewport } from "../../Components/LayoutTypes";

export function GalleryPage({
    maxColumns,
    viewports,
    streamActivities,
    maxHeight,
    maxWidth,
}: {
    maxColumns: number;
    viewports: Viewport[];
    streamActivities: Map<
        string,
        React.MutableRefObject<{
            timestamp: number;
            talking: boolean;
        } | null>
    >;
    maxHeight: number;
    maxWidth: number;
}): JSX.Element {
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
        const limitedStreamIds = sortedStreamIds.slice(0, 10);
        setEnabledStreamIds((oldEnabledStreamIds) =>
            oldEnabledStreamIds.length !== limitedStreamIds.length ||
            limitedStreamIds.some((x) => !oldEnabledStreamIds.includes(x)) ||
            oldEnabledStreamIds.some((x) => !limitedStreamIds.includes(x))
                ? limitedStreamIds
                : oldEnabledStreamIds
        );
    }, [streamActivities, viewports]);
    usePolling(computeEnabledStreamIds, 1500);

    const [columns, rows] = useMemo(
        () => [Math.min(viewports.length, maxColumns), Math.max(1, Math.ceil(viewports.length / maxColumns))],
        [maxColumns, viewports.length]
    );
    const viewportEdgeLength = Math.min(maxWidth / columns, maxHeight / rows);

    return viewports.length ? (
        <SimpleGrid columns={columns} width="fit-content">
            {viewports.map((viewport) => (
                <GridItem
                    key={viewport.streamId ?? viewport.connectionId}
                    pos="relative"
                    width={`${viewportEdgeLength}px`}
                    height={`${viewportEdgeLength}px`}
                >
                    <portals.OutPortal
                        node={viewport.component}
                        enableVideo={
                            !!viewport.streamId &&
                            (viewport.isSelf ||
                                viewports.length <= 1 ||
                                enabledStreamIds.includes(viewport.streamId) ||
                                viewport.type === "screen")
                        }
                        resolution={
                            enabledStreamIds.length > 10 ? "low" : enabledStreamIds.length <= 5 ? "high" : "normal"
                        }
                        framerate={enabledStreamIds.length > 10 ? 7 : enabledStreamIds.length <= 5 ? 30 : 15}
                    />
                </GridItem>
            ))}
        </SimpleGrid>
    ) : (
        <></>
    );
}
