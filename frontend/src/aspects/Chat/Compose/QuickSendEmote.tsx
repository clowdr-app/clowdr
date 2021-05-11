import { Button, ButtonProps, HStack, Tooltip } from "@chakra-ui/react";
import React, { useCallback, useMemo, useRef } from "react";
import { Twemoji } from "react-emoji-render";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import { useRealTime } from "../../Generic/useRealTime";
import { useChatConfiguration } from "../Configuration";
import { useSendMessageQueries } from "./SendMessageQueries";

export default function QuickSendEmote(): JSX.Element {
    const config = useChatConfiguration();
    const sendQueries = useSendMessageQueries();
    const lastSendAt = useRef<number>(0);
    const rateLimitMs = 5000;

    const send = useCallback(
        (emoji: string) => {
            try {
                if (Date.now() > lastSendAt.current + rateLimitMs) {
                    lastSendAt.current = Date.now();
                    sendQueries.send(config.state.Id, Chat_MessageType_Enum.Emote, emoji, {}, false);
                }
            } catch (e) {
                console.error(`${new Date().toLocaleString()}: Failed to send message`, e);
            }
        },
        [config.state.Id, sendQueries]
    );

    const now = useRealTime(1000);
    const disable = now < lastSendAt.current + rateLimitMs;

    const el = useMemo(
        () => (
            <Tooltip label="Send an emote">
                <HStack spacing="3px" overflowX="auto" w="100%" justifyContent="center" alignItems="center">
                    <QuickSendEmojiButton send={send} emoji="👏" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="👋" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="👍" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="❔" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="✔" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="❌" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="😃" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="🤣" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="😢" isDisabled={disable} />
                    <QuickSendEmojiButton send={send} emoji="❤" isDisabled={disable} />
                </HStack>
            </Tooltip>
        ),
        [send, disable]
    );

    return el;
}

function QuickSendEmojiButton({
    emoji,
    send,
    ...props
}: ButtonProps & { emoji: string; send: (emoji: string) => void }): JSX.Element {
    return (
        <Button
            variant="ghost"
            fontSize="20px"
            h="auto"
            w="30px"
            m="3px"
            p="3px"
            minW={0}
            onClick={() => send(emoji)}
            {...props}
        >
            <Twemoji className="twemoji" text={emoji} />
        </Button>
    );
}
