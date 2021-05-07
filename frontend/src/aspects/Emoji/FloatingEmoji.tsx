import { Box, keyframes } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";

export default function FloatingEmoji({
    emoji,
    xInitial,
    yInitial,
    xStartPc,
    xEndPc,
    yEndPc,
    xDurationMs,
    yDurationMs,
    name,
}: {
    emoji: string;
    xInitial: number;
    yInitial: number;
    xStartPc: number;
    yStartPc: number;
    xEndPc: number;
    yEndPc: number;
    xDurationMs: number;
    yDurationMs: number;
    createdAt: number;
    name: string;
}): JSX.Element {
    const yKeyframesStr = keyframes`
        0% {
            top: ${yInitial}%;
            opacity: 0;
        }
        5% {
            opacity: 0.9;
        }
        20% {
            opacity: 0.9;
        }
        100% {
            top: ${yEndPc}%;
            opacity: 0;
        }
    `;

    const xKeyframesStr = keyframes`
        0% {
            left: ${xInitial}%;
        }
        100% {
            left: ${xStartPc + Math.random() * (xEndPc - xStartPc)}%;
        }
    `;

    const shortName = useMemo(() => name.split(" ")[0], [name]);

    return (
        <Box
            pos="absolute"
            w="auto"
            h="auto"
            top={yInitial + "%"}
            left={xInitial + "%"}
            minW="unset"
            minH="unset"
            animation={`
            ${yKeyframesStr} ${yDurationMs}ms ease-out forwards,
            ${xKeyframesStr} ${xDurationMs}ms ease-in-out infinite alternate both`}
            display="flex"
            flexDir="column"
            justifyContent="center"
            textAlign="center"
        >
            <Box fontSize="3xl">
                <Twemoji className="twemoji" text={emoji} />
            </Box>
            <Box fontSize="xs" maxW="7em" overflowWrap="normal" noOfLines={2}>
                {shortName}
            </Box>
        </Box>
    );
}
