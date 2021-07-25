import { chakra } from "@chakra-ui/react";
import React, { ReactNode, useMemo, useState } from "react";

export function VideoAspectWrapper({
    initialAspectRatio,
    children,
}: {
    initialAspectRatio?: number;
    children: (onAspectRatioChange: (aspectRatio: number) => void) => ReactNode;
}): JSX.Element {
    const [aspectRatio, setAspectRatio] = useState<number>(initialAspectRatio ?? 16 / 9);
    const maxWidth = 90;
    const heightFromWidth = maxWidth / aspectRatio;
    const maxHeight = 90;
    const widthFromHeight = maxHeight * aspectRatio;

    const innerElement = useMemo(() => children(setAspectRatio), [children, setAspectRatio]);

    return (
        <chakra.div
            width="100%"
            maxWidth={`${widthFromHeight}vh`}
            height="90vh"
            maxHeight={`${heightFromWidth}vw`}
            mx="auto"
        >
            {innerElement}
        </chakra.div>
    );
}
