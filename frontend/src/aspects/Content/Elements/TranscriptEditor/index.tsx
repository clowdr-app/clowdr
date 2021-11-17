import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import { SRTParse, SRTStringify } from "./srt";
import Transcript from "./Transcript";

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
    const [transcriptWIP, setTranscriptWIP] = useState(SRTParse(srtTranscript));
    return (
        <Flex flexDirection="row" width="100%">
            <Transcript value={transcriptWIP} onInput={setTranscriptWIP} />
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
                <Button colorScheme="green" onClick={() => handleSaveEditor(SRTStringify(transcriptWIP))}>
                    Save Subtitles
                </Button>
            </Flex>
        </Flex>
    );
}
