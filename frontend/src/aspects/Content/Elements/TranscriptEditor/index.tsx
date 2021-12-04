import { Button, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import { SRTParse, SRTStringify } from "./srt";
import Transcript, { TRANSCRIPT_WIDTH_CH } from "./Transcript";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange: () => void;
    readOnly: Boolean;
}

export default function TranscriptEditor({
    srtTranscript,
    mediaUrl,
    handleSaveEditor,
    handleChange,
    readOnly,
}: Props): JSX.Element {
    const [transcriptWIP, setTranscriptWIP] = useState(SRTParse(srtTranscript));
    return (
        <Flex flexDirection="row" justifyContent="center" alignItems="start" flexWrap="wrap-reverse">
            <Transcript
                value={transcriptWIP}
                onInput={(transform) => {
                    if (readOnly) return;
                    handleChange();
                    setTranscriptWIP(transform);
                }}
            />
            <Flex flexDirection="column" alignItems="center" justifyContent="space-between">
                <video style={{ width: `${TRANSCRIPT_WIDTH_CH}ch`, margin: 4 }} src={mediaUrl} controls>
                    This is a video
                </video>
                <Button colorScheme="green" onClick={() => handleSaveEditor(SRTStringify(transcriptWIP))}>
                    Save Subtitles
                </Button>
            </Flex>
        </Flex>
    );
}
