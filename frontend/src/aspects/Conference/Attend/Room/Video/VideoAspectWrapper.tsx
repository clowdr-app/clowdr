import { AspectRatio, chakra } from "@chakra-ui/react";
import useSize from "@react-hook/size";
import type { ReactNode } from "react";
import React, { useMemo, useRef, useState } from "react";

export function VideoAspectWrapperAuto({
    initialAspectRatio,
    children,
}: {
    initialAspectRatio?: number;
    children: (onAspectRatioChange: (aspectRatio: number) => void) => ReactNode;
}): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);
    const [width, height] = useSize(ref);

    return (
        <chakra.div w="100%" h="100%" display="flex" flexDirection="column" justifyContent="center" ref={ref}>
            <VideoAspectWrapper maxWidth={width} maxHeight={height} initialAspectRatio={initialAspectRatio}>
                {children}
            </VideoAspectWrapper>
        </chakra.div>
    );
}

export function VideoAspectWrapper({
    initialAspectRatio,
    maxHeight,
    maxWidth,
    children,
}: {
    initialAspectRatio?: number;
    maxHeight?: number;
    maxWidth?: number;
    children: (onAspectRatioChange: (aspectRatio: number) => void) => ReactNode;
}): JSX.Element {
    const [aspectRatio, setAspectRatio] = useState<number>(initialAspectRatio ?? 16 / 9);

    const innerElement = useMemo(() => children(setAspectRatio), [children, setAspectRatio]);

    const dimensions = maxWidth
        ? maxHeight
            ? {
                  width: `${Math.min(maxHeight * aspectRatio, maxWidth)}px`,
                  height: `${Math.min(maxWidth / aspectRatio, maxHeight)}px`,
              }
            : null
        : maxHeight
        ? { width: `${maxHeight * aspectRatio}px`, height: `${maxHeight}px` }
        : null;

    return dimensions ? (
        <chakra.div width={dimensions.width} height={dimensions.height} mx="auto">
            {innerElement}
        </chakra.div>
    ) : (
        <AspectRatio maxW={maxWidth} w="100%">
            {innerElement}
        </AspectRatio>
    );
}
