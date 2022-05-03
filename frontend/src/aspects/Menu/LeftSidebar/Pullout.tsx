import { Button, Slide, useColorModeValue, useOutsideClick, useToken } from "@chakra-ui/react";
import React, { useCallback, useRef } from "react";
import FAIcon from "../../Chakra/FAIcon";
import useIsNarrowView from "../../Hooks/useIsNarrowView";

export default function Pullout({
    children,
    isIn,
    onClose,
    menuButtonId,
    noOverflowY,
    noPadding,
}: React.PropsWithChildren<{
    isIn: boolean;
    isMenuExpanded: boolean;
    onClose: () => void;
    menuButtonId: string;
    noOverflowY?: boolean;
    noPadding?: boolean;
}>): JSX.Element {
    const narrowView = useIsNarrowView();

    const bgColor = useColorModeValue("gray.50", "gray.800");
    const bgColorToken = useToken("colors", bgColor);
    const shadow = useToken("shadows", "left-pullout");

    const onCloseWrapped = useCallback(
        (ev: Event | React.MouseEvent<HTMLButtonElement>) => {
            const t = ev.target as HTMLElement;
            if (t.id !== menuButtonId && t.offsetParent?.id !== menuButtonId && !t.closest(".chakra-portal")) {
                onClose();
            }
        },
        [menuButtonId, onClose]
    );

    const ref = useRef<HTMLDivElement>(null);
    useOutsideClick({
        ref,
        handler: onCloseWrapped,
    });

    return (
        <Slide
            in={isIn}
            direction="left"
            style={{
                zIndex: 1,
                position: "absolute",
                left: "100%",
                top: "0",
                width: narrowView ? "100vw" : "auto",
                backgroundColor: bgColorToken,
                display: "flex",
                flexDirection: "column",
                overflowX: "hidden",
                overflowY: noOverflowY ? "hidden" : "auto",
                padding: noPadding ? "0" : "0.4em",
                boxShadow: isIn ? shadow : undefined,
                scrollbarWidth: "thin",
            }}
            ref={ref}
        >
            {narrowView ? (
                <Button
                    aria-label="Close Live Now list"
                    leftIcon={<FAIcon iconStyle="s" icon="times" />}
                    colorScheme="LeftMenuButton"
                    variant="ghost"
                    onClick={onCloseWrapped}
                    m="3px"
                    size="sm"
                    alignSelf="flex-end"
                >
                    Close
                </Button>
            ) : undefined}
            {isIn ? children : undefined}
        </Slide>
    );
}
