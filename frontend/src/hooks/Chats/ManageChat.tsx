import { gql } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useCallback, useEffect } from "react";
import {
    useInsertMessageMutation,
    useLiveChatSubscription,
    useSelectChatQuery,
} from "../../generated/graphql";
import useQueryErrorToast from "../useQueryErrorToast";
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
            moderators {
                id
                createdAt
                userId
            }
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
        insert_ChatMessage(
            objects: { chatId: $chatId, content: $content, index: $index }
        ) {
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
            messages(
                order_by: { index: desc }
                limit: $limit
                offset: $offset
            ) {
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

export default function ManageChat({
    children,
    chatId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    chatId: string;
}): JSX.Element {
    const { isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return (
            <ManagerChat_IsAuthenticated chatId={chatId}>
                {children}
            </ManagerChat_IsAuthenticated>
        );
    } else {
        return (
            <ChatContext.Provider value={defaultChatContext}>
                {children}
            </ChatContext.Provider>
        );
    }
}

function ManagerChat_IsAuthenticated({
    children,
    chatId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    chatId: string;
}) {
    const {
        loading: chatLoading,
        error: chatError,
        data: chatData,
        refetch: chatRefetch,
    } = useSelectChatQuery({
        variables: {
            chatId,
        },
    });
    useQueryErrorToast(chatError);

    const {
        data: liveChatData,
        loading: liveChatLoading,
        error: liveChatError,
    } = useLiveChatSubscription({
        variables: {
            chatId,
            limit: 20,
            offset: 0,
        },
    });
    useQueryErrorToast(liveChatError);

    const [
        insertMessage,
        { loading: insertMessageLoading, error: insertMessageError },
    ] = useInsertMessageMutation();

    useEffect(() => {
        const intervalId = setInterval(() => {
            chatRefetch();
        }, 1000 * 60);
        return () => {
            clearInterval(intervalId);
        };
    }, [chatRefetch]);

    const chatValue = chatLoading ? null : chatError ? false : chatData ?? null;
    const liveChatValue =
        chatLoading || liveChatLoading
            ? null
            : chatError || liveChatError
            ? false
            : liveChatData ?? null;

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
                sendMessageError: insertMessageError
                    ? insertMessageError.message
                    : false,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}
