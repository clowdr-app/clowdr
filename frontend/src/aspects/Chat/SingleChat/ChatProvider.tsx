import { gql } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useCallback } from "react";
import { useInsertMessageMutation, useLiveChatSubscription, useSelectChatQuery } from "../../../generated/graphql";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { ChatContext, defaultChatContext } from "./useChat";

const _chatQueries = gql`
    query SelectChat($chatId: uuid!) {
        Chat(where: { id: { _eq: $chatId } }) {
            description
            creatorId
            createdAt
            mode
            name
            isAutoNotify
            isAutoPin
            id
            updatedAt
            members {
                userId
                id
                invitationAcceptedAt
                updatedAt
                createdAt
            }
            creator {
                firstName
                lastName
                id
            }
        }
    }

    mutation InsertMessage($chatId: uuid!, $content: jsonb!, $index: Int!) {
        insert_ChatMessage(objects: { chatId: $chatId, content: $content, index: $index }) {
            affected_rows
        }
    }

    subscription LiveChat($chatId: uuid!, $limit: Int = 20, $offset: Int = 0) {
        Chat(where: { id: { _eq: $chatId } }) {
            id
            typers {
                id
                userId
                updatedAt
            }
            messages(order_by: { index: desc }, limit: $limit, offset: $offset) {
                content
                createdAt
                id
                index
                isHighlighted
                senderId
                updatedAt
                reactions {
                    id
                    createdAt
                    reaction
                    reactorId
                }
            }
            viewers {
                id
                lastSeen
                userId
            }
        }
    }
`;

// TODO: Turn Chat Provider into an aggregate provider of the various subproviders
export default function ChatProvider({
    children,
    chatId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    chatId: string;
}): JSX.Element {
    const { isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return <ChatProvider_IsAuthenticated chatId={chatId}>{children}</ChatProvider_IsAuthenticated>;
    } else {
        return <ChatContext.Provider value={defaultChatContext}>{children}</ChatContext.Provider>;
    }
}

function ChatProvider_IsAuthenticated({
    children,
    chatId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    chatId: string;
}) {
    const { loading: chatLoading, error: chatError, data: chatData, refetch: chatRefetch } = useSelectChatQuery({
        variables: {
            chatId,
        },
        pollInterval: 60 * 1000,
    });
    useQueryErrorToast(chatError);

    // TODO: Split out subscriptions for typers and viewers
    // TODO: Subscribe to messages using limit:1
    // TODO: Split out the initial (paginated) fetch of messages
    const { data: liveChatData, loading: liveChatLoading, error: liveChatError } = useLiveChatSubscription({
        variables: {
            chatId,
            limit: 20,
            offset: 0,
        },
    });
    useQueryErrorToast(liveChatError);

    // TODO: Split sending a message into a different hook
    const [insertMessage, { loading: insertMessageLoading, error: insertMessageError }] = useInsertMessageMutation();

    const chatValue = chatLoading ? null : chatError ? false : chatData ?? null;
    const liveChatValue =
        chatLoading || liveChatLoading ? null : chatError || liveChatError ? false : liveChatData ?? null;

    const sendMessage = useCallback(
        async (content: any) => {
            if (liveChatValue) {
                const prevIndex = liveChatValue.Chat[0].messages[0]?.index ?? 1;
                await insertMessage({
                    variables: {
                        chatId,
                        content,
                        index: prevIndex + 1,
                    },
                });
            } else {
                throw new Error("Chat not available at the moment");
            }
        },
        [chatId, insertMessage, liveChatValue]
    );

    return (
        <ChatContext.Provider
            value={{
                chatId,
                chat: chatValue,
                live: liveChatValue,
                refetchChat: chatRefetch,
                sendMessage,
                sendingMessage: insertMessageLoading,
                sendMessageError: insertMessageError ? insertMessageError.message : false,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}
