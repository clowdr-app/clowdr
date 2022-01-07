import { Button, ButtonGroup, chakra, Flex, useToken, VStack } from "@chakra-ui/react";
import type { VonageSessionLayoutData} from "@clowdr-app/shared-types/build/vonage";
import { VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import React, { useEffect, useState } from "react";
import { useVonageLayout } from "../VonageLayoutProvider";
import { FormattedMessage, useIntl } from "react-intl";

export default function LayoutChooser(): JSX.Element {
    const intl = useIntl();
    const boxFill = useToken("colors", "gray.400");
    const insetBoxFillStroke = useToken("colors", "gray.600");
    const {
        layout,
        updateLayout,
        saveLayout,
        layoutChooser_isOpen: isOpen,
        layoutChooser_onClose: onClose,
    } = useVonageLayout();
    const [initialLayout, setInitialLayout] = useState<{ layout: VonageSessionLayoutData; createdAt: number } | null>(
        null
    );
    useEffect(() => {
        if (isOpen && !initialLayout) {
            setInitialLayout(layout);
        } else if (!isOpen) {
            if (initialLayout) {
                updateLayout(initialLayout);
            }

            setInitialLayout(null);
        }
    }, [isOpen, initialLayout, layout, updateLayout]);

    return isOpen ? (
        <VStack pt={4} mb={4} bgColor="gray.200">
            <ButtonGroup flexWrap="wrap" alignItems="center" justifyContent="center" gridRowGap={2}>
                <Button
                    colorScheme="DestructiveActionButton"
                    size="lg"
                    onClick={() => {
                        onClose();
                    }}
                >
                    <FormattedMessage
                        id="Conference.Attend.Room.Vonage.Components.LayoutChooser.CancelChanges"
                        defaultMessage="Cancel layout changes"
                    />
                </Button>
                <Button
                    size="lg"
                    colorScheme="ConfirmButton"
                    isDisabled={initialLayout === layout}
                    onClick={() => {
                        saveLayout();
                        setInitialLayout(null);
                        setTimeout(() => {
                            onClose();
                        }, 50);
                    }}
                >
                    <FormattedMessage
                        id="Conference.Attend.Room.Vonage.Components.LayoutChooser.ApplyChanges"
                        defaultMessage="Apply layout changes"
                    />
                </Button>
            </ButtonGroup>
            <Flex w="100%" m={2} flexWrap="wrap">
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.AutoBestFit', defaultMessage: "Automatic best-fit mode" })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    fontSize="2xl"
                    fontWeight="bold"
                    bgColor="gray.900"
                    cursor={layout.layout.type === VonageSessionLayoutType.BestFit ? "default" : "pointer"}
                    _hover={{
                        bgColor: layout.layout.type === VonageSessionLayoutType.BestFit ? "purple.400" : "gray.500",
                    }}
                    _active={{
                        bgColor: layout.layout.type === VonageSessionLayoutType.BestFit ? "purple.400" : "gray.300",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={layout.layout.type === VonageSessionLayoutType.BestFit}
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.BestFit,
                            screenShareType: "verticalPresentation",
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect
                            width="160"
                            height="90"
                            style={{ fill: "transparent", strokeWidth: "5", stroke: boxFill, strokeDasharray: 4 }}
                            rx={10}
                            ry={10}
                        />
                        <text x={25} y={58} style={{ font: "1.5em sans-serif", fill: boxFill }}>
                            Best fit
                        </text>
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.SingleFeedFit', defaultMessage: "Single-feed mode: A full-screen camera or screenshare" })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={layout.layout.type === VonageSessionLayoutType.Single ? "default" : "pointer"}
                    _hover={{
                        bgColor: layout.layout.type === VonageSessionLayoutType.Single ? "purple.400" : "gray.300",
                    }}
                    _active={{
                        bgColor: layout.layout.type === VonageSessionLayoutType.Single ? "purple.400" : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={layout.layout.type === VonageSessionLayoutType.Single}
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.Single,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="160" height="90" style={{ fill: boxFill }} rx={5} ry={5} />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.SideBySide', defaultMessage: "Side-by-side mode: Two camera or screenshare feeds each 50% of the area of the video" })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={layout.layout.type === VonageSessionLayoutType.Pair ? "default" : "pointer"}
                    _hover={{
                        bgColor: layout.layout.type === VonageSessionLayoutType.Pair ? "purple.400" : "gray.300",
                    }}
                    _active={{
                        bgColor: layout.layout.type === VonageSessionLayoutType.Pair ? "purple.400" : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={layout.layout.type === VonageSessionLayoutType.Pair}
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.Pair,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="78" height="90" x="0" style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="78" height="90" x="82" style={{ fill: boxFill }} rx={5} ry={5} />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.PipMode', defaultMessage: "Picture-in-picture mode: Two camera or screenshare feeds, one full screen, the other overlayed in the bottom right corner" })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={layout.layout.type === VonageSessionLayoutType.PictureInPicture ? "default" : "pointer"}
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.PictureInPicture ? "purple.400" : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.PictureInPicture ? "purple.400" : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={layout.layout.type === VonageSessionLayoutType.PictureInPicture}
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.PictureInPicture,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="160" height="90" style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect
                            width="32"
                            height="18"
                            x="124"
                            y="66"
                            style={{ fill: boxFill, stroke: insetBoxFillStroke, strokeWidth: 2 }}
                            rx={1}
                            ry={1}
                        />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.FittedFour', defaultMessage: "Fitted-4 mode: Stack of 4 cameras to the left of a screenshare" })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "left"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "left"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "left"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "left"}
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.Fitted4,
                            side: "left",
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="20" height="20" x={0} y={0} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={23.3} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={46.6} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="136" height="90" x={24} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.FittedFourRow', defaultMessage: "Fitted-4 mode: Row of 4 cameras underneath a screenshare" })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "bottom"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "bottom"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "bottom"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={
                        layout.layout.type === VonageSessionLayoutType.Fitted4 && layout.layout.side === "bottom"
                    }
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.Fitted4,
                            side: "bottom",
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="160" height="66" x={0} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="20" height="20" x={35.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={58.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={81.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={104.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                    </chakra.svg>
                </Button>

                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.DualScreen', defaultMessage: "Dual-screenshare mode: Vertical split. Two screenshares side by side, 50/50 split, with 4 cameras underneath." })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === null &&
                        layout.layout.splitDirection === "vertical"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === null &&
                            layout.layout.splitDirection === "vertical"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === null &&
                            layout.layout.splitDirection === "vertical"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === null &&
                        layout.layout.splitDirection === "vertical"
                    }
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.DualScreen,
                            splitDirection: "vertical",
                            narrowStream: null,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="78.5" height="66" x={0} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="78.5" height="66" x={81.5} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="20" height="20" x={35.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={58.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={81.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={104.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.DualScreenMode', defaultMessage: "Dual-screenshare mode: Vertical split, narrow left. Two screenshares side by side, 25/75% split, with 4 cameras underneath." })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 1 &&
                        layout.layout.splitDirection === "vertical"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 1 &&
                            layout.layout.splitDirection === "vertical"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 1 &&
                            layout.layout.splitDirection === "vertical"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 1 &&
                        layout.layout.splitDirection === "vertical"
                    }
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.DualScreen,
                            splitDirection: "vertical",
                            narrowStream: 1,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="40" height="66" x={0} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="117" height="66" x={43} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="20" height="20" x={35.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={58.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={81.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={104.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.DualScreenModeUndersearch', defaultMessage: "Dual-screenshare mode: Vertical split, narrow right. Two screenshares side by side, 75/25% split, with 4 cameras underneath." })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 2 &&
                        layout.layout.splitDirection === "vertical"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 2 &&
                            layout.layout.splitDirection === "vertical"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 2 &&
                            layout.layout.splitDirection === "vertical"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 2 &&
                        layout.layout.splitDirection === "vertical"
                    }
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.DualScreen,
                            splitDirection: "vertical",
                            narrowStream: 2,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="117" height="66" x={0} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="40" height="66" x={120} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="20" height="20" x={35.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={58.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={81.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={104.5} y={69.9} style={{ fill: boxFill }} rx={2} />
                    </chakra.svg>
                </Button>

                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.DualScreenSplit1', defaultMessage: "Dual-screenshare mode: Horizontal split. Two screenshares one above the other, 50/50% split, with 4 cameras to the left." })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === null &&
                        layout.layout.splitDirection === "horizontal"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === null &&
                            layout.layout.splitDirection === "horizontal"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === null &&
                            layout.layout.splitDirection === "horizontal"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === null &&
                        layout.layout.splitDirection === "horizontal"
                    }
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.DualScreen,
                            splitDirection: "horizontal",
                            narrowStream: null,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="137" height="43.5" x={23} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="137" height="43.5" x={23} y={46.5} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="20" height="20" x={0} y={0} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={23.3} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={46.6} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={69.9} style={{ fill: boxFill }} rx={2} />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.DualScreenSplit2', defaultMessage: "Dual-screenshare mode: Horizontal split, narrow bottom. Two screenshares one above the other, 75/25% split, with 4 cameras to the left." })}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 2 &&
                        layout.layout.splitDirection === "horizontal"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 1 &&
                            layout.layout.splitDirection === "horizontal"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 1 &&
                            layout.layout.splitDirection === "horizontal"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 2 &&
                        layout.layout.splitDirection === "horizontal"
                    }
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.DualScreen,
                            splitDirection: "horizontal",
                            narrowStream: 2,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="137" height="66" x={23} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="137" height="21" x={23} y={69} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="20" height="20" x={0} y={0} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={23.3} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={46.6} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={69.9} style={{ fill: boxFill }} rx={2} />
                    </chakra.svg>
                </Button>
                <Button
                    aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.LayoutChooser.DualScreenSplit3', defaultMessage: "Dual-screenshare mode: Horizontal split, narrow top. Two screenshares one above the other, 75/25% split, with 4 cameras to the left."})}
                    flex="0 0 170px"
                    h="100px"
                    maxH="auto"
                    maxW="auto"
                    p="5px"
                    m={2}
                    bgColor="gray.900"
                    cursor={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 1 &&
                        layout.layout.splitDirection === "horizontal"
                            ? "default"
                            : "pointer"
                    }
                    _hover={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 2 &&
                            layout.layout.splitDirection === "horizontal"
                                ? "purple.400"
                                : "gray.300",
                    }}
                    _active={{
                        bgColor:
                            layout.layout.type === VonageSessionLayoutType.DualScreen &&
                            layout.layout.narrowStream === 2 &&
                            layout.layout.splitDirection === "horizontal"
                                ? "purple.400"
                                : "gray.500",
                    }}
                    _disabled={{
                        bgColor: "purple.400",
                    }}
                    isDisabled={
                        layout.layout.type === VonageSessionLayoutType.DualScreen &&
                        layout.layout.narrowStream === 1 &&
                        layout.layout.splitDirection === "horizontal"
                    }
                    onClick={() => {
                        const _layout: any = layout.layout;
                        const outputLayout: any = {
                            type: VonageSessionLayoutType.DualScreen,
                            splitDirection: "horizontal",
                            narrowStream: 1,
                        };
                        let outputIdx = 1;
                        for (let idx = 1; idx <= 6; idx++) {
                            const key = "position" + idx;
                            if (key in _layout && _layout[key]) {
                                outputLayout["position" + outputIdx] = _layout[key];
                                outputIdx++;
                            }
                        }
                        updateLayout({ layout: outputLayout, createdAt: Date.now() });
                    }}
                >
                    <chakra.svg w={160} h={90}>
                        <rect width="137" height="21" x={23} y={0} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="137" height="66" x={23} y={24} style={{ fill: boxFill }} rx={5} ry={5} />
                        <rect width="20" height="20" x={0} y={0} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={23.3} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={46.6} style={{ fill: boxFill }} rx={2} />
                        <rect width="20" height="20" x={0} y={69.9} style={{ fill: boxFill }} rx={2} />
                    </chakra.svg>
                </Button>
            </Flex>
        </VStack>
    ) : (
        <></>
    );
}
