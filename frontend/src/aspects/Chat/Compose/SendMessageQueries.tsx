import { gql, Reference } from "@apollo/client";
import React, { useCallback, useMemo } from "react";
import {
    Chat_MessageType_Enum,
    SubscribedChatMessageDataFragmentDoc,
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
        insert_chat_Message_one(
            object: {
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
            ...SubscribedChatMessageData
        }
    }

    mutation SendChatAnswer($data: jsonb!, $senderId: uuid!, $answeringId: Int!) {
        insert_chat_Reaction_one(
            object: { messageId: $answeringId, senderId: $senderId, symbol: "ANSWER", type: ANSWER, data: $data }
        ) {
            id
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
    isSending: boolean;
    sendError: string | null;
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
    const [sendMessageMutation, sendMessageMutationResponse] = useSendChatMessageMutation();
    const [sendAnswer, sendAnswerResponse] = useSendChatAnswerMutation();

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
                    update: (cache, { data: _data }) => {
                        if (_data?.insert_chat_Message_one) {
                            const data = _data.insert_chat_Message_one;
                            cache.modify({
                                fields: {
                                    chat_Message(existingRefs: Reference[] = [], { readField }) {
                                        const newRef = cache.writeFragment({
                                            data,
                                            fragment: SubscribedChatMessageDataFragmentDoc,
                                            fragmentName: "SubscribedChatMessageData",
                                        });
                                        if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                            return existingRefs;
                                        }

                                        return [newRef, ...existingRefs];
                                    },
                                },
                            });
                        }
                    },
                })
            ).data?.insert_chat_Message_one;

            if (type === Chat_MessageType_Enum.Answer && newMsg) {
                const answeringIds = (data as AnswerMessageData).questionMessagesIds;
                if (answeringIds.length > 0) {
                    const reactionData: AnswerReactionData = {
                        answerMessageId: newMsg.id,
                        duplicateAnswerMessageId: newMsg.duplicatedMessageId ?? undefined,
                    };
                    sendAnswer({
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
    const ctx = useMemo(
        () => ({
            send,
            isSending: sendMessageMutationResponse.loading || sendAnswerResponse.loading,
            sendError: sendMessageMutationResponse.error?.message ?? sendAnswerResponse.error?.message ?? null,
        }),
        [
            send,
            sendAnswerResponse.error?.message,
            sendAnswerResponse.loading,
            sendMessageMutationResponse.error?.message,
            sendMessageMutationResponse.loading,
        ]
    );

    return <SendMessageQueriesContext.Provider value={ctx}>{children}</SendMessageQueriesContext.Provider>;
}
