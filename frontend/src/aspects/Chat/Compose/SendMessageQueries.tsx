import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import {
    Chat_MessageType_Enum,
    useCompleteDuplicatedMessageLoopMutation,
    useSendChatAnswerMutation,
    useSendChatMessageMutation,
    useSendDuplicatedChatMessageMutation,
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
    ) {
        insert_chat_Message(
            objects: {
                chatId: $chatId
                data: $data
                isPinned: $isPinned
                message: $message
                senderId: $senderId
                type: $type
            }
        ) {
            returning {
                id
            }
        }
    }

    mutation SendDuplicatedChatMessage(
        $chatId: uuid!
        $otherChatId: uuid!
        $senderId: uuid!
        $type: chat_MessageType_enum!
        $message: String!
        $data: jsonb = {}
        $isPinned: Boolean = false
    ) {
        insert_chat_Message(
            objects: {
                chatId: $chatId
                data: $data
                isPinned: $isPinned
                message: $message
                senderId: $senderId
                type: $type
                duplicateOutgoing: {
                    data: {
                        chatId: $otherChatId
                        data: $data
                        isPinned: $isPinned
                        message: $message
                        senderId: $senderId
                        type: $type
                    }
                }
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

    mutation CompleteDuplicatedMessageLoop($msgId1: Int!, $msgId2: Int!) {
        update_chat_Message_by_pk(pk_columns: { id: $msgId2 }, _set: { duplicatedMessageId: $msgId1 }) {
            id
            duplicatedMessageId
        }
    }
`;

type SendMesasageCallback = (
    chatId: string,
    senderId: string,
    type: Chat_MessageType_Enum,
    message: string,
    data: MessageData,
    isPinned: boolean,
    duplicateToChatId: string | undefined
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
    const [sendDuplicatedMessageMutation] = useSendDuplicatedChatMessageMutation();
    const [completeDuplicatedMessageLoopMutation] = useCompleteDuplicatedMessageLoopMutation();
    const [sendAnswer] = useSendChatAnswerMutation();

    const send: SendMesasageCallback = useCallback(
        async (chatId, senderId, type, message, data, isPinned, duplicateToChatId) => {
            let newId: number | null | undefined = null;
            if (duplicateToChatId !== undefined) {
                const sentIds = await sendDuplicatedMessageMutation({
                    variables: {
                        chatId,
                        otherChatId: duplicateToChatId,
                        message,
                        senderId,
                        type,
                        data,
                        isPinned,
                    },
                });
                if (!sentIds.data?.insert_chat_Message?.returning[0]) {
                    throw new Error("Send duplicated message query passed but returned no data!");
                }
                if (!sentIds.data.insert_chat_Message.returning[0].duplicatedMessageId) {
                    throw new Error("Send duplicated message query passed but didn't return the duplicate's id!");
                }
                for (let idx = 0; idx < 3; idx++) {
                    try {
                        await completeDuplicatedMessageLoopMutation({
                            variables: {
                                msgId1: sentIds.data.insert_chat_Message.returning[0].id,
                                msgId2: sentIds.data.insert_chat_Message.returning[0].duplicatedMessageId,
                            },
                        });
                        break;
                    } catch (e) {
                        const errMsg = `Failed to complete the loop for duplicate message id: ${sentIds.data.insert_chat_Message.returning[0].id}`;
                        if (idx === 2) {
                            console.error(errMsg, e);
                        } else {
                            console.warn(errMsg, e);
                        }
                    }
                }
                newId = sentIds.data.insert_chat_Message.returning[0].id;
            } else {
                newId = (
                    await sendMessageMutation({
                        variables: {
                            chatId,
                            message,
                            senderId,
                            type,
                            data,
                            isPinned,
                        },
                    })
                ).data?.insert_chat_Message?.returning[0].id;
            }

            if (type === Chat_MessageType_Enum.Answer && newId) {
                const answeringIds = (data as AnswerMessageData).questionMessagesIds;
                for (const answeringId of answeringIds) {
                    const reactionData: AnswerReactionData = {
                        answerMessageId: newId,
                    };
                    if (answeringId) {
                        await sendAnswer({
                            variables: {
                                answeringId,
                                data: reactionData,
                                senderId,
                            },
                        });
                    }
                }
            }
        },
        [completeDuplicatedMessageLoopMutation, sendAnswer, sendDuplicatedMessageMutation, sendMessageMutation]
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
