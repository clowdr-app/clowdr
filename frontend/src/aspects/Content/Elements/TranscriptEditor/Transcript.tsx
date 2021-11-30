import React, { CSSProperties } from "react";
import { FixedSizeList } from "react-window";
import type { SubtitlesArray } from "./srt";
import SubtitleBlock, { MAX_SUBTITLE_BLOCK_LINES, MAX_SUBTITLE_LINE_LEGNTH } from "./SubtitleBlock";

function hardWrapSubtitleBlockIfPossible(newText: string): string | undefined {
    const lines = newText.split("\n");
    if (lines.length > MAX_SUBTITLE_BLOCK_LINES) return;
    let remainder = "";
    for (let i = 0; i < MAX_SUBTITLE_BLOCK_LINES; ++i) {
        if (i === lines.length && !remainder) break;
        lines[i] = remainder + (lines[i] || "");
        remainder = "";
        if (lines[i].length <= MAX_SUBTITLE_LINE_LEGNTH) continue;
        const wrapSpaceIndex = lines[i].lastIndexOf(" ", MAX_SUBTITLE_LINE_LEGNTH);
        if (wrapSpaceIndex === -1) return;
        remainder = lines[i].substring(wrapSpaceIndex + 1);
        lines[i] = lines[i].substring(0, wrapSpaceIndex + 1);
    }
    if (remainder) return;

    return lines.join("\n");
}

function validateNewStartTenths(oldTranscript: SubtitlesArray, index: number, newStartTenths: number): Boolean {
    if (newStartTenths < oldTranscript[index].startTenths) {
        if (index === 0) return newStartTenths >= 0;
        return newStartTenths >= oldTranscript[index - 1].endTenths;
    }

    return newStartTenths < oldTranscript[index].endTenths;
}

function validateNewEndTenths(oldTranscript: SubtitlesArray, index: number, newEndTenths: number): Boolean {
    if (newEndTenths > oldTranscript[index].endTenths) {
        if (index === oldTranscript.length) return true; // TODO upper limit is end of video
        return newEndTenths <= oldTranscript[index + 1].startTenths;
    }

    return newEndTenths > oldTranscript[index].startTenths;
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
    const { startTenths, endTenths, text } = value[index];

    return (
        <SubtitleBlock
            {...{
                startTenths,
                endTenths,
                text,
                style,
                onTextInput: (newText) =>
                    onInput((oldTranscript) => {
                        const wrappedText = hardWrapSubtitleBlockIfPossible(newText);
                        return wrappedText
                            ? [
                                  ...oldTranscript.slice(0, index),
                                  { startTenths, endTenths, text: wrappedText },
                                  ...oldTranscript.slice(index + 1),
                              ]
                            : oldTranscript;
                    }),
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
            }}
        />
    );
}

export default function Transcript({ value, onInput }: TranscriptProps): JSX.Element {
    return (
        <FixedSizeList
            height={404}
            width="76ch"
            style={{ margin: 4 }}
            itemCount={value.length}
            itemData={{ value, onInput }}
            itemKey={(i, { value }) => value[i].startTenths}
            itemSize={101}
            children={SubtitleBlockJITRenderer}
        />
    );
}
