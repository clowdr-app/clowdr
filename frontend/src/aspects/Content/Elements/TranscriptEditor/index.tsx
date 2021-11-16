import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import srtHandler, { Line as SerializableBlock } from "srt-parser-2";
import { SubtitleBlock, tenthsToTimecode, timecodeToTenths } from "./SubtitleBlock";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange?: () => void;
}

function validateNewStartTenths({
    oldTranscript,
    oldStartTenths,
    newStartTenths,
}: {
    oldTranscript: { endTenths: number; text: string }[];
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
    oldTranscript: { endTenths: number; text: string }[];
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

const SubripDevelopersLanguage = "cs";

const secondsSRTFormat = new Intl.NumberFormat(SubripDevelopersLanguage, {
    minimumIntegerDigits: 2,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});

const hoursMinutesSRTFormat = new Intl.NumberFormat(SubripDevelopersLanguage, {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
});

const SRTTimeFormats = {
    hoursFormat: hoursMinutesSRTFormat,
    minutesFormat: hoursMinutesSRTFormat,
    secondsFormat: secondsSRTFormat,
};

export default function TranscriptEditor({
    srtTranscript,
    mediaUrl,
    handleSaveEditor,
    handleChange,
}: Props): JSX.Element {
    const SRT = new srtHandler();
    const initialTranscript: { endTenths: number; text: string }[] = [];
    SRT.fromSrt(srtTranscript).forEach(({ startTime, endTime, text }) => {
        initialTranscript[timecodeToTenths(startTime)] = {
            endTenths: timecodeToTenths(endTime),
            text,
        };
    });
    const [transcriptWIP, setTranscriptWIP] = useState(initialTranscript);
    return (
        <Flex flexDirection="row" width="100%">
            <Flex flexBasis={0} flexGrow={2} flexDirection="column" justifyContent="center">
                {transcriptWIP.reduce(
                    (elements, { endTenths, text }, startTenths) => [
                        ...elements,
                        <SubtitleBlock
                            {...{
                                key: startTenths,
                                startTenths,
                                endTenths,
                                text,
                                onTextInput: (newText) => {
                                    setTranscriptWIP((oldTranscript) =>
                                        oldTranscript.reduce((nextTranscript, thisBlock, thisIndex) => {
                                            nextTranscript[thisIndex] =
                                                thisIndex === startTenths
                                                    ? {
                                                          endTenths: thisBlock.endTenths,
                                                          text: newText,
                                                      }
                                                    : thisBlock;
                                            return nextTranscript;
                                        }, [] as { endTenths: number; text: string }[])
                                    );
                                },
                                onStartTenthsInput: (newStartTenths) => {
                                    setTranscriptWIP((oldTranscript) =>
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
                                        }, [] as { endTenths: number; text: string }[])
                                    );
                                },
                                onEndTenthsInput: (newEndTenths) => {
                                    setTranscriptWIP((oldTranscript) =>
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
                                        }, [] as { endTenths: number; text: string }[])
                                    );
                                },
                            }}
                        />,
                    ],
                    [] as JSX.Element[]
                )}
            </Flex>
            <Flex
                flexBasis={0}
                flexGrow={1}
                flexShrink={1}
                flexDirection="column"
                alignItems="center"
                justifyContent="space-between"
            >
                <video src={mediaUrl} controls>
                    This is a video
                </video>
                <Button
                    colorScheme="green"
                    onClick={() =>
                        handleSaveEditor(
                            SRT.toSrt(
                                transcriptWIP.reduce(
                                    (serializableTranscript, { endTenths, text }, startTenths) => [
                                        ...serializableTranscript,
                                        {
                                            id: (serializableTranscript.length + 1).toString(),
                                            startTime: tenthsToTimecode(startTenths, SRTTimeFormats),
                                            endTime: tenthsToTimecode(endTenths, SRTTimeFormats),
                                            text,
                                        },
                                    ],
                                    [] as SerializableBlock[]
                                )
                            )
                        )
                    }
                >
                    Save Subtitles
                </Button>
            </Flex>
        </Flex>
    );
}
