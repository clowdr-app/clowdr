import { Flex } from "@chakra-ui/react";
import React from "react";
import type { SubtitlesSparseArray } from "./srt";
import SubtitleBlock from "./SubtitleBlock";

function validateNewStartTenths({
    oldTranscript,
    oldStartTenths,
    newStartTenths,
}: {
    oldTranscript: SubtitlesSparseArray;
    oldStartTenths: number;
    newStartTenths: number;
}): Boolean {
    if (newStartTenths < oldStartTenths) {
        if (newStartTenths < 0) return false;

        for (let prevBlockStartTenths = oldStartTenths - 1; prevBlockStartTenths >= 0; --prevBlockStartTenths) {
            if (oldTranscript[prevBlockStartTenths]) {
                return newStartTenths >= oldTranscript[prevBlockStartTenths].endTenths;
            }
        }

        return true;
    }

    return newStartTenths < oldTranscript[oldStartTenths].endTenths;
}

function validateNewEndTenths({
    oldTranscript,
    startTenths,
    newEndTenths,
}: {
    oldTranscript: SubtitlesSparseArray;
    startTenths: number;
    newEndTenths: number;
}): Boolean {
    if (newEndTenths > oldTranscript[startTenths].endTenths) {
        // TODO upper limit is end of video

        for (
            let nextBlockStartTenths = oldTranscript[startTenths].endTenths;
            nextBlockStartTenths < newEndTenths;
            ++nextBlockStartTenths
        ) {
            if (oldTranscript[nextBlockStartTenths]) return false;
        }

        return true;
    }

    return newEndTenths > startTenths;
}

export default function Transcript({
    value,
    onInput,
}: {
    value: SubtitlesSparseArray;
    onInput: (transform: (oldTranscript: SubtitlesSparseArray) => SubtitlesSparseArray) => void;
}): JSX.Element {
    return (
        <Flex flexBasis={0} flexGrow={2} flexDirection="column" justifyContent="center">
            {value.reduce(
                (elements, { endTenths, text }, startTenths) => [
                    ...elements,
                    <SubtitleBlock
                        {...{
                            key: startTenths,
                            startTenths,
                            endTenths,
                            text,
                            onTextInput: (newText) => {
                                onInput((oldTranscript) =>
                                    oldTranscript.reduce((nextTranscript, thisBlock, thisIndex) => {
                                        nextTranscript[thisIndex] =
                                            thisIndex === startTenths
                                                ? {
                                                      endTenths: thisBlock.endTenths,
                                                      text: newText,
                                                  }
                                                : thisBlock;
                                        return nextTranscript;
                                    }, [] as SubtitlesSparseArray)
                                );
                            },
                            onStartTenthsInput: (newStartTenths) => {
                                onInput((oldTranscript) =>
                                    oldTranscript.reduce((nextTranscript, thisBlock, thisIndex) => {
                                        nextTranscript[
                                            thisIndex === startTenths &&
                                            validateNewStartTenths({
                                                oldTranscript,
                                                oldStartTenths: startTenths,
                                                newStartTenths,
                                            })
                                                ? newStartTenths
                                                : thisIndex
                                        ] = thisBlock;
                                        return nextTranscript;
                                    }, [] as SubtitlesSparseArray)
                                );
                            },
                            onEndTenthsInput: (newEndTenths) => {
                                onInput((oldTranscript) =>
                                    oldTranscript.reduce((nextTranscript, thisBlock, thisIndex) => {
                                        nextTranscript[thisIndex] =
                                            thisIndex === startTenths &&
                                            validateNewEndTenths({
                                                oldTranscript,
                                                startTenths,
                                                newEndTenths,
                                            })
                                                ? {
                                                      endTenths: newEndTenths,
                                                      text: thisBlock.text,
                                                  }
                                                : thisBlock;
                                        return nextTranscript;
                                    }, [] as SubtitlesSparseArray)
                                );
                            },
                        }}
                    />,
                ],
                [] as JSX.Element[]
            )}
        </Flex>
    );
}
