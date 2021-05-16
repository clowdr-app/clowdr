import { Box, BoxProps } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { OutPortal } from "react-reverse-portal";
import { useEmojiFloat } from "./EmojiFloat";

export default function EmojiFloatContainer({
    chatId,
    xDurationMs = 1500,
    yDurationMs = 4000,
    ...props
}: BoxProps & { chatId: string; xDurationMs?: number; yDurationMs?: number }): JSX.Element {
    const emojiFloat = useEmojiFloat();

    useEffect(() => {
        emojiFloat.setIsActive(chatId);
        emojiFloat.setExtents(70, 90, xDurationMs, 100, 0, yDurationMs);

        return () => {
            emojiFloat.setIsActive("");
        };
    }, [emojiFloat, xDurationMs, yDurationMs, chatId]);

    return (
        <Box position="absolute" top={0} left={0} w="100%" h="100%" zIndex={100} pointerEvents="none" {...props}>
            <OutPortal node={emojiFloat.portalNode} />
        </Box>
    );
}
