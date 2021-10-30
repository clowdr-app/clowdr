import { Button, Flex, FormControl, Textarea } from "@chakra-ui/react";
import React from "react";

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange?: () => void;
}

export default (props: Props) => {
    const [transcriptWIP, setTranscriptWIP] = React.useState(props.srtTranscript);
    return (
        <Flex flexDirection="row" width="100%">
            <FormControl display="flex" flexBasis={0} flexGrow={1} justifyContent="center">
                <Textarea
                    width="auto"
                    rows={12}
                    cols={32}
                    resize="none"
                    style={{ fontFamily: "monospace" }}
                    value={transcriptWIP}
                    onInput={(e) => {
                        setTranscriptWIP((e.target as HTMLTextAreaElement).value);
                    }}
                />
            </FormControl>
            <Flex flexBasis={0} flexGrow={1} flexDirection="column" alignItems="center" justifyContent="space-between">
                <p>This is a video</p>
                <Button
                    colorScheme="green"
                    onClick={() => {
                        props.handleSaveEditor(transcriptWIP);
                    }}
                >
                    Save Subtitles
                </Button>
            </Flex>
        </Flex>
    );
};
