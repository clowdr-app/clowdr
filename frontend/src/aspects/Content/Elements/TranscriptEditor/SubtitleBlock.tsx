import { Button, Flex, Textarea } from "@chakra-ui/react";
import React, { CSSProperties } from "react";
import { FAIcon } from "../../../Icons/FAIcon";
import TimecodeInput from "./TimecodeInput";

export const MAX_SUBTITLE_BLOCK_LINES = 3;
export const MAX_SUBTITLE_LINE_LENGTH = 47;
const SUBTITLE_LEFT_ICONS_WIDTH_CH = 6;
const SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH = 6;
const SUBTITLE_TIMECODE_INPUT_WIDTH_CH = 20;
const SUBTITLE_TEXTAREA_WIDTH = `${MAX_SUBTITLE_LINE_LENGTH + SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH}ch`;
const SUBTITLE_TIMECODE_INPUT_WIDTH = `${SUBTITLE_TIMECODE_INPUT_WIDTH_CH}ch`;
export const SUBTITLE_BLOCK_WIDTH_CH =
    SUBTITLE_LEFT_ICONS_WIDTH_CH +
    MAX_SUBTITLE_LINE_LENGTH +
    SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH +
    SUBTITLE_TIMECODE_INPUT_WIDTH_CH;

export default function SubtitleBlock({
    startTenths,
    endTenths,
    text,
    onTextInput,
    onStartTenthsInput,
    onEndTenthsInput,
    onDelete,
    style,
}: {
    startTenths: number;
    endTenths: number;
    text: string;
    onTextInput: (newText: string) => void;
    onStartTenthsInput: (newStartTenths: number) => void;
    onEndTenthsInput: (newEndTenths: number) => void;
    onDelete: () => void;
    style: CSSProperties;
}): JSX.Element {
    return (
        <Flex {...{ style }}>
            <Button
                height="100%"
                aria-label="Delete subtitle block"
                title="Delete subtitle block"
                backgroundColor="var(--chakra-colors-AppPageV2-pageBackground-light)"
                color="var(--chakra-colors-gray-100)"
                _hover={{ backgroundColor: "var(--chakra-colors-gray-100)", color: "DestructiveActionButton.400" }}
                onClick={onDelete}
            >
                <FAIcon iconStyle="s" icon="trash " />
            </Button>
            <Textarea
                width={SUBTITLE_TEXTAREA_WIDTH}
                rows={MAX_SUBTITLE_BLOCK_LINES}
                cols={MAX_SUBTITLE_LINE_LENGTH}
                resize="none"
                value={text}
                onInput={(e) => {
                    onTextInput((e.target as HTMLTextAreaElement).value);
                }}
            />
            <Flex width={SUBTITLE_TIMECODE_INPUT_WIDTH} flexDirection="column" justifyContent="space-between">
                <TimecodeInput value={startTenths} onInput={onStartTenthsInput} />
                <TimecodeInput value={endTenths} onInput={onEndTenthsInput} />
            </Flex>
        </Flex>
    );
}
