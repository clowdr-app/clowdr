import { Flex, Textarea } from "@chakra-ui/react";
import React, { CSSProperties } from "react";
import TimecodeInput from "./TimecodeInput";

export default function SubtitleBlock({
    startTenths,
    endTenths,
    text,
    onTextInput,
    onStartTenthsInput,
    onEndTenthsInput,
    style,
}: {
    startTenths: number;
    endTenths: number;
    text: string;
    onTextInput: (newText: string) => void;
    onStartTenthsInput: (newStartTenths: number) => void;
    onEndTenthsInput: (newEndTenths: number) => void;
    style: CSSProperties;
}): JSX.Element {
    return (
        <Flex style={{ ...style, fontFamily: "monospace" }}>
            <Textarea
                width={"50ch"}
                rows={3}
                cols={47}
                resize="none"
                value={text}
                onInput={(e) => {
                    onTextInput((e.target as HTMLTextAreaElement).value);
                }}
            />
            <Flex width={"20ch"} flexDirection="column" justifyContent="space-between">
                <TimecodeInput value={startTenths} onInput={onStartTenthsInput} />
                <TimecodeInput value={endTenths} onInput={onEndTenthsInput} />
            </Flex>
        </Flex>
    );
}
