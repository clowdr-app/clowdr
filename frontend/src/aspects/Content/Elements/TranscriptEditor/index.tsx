import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import srtHandler from "srt-parser-2";
import { SubtitleBlock, timecodeToTenths } from "./SubtitleBlock";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange?: () => void;
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
                        <SubtitleBlock
                            {...{
                                key: startTenths,
                                startTenths,
                                endTenths,
                                text,
                                onChange: (newData) => {
                                    setTranscriptWIP((prevTranscript) =>
                                        prevTranscript.reduce((nextTranscript, thisBlock, thisIndex) => {
                                            if (thisIndex === startTenths) {
                                                nextTranscript[newData.startTenths] = {
                                                    endTenths: newData.endTenths,
                                                    text: newData.text,
                                                };
                                            } else {
                                                nextTranscript[thisIndex] = thisBlock;
                                            }
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
