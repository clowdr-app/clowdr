import { Flex, Textarea } from "@chakra-ui/react";
import React, { CSSProperties } from "react";
import TimecodeInput from "./TimecodeInput";

export const MAX_SUBTITLE_BLOCK_LINES = 3;
export const MAX_SUBTITLE_LINE_LENGTH = 47;
const SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH = 6;
const SUBTITLE_TIMECODE_INPUT_WIDTH_CH = 20;
const SUBTITLE_TEXTAREA_WIDTH = `${MAX_SUBTITLE_LINE_LENGTH + SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH}ch`;
const SUBTITLE_TIMECODE_INPUT_WIDTH = `${SUBTITLE_TIMECODE_INPUT_WIDTH_CH}ch`;
export const SUBTITLE_BLOCK_WIDTH_CH =
    MAX_SUBTITLE_LINE_LENGTH + SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH + SUBTITLE_TIMECODE_INPUT_WIDTH_CH;

export default function SubtitleBlock({
    startTenths,
    endTenths,
    text,
    onTextInput,
    onStartTenthsInput,
    onEndTenthsInput,
    style,
}: {
    startTenths: number;
    endTenths: number;
    text: string;
    onTextInput: (newText: string) => void;
    onStartTenthsInput: (newStartTenths: number) => void;
    onEndTenthsInput: (newEndTenths: number) => void;
    style: CSSProperties;
}): JSX.Element {
    return (
        <Flex style={{ ...style, fontFamily: "monospace" }}>
            <Textarea
                width={String(MAX_SUBTITLE_LINE_LENGTH + 6) + "ch"}
                rows={MAX_SUBTITLE_BLOCK_LINES}
                cols={MAX_SUBTITLE_LINE_LENGTH}
                resize="none"
                value={text}
                onInput={(e) => {
                    onTextInput((e.target as HTMLTextAreaElement).value);
                }}
            />
            <Flex width={"20ch"} flexDirection="column" justifyContent="space-between">
                <TimecodeInput value={startTenths} onInput={onStartTenthsInput} />
                <TimecodeInput value={endTenths} onInput={onEndTenthsInput} />
            </Flex>
        </Flex>
    );
}
