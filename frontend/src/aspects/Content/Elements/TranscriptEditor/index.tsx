import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import srtHandler from "srt-parser-2";
import { SubtitleBlock, validTimecodeToMs } from "./SubtitleBlock";

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
    const initialTranscript = SRT.fromSrt(srtTranscript);
    const [transcriptWIP, setTranscriptWIP] = useState(initialTranscript);
    return (
        <Flex flexDirection="row" width="100%">
            <Flex flexBasis={0} flexGrow={1} flexDirection="column" justifyContent="center">
                {transcriptWIP.map((blockData) => (
                    <SubtitleBlock
                        key={blockData.startTime}
                        startTimeMs={validTimecodeToMs(blockData.startTime)}
                        endTimeMs={validTimecodeToMs(blockData.endTime)}
                        text={blockData.text}
                    />
                ))}
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
                        handleSaveEditor(SRT.toSrt(transcriptWIP));
                    }}
                >
                    Save Subtitles
                </Button>
            </Flex>
        </Flex>
    );
}
