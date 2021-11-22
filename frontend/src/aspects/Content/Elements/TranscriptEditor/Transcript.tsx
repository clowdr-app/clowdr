import React, { CSSProperties } from "react";
import { FixedSizeList } from "react-window";
import type { SubtitlesArray } from "./srt";
import SubtitleBlock from "./SubtitleBlock";

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

export default function Transcript({
    value,
    onInput,
}: {
    value: SubtitlesArray;
    onInput: (transform: (oldTranscript: SubtitlesArray) => SubtitlesArray) => void;
}): JSX.Element {
    function SubtitleBlockJITRenderer({ index, style }: { index: number; style: CSSProperties }): JSX.Element {
        const { startTenths, endTenths, text } = value[index];

        return (
            <SubtitleBlock
                {...{
                    key: startTenths,
                    startTenths,
                    endTenths,
                    text,
                    style,
                    onTextInput: (newText) =>
                        onInput((oldTranscript) => [
                            ...oldTranscript.slice(0, index),
                            { startTenths, endTenths, text: newText },
                            ...oldTranscript.slice(index + 1),
                        ]),
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

    return (
        <FixedSizeList
            height={500}
            width={800}
            itemCount={value.length}
            itemSize={101}
            children={SubtitleBlockJITRenderer}
        />
    );
}
