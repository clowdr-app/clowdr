import {
    Alert,
    AlertIcon,
    AlertTitle,
    AspectRatio,
    Box,
    Center,
    Divider,
    Flex,
    GridItem,
    Heading,
    SimpleGrid,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as portals from "react-reverse-portal";
import usePolling from "../../../../../Generic/usePolling";
import useResizeObserver from "../../../../../Generic/useResizeObserver";
import { useVonageLayout } from "../VonageLayoutProvider";
import CameraPlaceholderImage from "./CameraPlaceholder";
import type { Viewport} from "./LayoutTypes";
import { VisualLayoutType } from "./LayoutTypes";
import StreamChooser from "./StreamChooser";
import useVisualLayout from "./useVisualLayout";

export default function Layout({
    viewports,
    isRecordingMode,
    isBackstage,
    streamActivities,
}: {
    viewports: Viewport[];
    isRecordingMode: boolean;
    isBackstage: boolean;
    streamActivities: Map<
        string,
        React.MutableRefObject<{
            timestamp: number;
            talking: boolean;
        } | null>
    >;
}): JSX.Element {
    const layout = useVonageLayout();
    const visualLayout = useVisualLayout(layout.layout.layout, isRecordingMode, viewports);

    const isAlone = useMemo(
        () => viewports.reduce((acc, x) => acc + (x.type === "camera" ? 1 : 0), 0) <= 1,
        [viewports]
    );

    const nobodyElseAlert = useMemo(
        () =>
            isAlone ? (
                <Alert status="info" mt={2} w="100%">
                    <AlertIcon />
                    <AlertTitle>Nobody else has joined the room at the moment.</AlertTitle>
                </Alert>
            ) : (
                <></>
            ),
        [isAlone]
    );

    const mainArea = useMemo(() => {
        switch (visualLayout.type) {
            case VisualLayoutType.BestFit_NoScreenshare: {
                if (!isRecordingMode) {
                    return undefined;
                }

                return (
                    <AspectRatio justifyContent="center" w="min(100%, 90vh * (16 / 9))" maxW="100%" ratio={16 / 9}>
                        <Flex w="100%" h="100%" flexWrap="wrap" overflow="hidden">
                            {visualLayout.viewports.map((viewport) => (
                                <AspectRatio
                                    ratio={16 / 9}
                                    w={
                                        visualLayout.viewports.length === 1
                                            ? "100%"
                                            : visualLayout.viewports.length <= 4
                                            ? "calc(50% - 10px)"
                                            : visualLayout.viewports.length <= 9
                                            ? "calc(33% - 10px)"
                                            : "calc(25% - 10px)"
                                    }
                                    bgColor="gray.700"
                                    pos="relative"
                                    key={viewport.streamId ?? viewport.connectionId}
                                    m="5px"
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
                    </AspectRatio>
                );
            }
            case VisualLayoutType.BestFit_Screenshare_HorizontalSplit: {
                const sideBoxes: JSX.Element[] = visualLayout.viewports.map((viewport, idx) => (
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
                ));

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
                                {sideBoxes}
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.BestFit_Screenshare_VerticalSplit: {
                const sideBoxes: JSX.Element[] = visualLayout.viewports.map((viewport, idx) => (
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
                ));

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
                                {sideBoxes}
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.Single: {
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
                            <Box h="100%" w="100%" bgColor="gray.500">
                                {visualLayout.viewport ? (
                                    <portals.OutPortal
                                        node={visualLayout.viewport.component}
                                        enableVideo={true}
                                        resolution="high"
                                        framerate={30}
                                    />
                                ) : undefined}
                                <StreamChooser
                                    positionKey="position1"
                                    centered={!visualLayout.viewport}
                                    isRecordingMode={isRecordingMode}
                                />
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.Pair: {
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
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.leftViewport}
                                        isRecordingMode={isRecordingMode}
                                    />
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
                                    <StreamChooser
                                        positionKey="position2"
                                        centered={!visualLayout.rightViewport}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                            </Flex>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.PictureInPicture: {
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
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.fullscreenViewport}
                                        isRecordingMode={isRecordingMode}
                                    />
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
                                        <StreamChooser
                                            positionKey="position2"
                                            centered={!visualLayout.insetViewport}
                                            isRecordingMode={isRecordingMode}
                                        />
                                    </Box>
                                </AspectRatio>
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.Fitted4_Left: {
                const sideBoxes: JSX.Element[] = visualLayout.sideAreaViewports.map((viewport, idx) => (
                    <AspectRatio
                        ratio={1}
                        w="14%"
                        bgColor="gray.700"
                        top={idx * 25 + "%"}
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
                            <StreamChooser
                                positionKey={"position" + (idx + 2)}
                                centered={false}
                                isRecordingMode={isRecordingMode}
                            />
                        </Box>
                    </AspectRatio>
                ));

                if (visualLayout.sideAreaViewports.length < 4) {
                    sideBoxes.push(
                        <AspectRatio
                            ratio={1}
                            w="14%"
                            bgColor="gray.700"
                            top={visualLayout.sideAreaViewports.length * 25 + "%"}
                            left="0px"
                            pos="absolute"
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 2)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                <StreamChooser
                                    positionKey={"position" + (visualLayout.sideAreaViewports.length + 2)}
                                    centered={true}
                                    isRecordingMode={isRecordingMode}
                                />
                            </Box>
                        </AspectRatio>
                    );
                }

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
                            <Box>
                                <Box w="86%" h="100%" bgColor="gray.500" top={0} left="14%" pos="absolute">
                                    {visualLayout.largeAreaViewport ? (
                                        <portals.OutPortal
                                            node={visualLayout.largeAreaViewport.component}
                                            enableVideo={true}
                                            resolution="high"
                                            framerate={30}
                                        />
                                    ) : undefined}
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                                {sideBoxes}
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.Fitted4_Bottom: {
                const sideBoxes: JSX.Element[] = visualLayout.sideAreaViewports.map((viewport, idx) => (
                    <AspectRatio
                        ratio={1}
                        w="14%"
                        bgColor="gray.700"
                        top="75%"
                        left={(100 - 4 * 14) / 2 + idx * 14 + "%"}
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
                            <StreamChooser
                                positionKey={"position" + (idx + 2)}
                                centered={false}
                                isRecordingMode={isRecordingMode}
                            />
                        </Box>
                    </AspectRatio>
                ));

                if (visualLayout.sideAreaViewports.length < 4) {
                    sideBoxes.push(
                        <AspectRatio
                            ratio={1}
                            w="14%"
                            bgColor="gray.700"
                            top="75%"
                            left={(100 - 4 * 14) / 2 + visualLayout.sideAreaViewports.length * 14 + "%"}
                            pos="absolute"
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 2)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                <StreamChooser
                                    positionKey={"position" + (visualLayout.sideAreaViewports.length + 2)}
                                    centered={true}
                                    isRecordingMode={isRecordingMode}
                                />
                            </Box>
                        </AspectRatio>
                    );
                }

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
                            <Box>
                                <Box w="100%" h="75%" bgColor="gray.600" top={0} left={0} pos="absolute">
                                    {visualLayout.largeAreaViewport ? (
                                        <portals.OutPortal
                                            node={visualLayout.largeAreaViewport.component}
                                            enableVideo={true}
                                            resolution="high"
                                            framerate={30}
                                        />
                                    ) : undefined}
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                                {sideBoxes}
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.DualScreen_Horizontal: {
                const sideBoxes: JSX.Element[] = visualLayout.sideAreaViewports.map((viewport, idx) => (
                    <AspectRatio
                        ratio={1}
                        w="14%"
                        bgColor="gray.700"
                        top={idx * 25 + "%"}
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
                            <StreamChooser
                                positionKey={"position" + (idx + 3)}
                                centered={false}
                                isRecordingMode={isRecordingMode}
                            />
                        </Box>
                    </AspectRatio>
                ));

                if (visualLayout.sideAreaViewports.length < 4) {
                    sideBoxes.push(
                        <AspectRatio
                            ratio={1}
                            w="14%"
                            bgColor="gray.700"
                            top={visualLayout.sideAreaViewports.length * 25 + "%"}
                            left="0px"
                            pos="absolute"
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 3)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                <StreamChooser
                                    positionKey={"position" + (visualLayout.sideAreaViewports.length + 3)}
                                    centered={true}
                                    isRecordingMode={isRecordingMode}
                                />
                            </Box>
                        </AspectRatio>
                    );
                }

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
                            <Box>
                                <Box
                                    w="86%"
                                    h={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                    bgColor="gray.500"
                                    top={0}
                                    left="14%"
                                    pos="absolute"
                                >
                                    {visualLayout.largeAreaViewport1 ? (
                                        <portals.OutPortal
                                            node={visualLayout.largeAreaViewport1.component}
                                            enableVideo={true}
                                            resolution="high"
                                            framerate={30}
                                        />
                                    ) : undefined}
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport1}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                                <Box
                                    w="86%"
                                    h={visualLayout.narrow === 2 ? "25%" : visualLayout.narrow === 1 ? "75%" : "50%"}
                                    bgColor="gray.500"
                                    top={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                    left="14%"
                                    pos="absolute"
                                >
                                    {visualLayout.largeAreaViewport2 ? (
                                        <portals.OutPortal
                                            node={visualLayout.largeAreaViewport2.component}
                                            enableVideo={true}
                                            resolution="high"
                                            framerate={30}
                                        />
                                    ) : undefined}
                                    <StreamChooser
                                        positionKey="position2"
                                        centered={!visualLayout.largeAreaViewport2}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                                {sideBoxes}
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
            case VisualLayoutType.DualScreen_Vertical: {
                const sideBoxes: JSX.Element[] = visualLayout.sideAreaViewports.map((viewport, idx) => (
                    <AspectRatio
                        ratio={1}
                        w="14%"
                        bgColor="gray.700"
                        top="75%"
                        left={(100 - 4 * 14) / 2 + idx * 14 + "%"}
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
                            <StreamChooser
                                positionKey={"position" + (idx + 3)}
                                centered={false}
                                isRecordingMode={isRecordingMode}
                            />
                        </Box>
                    </AspectRatio>
                ));

                if (visualLayout.sideAreaViewports.length < 4) {
                    sideBoxes.push(
                        <AspectRatio
                            ratio={1}
                            w="14%"
                            bgColor="gray.700"
                            top="75%"
                            left={(100 - 4 * 14) / 2 + visualLayout.sideAreaViewports.length * 14 + "%"}
                            pos="absolute"
                            key={"placeholder" + (visualLayout.sideAreaViewports.length + 3)}
                        >
                            <Box>
                                <CameraPlaceholderImage />
                                <StreamChooser
                                    positionKey={"position" + (visualLayout.sideAreaViewports.length + 3)}
                                    centered={true}
                                    isRecordingMode={isRecordingMode}
                                />
                            </Box>
                        </AspectRatio>
                    );
                }

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
                            <Box>
                                <Box
                                    w={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                    h="75%"
                                    bgColor="gray.600"
                                    top={0}
                                    left={0}
                                    pos="absolute"
                                >
                                    {visualLayout.largeAreaViewport1 ? (
                                        <portals.OutPortal
                                            node={visualLayout.largeAreaViewport1.component}
                                            enableVideo={true}
                                            resolution="high"
                                            framerate={30}
                                        />
                                    ) : undefined}
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport1}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                                <Box
                                    w={visualLayout.narrow === 2 ? "25%" : visualLayout.narrow === 1 ? "75%" : "50%"}
                                    h="75%"
                                    bgColor="gray.500"
                                    top={0}
                                    left={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                    pos="absolute"
                                >
                                    {visualLayout.largeAreaViewport2 ? (
                                        <portals.OutPortal
                                            node={visualLayout.largeAreaViewport2.component}
                                            enableVideo={true}
                                            resolution="high"
                                            framerate={30}
                                        />
                                    ) : undefined}
                                    <StreamChooser
                                        positionKey="position2"
                                        centered={!visualLayout.largeAreaViewport2}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                                {sideBoxes}
                            </Box>
                        </AspectRatio>
                    </Center>
                );
            }
        }
    }, [isRecordingMode, visualLayout]);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const containerResizeObserver = useResizeObserver(containerRef);
    const [overflowAreaColumns, setOverflowAreaColumns] = useState<number>(2);
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

    const isPresentationLayout = !!mainArea;
    const [enabledStreamIds, setEnabledStreamIds] = useState<string[]>([]);
    const computeEnabledStreamIds = useCallback(() => {
        const cameraStreamIds = visualLayout.overflowViewports
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
        const limitedStreamIds = sortedStreamIds.slice(0, isPresentationLayout ? 4 : 10);
        setEnabledStreamIds((oldEnabledStreamIds) =>
            oldEnabledStreamIds.length !== limitedStreamIds.length ||
            limitedStreamIds.some((x) => !oldEnabledStreamIds.includes(x)) ||
            oldEnabledStreamIds.some((x) => !limitedStreamIds.includes(x))
                ? limitedStreamIds
                : oldEnabledStreamIds
        );
    }, [streamActivities, visualLayout.overflowViewports, isPresentationLayout]);
    usePolling(computeEnabledStreamIds, 1500);
    const overflowArea = useMemo(() => {
        const cameraFeeds = visualLayout.overflowViewports.filter((x) => x.type === "camera");
        return visualLayout.overflowViewports.length > 0 ? (
            <SimpleGrid columns={overflowAreaColumns} gap={2} mt={2}>
                {visualLayout.overflowViewports
                    .filter((x) => x.type === "screen")
                    .map((viewport) => (
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
                                    enabledStreamIds.includes(viewport.streamId))
                            }
                            resolution={
                                isPresentationLayout || enabledStreamIds.length > 10
                                    ? "low"
                                    : enabledStreamIds.length <= 5
                                    ? "high"
                                    : "normal"
                            }
                            framerate={
                                isPresentationLayout || enabledStreamIds.length > 10
                                    ? 7
                                    : enabledStreamIds.length <= 5
                                    ? 30
                                    : 15
                            }
                        />
                    </GridItem>
                ))}
            </SimpleGrid>
        ) : undefined;
    }, [overflowAreaColumns, visualLayout.overflowViewports, isPresentationLayout, enabledStreamIds]);

    return (
        <Box w="100%" h="auto" display="block" ref={containerRef} overflow="hidden">
            {nobodyElseAlert}
            {mainArea ? <Box pos="relative">{mainArea}</Box> : undefined}
            {isRecordingMode && overflowArea ? (
                <>
                    <Divider mt={4} mb={2} borderColor="black" borderWidth={4} />
                    <Heading as="h3" my={4} textAlign="left" mx={4} fontSize="xl">
                        Not visible in {isBackstage ? "stream" : "recording"}
                    </Heading>
                </>
            ) : undefined}
            {overflowArea}
        </Box>
    );
}
