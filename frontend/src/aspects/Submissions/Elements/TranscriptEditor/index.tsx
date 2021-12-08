import { Button, Flex, HStack } from "@chakra-ui/react";
import React, { useState } from "react";
import FAIcon from "../../../Chakra/FAIcon";
import { SRTParse, SRTStringify } from "./srt";
import Transcript, { TRANSCRIPT_WIDTH_CH } from "./Transcript";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange: () => void;
    readOnly: boolean;
}

export default function TranscriptEditor({
    srtTranscript,
    mediaUrl,
    handleSaveEditor,
    handleChange,
    readOnly,
    children,
}: React.PropsWithChildren<Props>): JSX.Element {
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
                <video style={{ width: `${TRANSCRIPT_WIDTH_CH}ch`, margin: 0 }} src={mediaUrl} controls>
                    This is a video
                </video>
                <HStack justifyContent="flex-start" w="100%" mt={2}>
                    {children}
                    <Button colorScheme="green" onClick={() => handleSaveEditor(SRTStringify(transcriptWIP))}>
                        <FAIcon iconStyle="s" icon="save" mr={2} />
                        Save Subtitles
                    </Button>
                </HStack>
            </Flex>
        </Flex>
    );
}
