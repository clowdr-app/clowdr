import { Button, HStack, Tooltip } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { Twemoji } from "react-emoji-render";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import { useSendMessageQueries } from "./SendMessageQueries";

export default function QuickSendEmote(): JSX.Element {
    return (
        <Tooltip label="Send an emote">
            <HStack spacing="3px" overflowX="auto" w="100%" justifyContent="center" alignItems="center">
                <QuickSendEmojiButton emoji="👏" />
                <QuickSendEmojiButton emoji="👋" />
                <QuickSendEmojiButton emoji="👍" />
                <QuickSendEmojiButton emoji="❔" />
                <QuickSendEmojiButton emoji="✔" />
                <QuickSendEmojiButton emoji="❌" />
                <QuickSendEmojiButton emoji="😃" />
                <QuickSendEmojiButton emoji="🤣" />
                <QuickSendEmojiButton emoji="😢" />
                <QuickSendEmojiButton emoji="❤" />
            </HStack>
        </Tooltip>
    );
}

function QuickSendEmojiButton({ emoji }: { emoji: string }): JSX.Element {
    const config = useChatConfiguration();
    const sendQueries = useSendMessageQueries();

    const send = useCallback(() => {
        try {
            sendQueries.send(config.state.Id, Chat_MessageType_Enum.Emote, emoji, {}, false);
        } catch (e) {
            console.error(`${new Date().toLocaleString()}: Failed to send message`, e);
        }
    }, [config.state.Id, emoji, sendQueries]);

    return (
        <Button variant="ghost" fontSize="20px" h="auto" w="30px" m="3px" p="3px" minW={0} onClick={send}>
            <Twemoji className="twemoji" text={emoji} />
        </Button>
    );
}
