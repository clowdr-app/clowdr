import { Box, useColorModeValue } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import Draggable from "react-draggable";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import useIsNarrowView from "../Hooks/useIsNarrowView";
import { useRestorableState } from "../Hooks/useRestorableState";
import RightSidebarSections from "./RightSidebar/RightSidebarSections";

export default function RightMenu({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}): JSX.Element {
    const maybeRegistrant = useMaybeCurrentRegistrant();

    const rightSections = useMemo(
        () =>
            maybeRegistrant ? (
                <RightSidebarSections
                    isVisible={isOpen}
                    setIsVisible={setIsOpen}
                    onClose={() => {
                        /* Nothing */
                    }}
                />
            ) : undefined,
        [maybeRegistrant, isOpen]
    );

    const bgColor = useColorModeValue("RightMenu.50", "RightMenu.900");
    const resizerColor = useColorModeValue("RightMenu.700", "RightMenu.700");
    const resizerHoverColor = useColorModeValue("RightMenu.400", "RightMenu.600");
    const narrowView = useIsNarrowView();

    const [width, setWidth] = useRestorableState<number>(
        "RightMenu.Width",
        300,
        (x) => x.toFixed(0),
        (x) => parseInt(x)
    );
    const defaultDragHandleWidth = 5;
    const [dragHandleWidth, setDragHandleWidth] = useState<number>(defaultDragHandleWidth);

    const widthStr = isOpen ? (narrowView ? "100%" : `min(max(${width}px, 250px), 50%)`) : 0;

    const onKeyPress = useCallback(
        (ev: React.KeyboardEvent<HTMLDivElement>) => {
            if (
                ev.key === "ArrowLeft" ||
                ev.key === "+" ||
                ev.key === "a" ||
                ev.key === "A" ||
                ev.key === "j" ||
                ev.key === "J"
            ) {
                ev.preventDefault();
                ev.stopPropagation();
                setWidth(
                    Math.max(((ev.target as HTMLDivElement).offsetParent as HTMLDivElement).offsetWidth + 25, 250)
                );
            } else if (
                ev.key === "ArrowRight" ||
                ev.key === "-" ||
                ev.key === "d" ||
                ev.key === "D" ||
                ev.key === "l" ||
                ev.key === "L"
            ) {
                ev.preventDefault();
                ev.stopPropagation();
                setWidth(
                    Math.max(((ev.target as HTMLDivElement).offsetParent as HTMLDivElement).offsetWidth - 25, 250)
                );
            }
        },
        [setWidth]
    );

    return (
        <Box
            display={isOpen && maybeRegistrant ? "flex" : "none"}
            pos={narrowView ? "absolute" : "relative"}
            flexGrow={0}
            flexShrink={0}
            w={widthStr}
            flexBasis={widthStr}
            h={narrowView ? "calc(100% - 6ex - 6px)" : "100%"}
            top={narrowView ? "calc(6ex + 6px)" : "0"}
            left={0}
            bgColor={bgColor}
            zIndex={2}
            transition="width 0.05s cubic-bezier(0.33, 1, 0.68, 1), flex-basis 0.05s cubic-bezier(0.33, 1, 0.68, 1)"
        >
            {rightSections}
            <Draggable
                axis="x"
                onStop={(_e, data) => {
                    setWidth(
                        Math.max((data.node.offsetParent as HTMLDivElement).offsetWidth - data.x - dragHandleWidth, 250)
                    );
                }}
                position={{ x: -dragHandleWidth, y: 0 }}
            >
                <Box
                    zIndex={1}
                    pos="absolute"
                    w={`${dragHandleWidth}px`}
                    h="100%"
                    bgColor={resizerColor}
                    cursor="ew-resize"
                    aria-label="Resize chat width"
                    tabIndex={0}
                    onKeyUp={(ev) => {
                        onKeyPress(ev);
                    }}
                    onKeyDown={(ev) => {
                        if (ev.repeat) {
                            onKeyPress(ev);
                        }
                    }}
                    onFocus={() => {
                        setDragHandleWidth(10);
                    }}
                    onBlur={() => {
                        setDragHandleWidth(defaultDragHandleWidth);
                    }}
                    _hover={{
                        bgColor: resizerHoverColor,
                    }}
                    _focus={{
                        shadow: defaultOutline_AsBoxShadow,
                    }}
                    _active={{
                        shadow: defaultOutline_AsBoxShadow,
                    }}
                ></Box>
            </Draggable>
        </Box>
    );
}
