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
import React, { useEffect, useMemo, useState } from "react";
import * as portals from "react-reverse-portal";
import useResizeObserver from "../../../../../Generic/useResizeObserver";
import { useVonageLayout } from "../VonageLayoutProvider";
import CameraPlaceholderImage from "./CameraPlaceholder";
import { Viewport, VisualLayoutType } from "./LayoutTypes";
import StreamChooser from "./StreamChooser";
import useVisualLayout from "./useVisualLayout";

export default function Layout({
    viewports,
    isRecordingMode,
}: {
    viewports: Viewport[];
    isRecordingMode: boolean;
}): JSX.Element {
    const layout = useVonageLayout();
    const visualLayout = useVisualLayout(layout.layout, isRecordingMode, viewports);

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

                // TODO: Non-editable layout
                return (
                    <AspectRatio as={Flex} justifyContent="center" w="100%" ratio={16 / 9}>
                        <Box>
                            {visualLayout.viewports.map((viewport) => (
                                <AspectRatio
                                    ratio={16 / 9}
                                    w={
                                        visualLayout.viewports.length === 1
                                            ? "100%"
                                            : visualLayout.viewports.length === 2
                                            ? "50%"
                                            : visualLayout.viewports.length === 3
                                            ? "33%"
                                            : "25%"
                                    }
                                    bgColor="gray.700"
                                    pos="relative"
                                    key={viewport.streamId ?? viewport.connectionId}
                                    m={1}
                                >
                                    <Box>
                                        <portals.OutPortal node={viewport.component} />
                                    </Box>
                                </AspectRatio>
                            ))}
                        </Box>
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
                        <portals.OutPortal node={viewport.component} />
                    </Box>
                ));

                return (
                    <Center border="3px solid" borderColor="gray.900">
                        <AspectRatio
                            ratio={16 / 9}
                            w="100%"
                            maxW="calc((16 / 9) * 90vh)"
                            bgColor="gray.500"
                            mr={1}
                            pos="relative"
                        >
                            <Box>
                                <Box w="100%" h="80%" bgColor="gray.500" top={0} left={0} pos="absolute">
                                    {visualLayout.screenshareViewport ? (
                                        <portals.OutPortal node={visualLayout.screenshareViewport.component} />
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
                            <portals.OutPortal node={viewport.component} />
                        </Box>
                    </AspectRatio>
                ));

                return (
                    <Center border="3px solid" borderColor="gray.900">
                        <AspectRatio
                            ratio={16 / 9}
                            w="100%"
                            maxW="calc((16 / 9) * 90vh)"
                            bgColor="gray.500"
                            mr={1}
                            pos="relative"
                        >
                            <Box>
                                <Box w="85%" h="100%" bgColor="gray.500" top={0} left="15%" pos="absolute">
                                    {visualLayout.screenshareViewport ? (
                                        <portals.OutPortal node={visualLayout.screenshareViewport.component} />
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
                    <Box w="100%" bgColor="gray.500" h="calc(90vh - 250px)">
                        {visualLayout.viewport ? (
                            <portals.OutPortal node={visualLayout.viewport.component} />
                        ) : undefined}
                        <StreamChooser
                            positionKey="position1"
                            centered={!visualLayout.viewport}
                            isRecordingMode={isRecordingMode}
                        />
                    </Box>
                );
            }
            case VisualLayoutType.Pair: {
                return (
                    <Flex my={2} h="calc(90vh - 250px)">
                        <Box w="50%" bgColor="gray.500" mr={1} pos="relative">
                            {visualLayout.leftViewport ? (
                                <portals.OutPortal node={visualLayout.leftViewport.component} />
                            ) : undefined}
                            <StreamChooser
                                positionKey="position1"
                                centered={!visualLayout.leftViewport}
                                isRecordingMode={isRecordingMode}
                            />
                        </Box>
                        <Box w="50%" bgColor="gray.500" ml={1} pos="relative">
                            {visualLayout.rightViewport ? (
                                <portals.OutPortal node={visualLayout.rightViewport.component} />
                            ) : undefined}
                            <StreamChooser
                                positionKey="position2"
                                centered={!visualLayout.rightViewport}
                                isRecordingMode={isRecordingMode}
                            />
                        </Box>
                    </Flex>
                );
            }
            case VisualLayoutType.PictureInPicture: {
                return (
                    <Box w="100%" bgColor="gray.500" h="calc(90vh - 250px)" mr={1} pos="relative">
                        {visualLayout.fullscreenViewport ? (
                            <portals.OutPortal node={visualLayout.fullscreenViewport.component} />
                        ) : undefined}
                        <StreamChooser
                            positionKey="position1"
                            centered={!visualLayout.fullscreenViewport}
                            isRecordingMode={isRecordingMode}
                        />
                        <AspectRatio ratio={1} w="15.67%" bgColor="gray.700" bottom="20px" right="20px" pos="absolute">
                            <Box>
                                {visualLayout.insetViewport ? (
                                    <portals.OutPortal node={visualLayout.insetViewport.component} />
                                ) : undefined}
                                <StreamChooser
                                    positionKey="position2"
                                    centered={!visualLayout.insetViewport}
                                    isRecordingMode={isRecordingMode}
                                />
                            </Box>
                        </AspectRatio>
                    </Box>
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
                            <portals.OutPortal node={viewport.component} />
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
                            maxW="calc((16 / 9) * 90vh)"
                            bgColor="gray.500"
                            mr={1}
                            pos="relative"
                        >
                            <Box>
                                <Box w="86%" h="100%" bgColor="gray.500" top={0} left="14%" pos="absolute">
                                    {visualLayout.largeAreaViewport ? (
                                        <portals.OutPortal node={visualLayout.largeAreaViewport.component} />
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
                            <portals.OutPortal node={viewport.component} />
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
                            maxW="calc((16 / 9) * 90vh)"
                            bgColor="gray.500"
                            mr={1}
                            pos="relative"
                        >
                            <Box>
                                <Box w="100%" h="75%" bgColor="gray.600" top={0} left={0} pos="absolute">
                                    {visualLayout.largeAreaViewport ? (
                                        <portals.OutPortal node={visualLayout.largeAreaViewport.component} />
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
                            <portals.OutPortal node={viewport.component} />
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
                            maxW="calc((16 / 9) * 90vh)"
                            bgColor="gray.500"
                            mr={1}
                            pos="relative"
                        >
                            <Box>
                                <Box
                                    w="86%"
                                    h={visualLayout.narrow === 2 ? "25%" : visualLayout.narrow === 1 ? "75%" : "50%"}
                                    bgColor="gray.500"
                                    top={0}
                                    left="14%"
                                    pos="absolute"
                                >
                                    {visualLayout.largeAreaViewport1 ? (
                                        <portals.OutPortal node={visualLayout.largeAreaViewport1.component} />
                                    ) : undefined}
                                    <StreamChooser
                                        positionKey="position1"
                                        centered={!visualLayout.largeAreaViewport1}
                                        isRecordingMode={isRecordingMode}
                                    />
                                </Box>
                                <Box
                                    w="86%"
                                    h={visualLayout.narrow === 1 ? "25%" : visualLayout.narrow === 2 ? "75%" : "50%"}
                                    bgColor="gray.500"
                                    top={visualLayout.narrow === 2 ? "25%" : visualLayout.narrow === 1 ? "75%" : "50%"}
                                    left="14%"
                                    pos="absolute"
                                >
                                    {visualLayout.largeAreaViewport2 ? (
                                        <portals.OutPortal node={visualLayout.largeAreaViewport2.component} />
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
                            <portals.OutPortal node={viewport.component} />
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
                            maxW="calc((16 / 9) * 90vh)"
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
                                        <portals.OutPortal node={visualLayout.largeAreaViewport1.component} />
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
                                        <portals.OutPortal node={visualLayout.largeAreaViewport2.component} />
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
    const overflowArea = useMemo(
        () =>
            visualLayout.overflowViewports.length > 0 ? (
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
                                <portals.OutPortal node={viewport.component} />
                            </GridItem>
                        ))}
                    {visualLayout.overflowViewports
                        .filter((x) => x.type === "camera")
                        .map((viewport) => (
                            <GridItem
                                as={AspectRatio}
                                ratio={1}
                                key={viewport.streamId ?? viewport.connectionId}
                                pos="relative"
                                width="100%"
                            >
                                <portals.OutPortal node={viewport.component} />
                            </GridItem>
                        ))}
                </SimpleGrid>
            ) : undefined,
        [overflowAreaColumns, visualLayout.overflowViewports]
    );

    return (
        <Box w="100%" h="auto" display="block" ref={containerRef} overflow="hidden">
            {nobodyElseAlert}
            {mainArea ? <Box pos="relative">{mainArea}</Box> : undefined}
            {isRecordingMode && overflowArea ? (
                <>
                    <Divider mt={4} mb={2} borderColor="black" borderWidth={4} />
                    <Heading as="h3" my={4} textAlign="left" mx={4} fontSize="xl">
                        Not visible in recording or stream
                    </Heading>
                </>
            ) : undefined}
            {overflowArea}
        </Box>
    );
}
