import type { FlexProps } from "@chakra-ui/react";
import { Button, Flex, Textarea } from "@chakra-ui/react";
import React from "react";
import { FAIcon } from "../../../Icons/FAIcon";
import TimecodeInput from "./TimecodeInput";

export const MAX_SUBTITLE_BLOCK_LINES = 3;
export const MAX_SUBTITLE_LINE_LENGTH = 47;
const SUBTITLE_BLOCK_PADDING_CH = 1;
const SUBTITLE_ICONS_WIDTH_CH = 6;
const SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH = 12;
const SUBTITLE_TIMECODE_INPUT_WIDTH_CH = 20;
const SUBTITLE_TEXTAREA_WIDTH = `${MAX_SUBTITLE_LINE_LENGTH + SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH}ch`;
const SUBTITLE_TIMECODE_INPUT_WIDTH = `${SUBTITLE_TIMECODE_INPUT_WIDTH_CH}ch`;
export const SUBTITLE_BLOCK_WIDTH_CH =
    SUBTITLE_ICONS_WIDTH_CH +
    MAX_SUBTITLE_LINE_LENGTH +
    SUBTITLE_TEXTAREA_EXTRA_WIDTH_CH +
    SUBTITLE_TIMECODE_INPUT_WIDTH_CH +
    2 * SUBTITLE_BLOCK_PADDING_CH;

export default function SubtitleBlock({
    startTenths,
    endTenths,
    text,
    onTextInput,
    onStartTenthsInput,
    onEndTenthsInput,
    onDelete,
    ...flexProps
}: {
    startTenths: number;
    endTenths: number;
    text: string;
    onTextInput: (newText: string) => void;
    onStartTenthsInput: (newStartTenths: number) => void;
    onEndTenthsInput: (newEndTenths: number) => void;
    onDelete: () => void;
} & FlexProps): JSX.Element {
    return (
        <Flex {...{ style: { padding: `8px ${SUBTITLE_BLOCK_PADDING_CH}ch`, fontFamily: "monospace" }, ...flexProps }}>
            <Textarea
                shrink={0}
                width={SUBTITLE_TEXTAREA_WIDTH}
                height="96px"
                rows={MAX_SUBTITLE_BLOCK_LINES}
                cols={MAX_SUBTITLE_LINE_LENGTH}
                resize="none"
                value={text}
                onInput={(e) => {
                    onTextInput((e.target as HTMLTextAreaElement).value);
                }}
            />
            <Button
                shrink={0}
                height="auto"
                aria-label="Delete subtitle block"
                title="Delete subtitle block"
                backgroundColor="var(--chakra-colors-AppPage-pageBackground-light)"
                color="var(--chakra-colors-gray-100)"
                _hover={{ backgroundColor: "var(--chakra-colors-gray-100)", color: "DestructiveActionButton.400" }}
                onClick={onDelete}
            >
                <FAIcon iconStyle="s" icon="trash " />
            </Button>
            <Flex
                shrink={0}
                width={SUBTITLE_TIMECODE_INPUT_WIDTH}
                flexDirection="column"
                justifyContent="space-between"
            >
                <TimecodeInput value={startTenths} onInput={onStartTenthsInput} />
                <TimecodeInput value={endTenths} onInput={onEndTenthsInput} />
            </Flex>
        </Flex>
    );
}
