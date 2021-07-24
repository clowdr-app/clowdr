import { chakra } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import React from "react";

export function VideoAspectWrapper({
    aspectRatio,
    children,
}: PropsWithChildren<{ aspectRatio?: number }>): JSX.Element {
    const chosenAspectRatio: number = aspectRatio ?? 16 / 9;
    const maxWidth = 90;
    const heightFromWidth = maxWidth / chosenAspectRatio;
    const maxHeight = 90;
    const widthFromHeight = maxHeight * chosenAspectRatio;

    return (
        <chakra.div
            width={`minmax(${maxWidth}vw, ${widthFromHeight}vh)`}
            height={`${heightFromWidth}vw`}
            maxHeight={`${maxHeight}vh`}
            maxWidth={`${widthFromHeight}vh`}
            mx="auto"
        >
            {children}
        </chakra.div>
    );
}
