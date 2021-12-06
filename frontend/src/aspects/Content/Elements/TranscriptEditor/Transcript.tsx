import { Button, Flex } from "@chakra-ui/react";
import type { CSSProperties } from "react";
import React from "react";
import { FixedSizeList } from "react-window";
import { FAIcon } from "../../../Icons/FAIcon";
import type { SubtitlesArray } from "./srt";
import SubtitleBlock, {
    MAX_SUBTITLE_BLOCK_LINES,
    MAX_SUBTITLE_LINE_LENGTH,
    SUBTITLE_BLOCK_WIDTH_CH,
} from "./SubtitleBlock";

export const TRANSCRIPT_WIDTH_CH = SUBTITLE_BLOCK_WIDTH_CH + 6;

function validateNewText(newText: string): boolean {
    const lines = newText.split(/\r?\n/);
    return (
        lines.length <= MAX_SUBTITLE_BLOCK_LINES &&
        lines.every((line, i) => line.length <= MAX_SUBTITLE_LINE_LENGTH && (i === lines.length - 1 || line.length > 0))
    );
}

function validateNewStartTenths(oldTranscript: SubtitlesArray, index: number, newStartTenths: number): boolean {
    if (newStartTenths < oldTranscript[index].startTenths) {
        if (index === 0) return newStartTenths >= 0;
        return newStartTenths >= oldTranscript[index - 1].endTenths;
    }

    return newStartTenths < oldTranscript[index].endTenths;
}

function validateNewEndTenths(oldTranscript: SubtitlesArray, index: number, newEndTenths: number): boolean {
    if (newEndTenths > oldTranscript[index].endTenths) {
        if (index === oldTranscript.length) return true; // TODO upper limit is end of video
        return newEndTenths <= oldTranscript[index + 1].startTenths;
    }

    return newEndTenths > oldTranscript[index].startTenths;
}

function getNewBlockAfter(
    oldTranscript: SubtitlesArray,
    index: number
): { startTenths: number; endTenths: number; text: "" } | undefined {
    const prevEndTenths = index < 0 ? 0 : oldTranscript[index].endTenths;
    const nextStartTenths =
        index === oldTranscript.length - 1 ? prevEndTenths + 20 : oldTranscript[index + 1].startTenths;
    if (nextStartTenths <= prevEndTenths) {
        alert("Adjust timecodes in surrounding subtitle blocks to make room for a new block.");
        return;
    }
    const midpointTenths = Math.trunc((prevEndTenths + nextStartTenths) / 2);
    return {
        startTenths: Math.max(prevEndTenths, midpointTenths - 10),
        endTenths: Math.min(nextStartTenths, midpointTenths + 10),
        text: "",
    };
}

interface TranscriptProps {
    value: SubtitlesArray;
    onInput: (transform: (oldTranscript: SubtitlesArray) => SubtitlesArray) => void;
}

function SubtitleBlockJITRenderer({
    data: { value, onInput },
    index,
    style,
}: {
    data: TranscriptProps;
    index: number;
    style: CSSProperties;
}): JSX.Element {
    const { startTenths, endTenths, text, deleted } = value[index];

    return deleted ? (
        <Flex {...{ style, alignItems: "center", justifyContent: "center" }}>
            <Button
                colorScheme="PrimaryActionButton"
                leftIcon={<FAIcon iconStyle="s" icon="undo" />}
                onClick={() =>
                    onInput((oldTranscript) => [
                        ...oldTranscript.slice(0, index),
                        { startTenths, endTenths, text },
                        ...oldTranscript.slice(index + 1),
                    ])
                }
            >
                Restore deleted subtitle block
            </Button>
        </Flex>
    ) : (
        <Flex {...{ direction: "column", style }}>
            <SubtitleBlock
                {...{
                    startTenths,
                    endTenths,
                    text,
                    onTextInput: (newText) =>
                        onInput((oldTranscript) =>
                            validateNewText(newText)
                                ? [
                                      ...oldTranscript.slice(0, index),
                                      { startTenths, endTenths, text: newText },
                                      ...oldTranscript.slice(index + 1),
                                  ]
                                : oldTranscript
                        ),
                    onStartTenthsInput: (newStartTenths) =>
                        onInput((oldTranscript) =>
                            validateNewStartTenths(oldTranscript, index, newStartTenths)
                                ? [
                                      ...oldTranscript.slice(0, index),
                                      { startTenths: newStartTenths, endTenths, text },
                                      ...oldTranscript.slice(index + 1),
                                  ]
                                : oldTranscript
                        ),
                    onEndTenthsInput: (newEndTenths) =>
                        onInput((oldTranscript) =>
                            validateNewEndTenths(oldTranscript, index, newEndTenths)
                                ? [
                                      ...oldTranscript.slice(0, index),
                                      { startTenths, endTenths: newEndTenths, text },
                                      ...oldTranscript.slice(index + 1),
                                  ]
                                : oldTranscript
                        ),
                    onDelete: () =>
                        onInput((oldTranscript) => [
                            ...oldTranscript.slice(0, index),
                            { startTenths, endTenths, text, deleted: true },
                            ...oldTranscript.slice(index + 1),
                        ]),
                }}
            />
            <Flex height="16px" shrink={0} alignItems="center">
                <Button
                    minWidth="0px"
                    paddingInline="0px"
                    height="16px"
                    lineHeight="15px"
                    aria-label="Insert new subtitle block after this one"
                    title="Insert new subtitle block"
                    color="var(--chakra-colors-PrimaryActionButton-500)"
                    background="var(--chakra-colors-AppPageV2-pageBackground-light)"
                    verticalAlign="center"
                    onClick={() =>
                        onInput((oldTranscript) => {
                            const newBlock = getNewBlockAfter(oldTranscript, index);
                            return newBlock
                                ? [...oldTranscript.slice(0, index + 1), newBlock, ...oldTranscript.slice(index + 1)]
                                : oldTranscript;
                        })
                    }
                >
                    <FAIcon height="16px" iconStyle="s" icon="plus-circle" />
                </Button>
            </Flex>
        </Flex>
    );
}

export default function Transcript({ value, onInput }: TranscriptProps): JSX.Element {
    return (
        <FixedSizeList
            height={400}
            width={`${TRANSCRIPT_WIDTH_CH}ch`}
            style={{ margin: 4 }}
            itemCount={value.length}
            itemData={{ value, onInput }}
            itemKey={(i, { value }) => value[i].startTenths}
            itemSize={128}
        >
            {SubtitleBlockJITRenderer}
        </FixedSizeList>
    );
}
