import type { ButtonProps } from "@chakra-ui/react";
import { Button, HStack } from "@chakra-ui/react";
import React, { useCallback, useMemo, useRef } from "react";
import { Twemoji } from "react-emoji-render";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import { useRealTime } from "../../Hooks/useRealTime";
import type { ChatState } from "../ChatGlobalState";

export default function QuickSendEmote({ chat }: { chat: ChatState }): JSX.Element {
    const lastSendAt = useRef<number>(0);
    const rateLimitMs = 2000;

    const send = useCallback(
        (emoji: string) => {
            try {
                if (Date.now() > lastSendAt.current + rateLimitMs) {
                    lastSendAt.current = Date.now();
                    chat.send(chat.Id, Chat_MessageType_Enum.Emote, emoji, {}, false);
                }
            } catch (e) {
                console.error(`${new Date().toLocaleString()}: Failed to send message`, e);
            }
        },
        [chat]
    );

    const now = useRealTime(1000);
    const disable = now < lastSendAt.current + rateLimitMs;

    const el = useMemo(
        () => (
            <HStack spacing="3px" justifyContent="center" alignItems="center">
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
            aria-label={`Send ${emoji} emote`}
            {...props}
        >
            <Twemoji className="twemoji" text={emoji} />
        </Button>
    );
}
