import { Box, BoxProps } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { OutPortal } from "react-reverse-portal";
import { useEmojiFloat } from "./EmojiFloat";

export default function EmojiFloatContainer(
    props: BoxProps & { xDurationMs?: number; yDurationMs?: number }
): JSX.Element {
    const emojiFloat = useEmojiFloat();

    useEffect(() => {
        emojiFloat.setIsActive(true);
        emojiFloat.setExtents(70, 90, props.xDurationMs ?? 1500, 100, 0, props.yDurationMs ?? 4000);

        return () => {
            emojiFloat.setIsActive(false);
        };
    }, [emojiFloat, props.xDurationMs, props.yDurationMs]);

    return (
        <Box position="absolute" top={0} left={0} w="100%" h="100%" zIndex={100} pointerEvents="none" {...props}>
            <OutPortal node={emojiFloat.portalNode} />
        </Box>
    );
}
