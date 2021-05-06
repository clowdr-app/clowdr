import { Box, keyframes } from "@chakra-ui/react";
import React from "react";
import { Twemoji } from "react-emoji-render";

export default function FloatingEmoji({
    emoji,
    xInitial,
    yInitial,
    xStartPc,
    xEndPc,
    yStartPc,
    yEndPc,
    xDurationMs,
    yDurationMs,
    createdAt,
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
}): JSX.Element {
    const yKeyframesStr = keyframes`
        0% {
            top: ${yInitial}%;
            opacity: 0;
        }
        5% {
            opacity: 0.8;
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

    return (
        <Box
            fontSize="3xl"
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
        >
            <Twemoji className="twemoji" text={emoji} />
        </Box>
    );
}
