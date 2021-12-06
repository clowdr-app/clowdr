import { Button, Flex, FormControl, Textarea } from "@chakra-ui/react";
import React from "react";
import srtParser from "srt-parser-2";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange?: () => void;
}

export default (props: Props) => {
    const SRT = new srtParser();
    const initialTranscript = SRT.fromSrt(props.srtTranscript);
    const [transcriptWIP, setTranscriptWIP] = React.useState(initialTranscript);
    return (
        <Flex flexDirection="row" width="100%">
            <FormControl display="flex" flexBasis={0} flexGrow={1} justifyContent="center">
                <Textarea
                    width="auto"
                    rows={12}
                    cols={32}
                    resize="none"
                    style={{ fontFamily: "monospace" }}
                    value={JSON.stringify(transcriptWIP)}
                    onInput={(e) => {
                        setTranscriptWIP(JSON.parse((e.target as HTMLTextAreaElement).value));
                    }}
                />
            </FormControl>
            <Flex flexBasis={0} flexGrow={1} flexDirection="column" alignItems="center" justifyContent="space-between">
                <video src={props.mediaUrl} controls>
                    This is a video
                </video>
                <Button
                    colorScheme="green"
                    onClick={() => {
                        props.handleSaveEditor(SRT.toSrt(transcriptWIP));
                    }}
                >
                    Save Subtitles
                </Button>
            </Flex>
        </Flex>
    );
};
