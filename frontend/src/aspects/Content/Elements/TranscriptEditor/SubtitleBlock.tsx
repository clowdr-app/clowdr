import { Flex, Textarea } from "@chakra-ui/react";
import React from "react";
import TimecodeInput from "./TimecodeInput";

export default function SubtitleBlock({
    startTenths,
    endTenths,
    text,
    onTextInput,
    onStartTenthsInput,
    onEndTenthsInput,
}: {
    startTenths: number;
    endTenths: number;
    text: string;
    onTextInput: (newText: string) => void;
    onStartTenthsInput: (newStartTenths: number) => void;
    onEndTenthsInput: (newEndTenths: number) => void;
}): JSX.Element {
    return (
        <Flex style={{ fontFamily: "monospace" }}>
            <Textarea
                flexBasis={"54em"}
                flexGrow={0}
                rows={3}
                cols={50}
                resize="none"
                value={text}
                onInput={(e) => {
                    onTextInput((e.target as HTMLTextAreaElement).value);
                }}
            />
            <Flex flexBasis={"16em"} flexGrow={0} flexDirection="column" justifyContent="space-between">
                <TimecodeInput value={startTenths} onInput={onStartTenthsInput} />
                <TimecodeInput value={endTenths} onInput={onEndTenthsInput} />
            </Flex>
        </Flex>
    );
}
