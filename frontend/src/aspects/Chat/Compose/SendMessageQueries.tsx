import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import {
    Chat_MessageType_Enum,
    useSendChatAnswerMutation,
    useSendChatMessageMutation,
} from "../../../generated/graphql";
import type { AnswerMessageData, AnswerReactionData, MessageData } from "../Types/Messages";

gql`
    mutation SendChatMessage(
        $chatId: uuid!
        $senderId: uuid!
        $type: chat_MessageType_enum!
        $message: String!
        $data: jsonb = {}
        $isPinned: Boolean = false
        $chatTitle: String = " "
        $senderName: String = " "
    ) {
        insert_chat_Message(
            objects: {
                chatId: $chatId
                data: $data
                isPinned: $isPinned
                message: $message
                senderId: $senderId
                type: $type
                chatTitle: $chatTitle
                senderName: $senderName
            }
        ) {
            returning {
                id
                duplicatedMessageId
            }
        }
    }

    mutation SendChatAnswer($data: jsonb!, $senderId: uuid!, $answeringId: Int!) {
        insert_chat_Reaction(
            objects: { messageId: $answeringId, senderId: $senderId, symbol: "ANSWER", type: ANSWER, data: $data }
        ) {
            affected_rows
        }
    }
`;

type SendMesasageCallback = (
    chatId: string,
    senderId: string,
    senderName: string,
    type: Chat_MessageType_Enum,
    message: string,
    data: MessageData,
    isPinned: boolean,
    chatTitle: string
) => Promise<void>;

interface SendMessageQueriesCtx {
    send: SendMesasageCallback;
}

const SendMessageQueriesContext = React.createContext<SendMessageQueriesCtx | undefined>(undefined);

export function useSendMessageQueries(): SendMessageQueriesCtx {
    const ctx = React.useContext(SendMessageQueriesContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function SendMessageQueriesProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const [sendMessageMutation] = useSendChatMessageMutation();
    const [sendAnswer] = useSendChatAnswerMutation();

    const send: SendMesasageCallback = useCallback(
        async (chatId, senderId, senderName, type, message, data, isPinned, chatTitle) => {
            const newMsg = (
                await sendMessageMutation({
                    variables: {
                        chatId,
                        message,
                        senderId,
                        type,
                        data,
                        isPinned,
                        senderName,
                        chatTitle,
                    },
                })
            ).data?.insert_chat_Message?.returning[0];

            if (type === Chat_MessageType_Enum.Answer && newMsg) {
                const answeringIds = (data as AnswerMessageData).questionMessagesIds;
                if (answeringIds.length > 0) {
                    const reactionData: AnswerReactionData = {
                        answerMessageId: newMsg.id,
                        duplicateAnswerMessageId: newMsg.duplicatedMessageId ?? undefined,
                    };
                    await sendAnswer({
                        variables: {
                            answeringId: answeringIds[0],
                            data: reactionData,
                            senderId,
                        },
                    });
                }
            }
        },
        [sendAnswer, sendMessageMutation]
    );

    return (
        <SendMessageQueriesContext.Provider
            value={{
                send,
            }}
        >
            {children}
        </SendMessageQueriesContext.Provider>
    );
}
