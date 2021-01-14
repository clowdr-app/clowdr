import { ApolloQueryResult, gql } from "@apollo/client";
import React, { useCallback, useMemo, useState } from "react";
import {
    ChatMessageDataFragment,
    SelectFirstMessagesPageQuery,
    SelectMessagesPageQuery,
    useDeleteMessageMutation,
    useLatestMessagesSubscription,
    useSelectFirstMessagesPageQuery,
    useSelectMessagesPageQuery,
    useSelectSingleMessageQuery,
} from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import ReadUpToIndexProvider from "./ReadUpToIndexProvider";

gql`
    fragment ChatFlagData on chat_Flag {
        discussionChatId
        flaggedById
        id
        messageId
        notes
        resolution
        resolved_at
        type
        updated_at
        created_at
    }

    fragment SenderData on Attendee {
        id
        displayName
    }

    fragment ChatReactionData on chat_Reaction {
        data
        id
        senderId
        sender {
            id
            displayName
        }
        symbol
        type
    }

    fragment ChatMessageData on chat_Message {
        created_at
        data
        duplicatedMessageId
        id
        isPinned
        message
        reactions {
            ...ChatReactionData
        }
        senderId
        sender {
            id
            displayName
        }
        type
        chatId
    }

    query SelectFirstMessagesPage($chatId: uuid!, $maxCount: Int!) {
        chat_Message(order_by: { id: desc }, where: { chatId: { _eq: $chatId } }, limit: $maxCount) {
            ...ChatMessageData
        }
    }

    query SelectMessagesPage($chatId: uuid!, $startAtIndex: Int!, $maxCount: Int!) {
        chat_Message(
            order_by: { id: desc }
            where: { chatId: { _eq: $chatId }, id: { _lte: $startAtIndex } }
            limit: $maxCount
        ) {
            ...ChatMessageData
        }
    }

    query SelectSingleMessage($id: Int!) {
        chat_Message_by_pk(id: $id) {
            ...ChatMessageData
        }
    }

    mutation DeleteMessage($id: Int!) {
        delete_chat_Message_by_pk(id: $id) {
            id
        }
    }

    subscription LatestMessages($chatId: uuid!, $maxCount: Int!) {
        chat_Message(order_by: { id: desc }, where: { chatId: { _eq: $chatId } }, limit: $maxCount) {
            ...ChatMessageData
        }
    }
`;

type LoadF = (
    index: number | null,
    count: number
) => Promise<{ nextIndex: number | null; newItems: Map<number, ChatMessageDataFragment> } | false>;

interface ReceiveMessageQueriesCtx {
    load: LoadF;
    refetch: (id: number) => Promise<void>;
    delete: (id: number) => Promise<void>;
    liveMessages: Map<number, ChatMessageDataFragment> | null;
    deletedItems: Set<number>;
    setAnsweringQuestionId: React.RefObject<{ f: (ids: number[] | null) => void; answeringIds: number[] | null }>;
}

const ReceiveMessageQueriesContext = React.createContext<ReceiveMessageQueriesCtx | undefined>(undefined);

export function useReceiveMessageQueries(): ReceiveMessageQueriesCtx {
    const ctx = React.useContext(ReceiveMessageQueriesContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function ReceiveMessageQueriesProvider({
    children,
    chatId,
    setAnsweringQuestionId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    chatId: string;
    setAnsweringQuestionId: React.RefObject<{ f: (ids: number[] | null) => void; answeringIds: number[] | null }>;
}): JSX.Element {
    const config = useChatConfiguration();

    const selectMessagesPageQ = useSelectMessagesPageQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const selectFirstMessagesPageQ = useSelectFirstMessagesPageQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const latestMessagesSub = useLatestMessagesSubscription({
        variables: {
            chatId,
            maxCount: config.messageLiveBatchSize ?? 30,
        },
        fetchPolicy: "network-only",
    });
    const refetchSingleMessageQ = useSelectSingleMessageQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const [deleteMessage] = useDeleteMessageMutation();

    const load: LoadF = useCallback(
        async (index, count) => {
            let result: ApolloQueryResult<SelectMessagesPageQuery | SelectFirstMessagesPageQuery>;
            if (index === null) {
                result = await selectFirstMessagesPageQ.refetch({
                    chatId,
                    maxCount: count,
                });
            } else {
                result = await selectMessagesPageQ.refetch({
                    chatId,
                    maxCount: count,
                    startAtIndex: index,
                });
            }
            return {
                newItems: new Map(
                    result.data.chat_Message.map<[number, ChatMessageDataFragment]>((item) => [item.id, item])
                ),
                nextIndex:
                    result.data.chat_Message.length > 0
                        ? result.data.chat_Message[result.data.chat_Message.length - 1].id - 1
                        : index !== null
                        ? index - 1
                        : null,
            };
        },
        [chatId, selectFirstMessagesPageQ, selectMessagesPageQ]
    );

    const [refetchMsg, setRefetchMsg] = useState<ChatMessageDataFragment | null>(null);
    const refetch = useCallback(
        async (id: number) => {
            const msg = await refetchSingleMessageQ.refetch({
                id,
            });
            if (msg.data.chat_Message_by_pk?.chatId === chatId) {
                setRefetchMsg(msg.data.chat_Message_by_pk ?? null);
            }
        },
        [chatId, refetchSingleMessageQ]
    );

    const [deletedItems, setDeletedItems] = useState<Set<number>>(new Set());
    const deleteMsg = useCallback(
        async (id: number) => {
            await deleteMessage({
                variables: {
                    id,
                },
            });

            setDeletedItems((old) => {
                const newS = new Set(old);
                newS.add(id);
                return newS;
            });
        },
        [deleteMessage]
    );
    const liveMessages = useMemo(() => {
        setRefetchMsg(null);
        return refetchMsg
            ? new Map<number, ChatMessageDataFragment>([[refetchMsg.id, refetchMsg]])
            : latestMessagesSub.data?.chat_Message
            ? new Map(latestMessagesSub.data.chat_Message.map((item) => [item.id, item]))
            : null;
    }, [latestMessagesSub.data?.chat_Message, refetchMsg]);

    return (
        <ReceiveMessageQueriesContext.Provider
            value={{
                load,
                refetch,
                delete: deleteMsg,
                liveMessages,
                deletedItems,
                setAnsweringQuestionId,
            }}
        >
            <ReadUpToIndexProvider chatId={chatId}>{children}</ReadUpToIndexProvider>
        </ReceiveMessageQueriesContext.Provider>
    );
}
