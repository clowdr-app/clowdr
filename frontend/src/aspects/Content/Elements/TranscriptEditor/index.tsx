import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import srtHandler from "srt-parser-2";
import { SubtitleBlock } from "./SubtitleBlock";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange?: () => void;
}

const anyDecimalSeparator = /[,.٫‎⎖]/;

function timecodeToTenths(timecode: string): number {
    const [secondsFloatStr, minutesStr, hoursStr] = timecode.split(":").reverse();
    const [secondsStr, fractionStr] = secondsFloatStr.split(anyDecimalSeparator);

    let tenthsFloat = fractionStr ? parseInt(fractionStr, 10) : 0;
    while (tenthsFloat >= 10) tenthsFloat /= 10;

    const tenths = Math.round(tenthsFloat);
    const seconds = parseInt(secondsStr, 10);
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
    const hours = hoursStr ? parseInt(hoursStr, 10) : 0;

    return ((hours * 60 + minutes) * 60 + seconds) * 10 + tenths;
}

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
            <Flex flexBasis={0} flexGrow={1} flexDirection="column" justifyContent="center">
                {transcriptWIP.reduce(
                    (elements, { endTenths, text }, startTenths) => [
                        ...elements,
                        <SubtitleBlock {...{ key: startTenths, startTenths, endTenths, text }} />,
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
                    onClick={() => {
                        //handleSaveEditor(SRT.toSrt(transcriptWIP));
                    }}
                >
                    Save Subtitles
                </Button>
            </Flex>
        </Flex>
    );
}
