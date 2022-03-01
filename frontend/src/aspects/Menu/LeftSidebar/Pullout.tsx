import { Slide, useColorModeValue, useOutsideClick, useToken } from "@chakra-ui/react";
import React, { useRef } from "react";
import useIsNarrowView from "../../Hooks/useIsNarrowView";

export default function Pullout({
    children,
    isIn,
    onClose,
}: React.PropsWithChildren<{ isIn: boolean; isMenuExpanded: boolean; onClose: (ev: Event) => void }>): JSX.Element {
    const narrowView = useIsNarrowView();

    const bgColor = useColorModeValue("gray.50", "gray.700");
    const bgColorToken = useToken("colors", bgColor);
    const shadow = useToken("shadows", "left-pullout");

    const ref = useRef<HTMLDivElement>(null);
    useOutsideClick({
        ref,
        handler: onClose,
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
                overflowY: "auto",
                padding: "0.4em",
                boxShadow: isIn ? shadow : undefined,
            }}
            ref={ref}
        >
            {children}
        </Slide>
    );
}
