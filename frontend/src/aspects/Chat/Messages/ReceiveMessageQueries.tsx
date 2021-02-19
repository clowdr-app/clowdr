import { gql } from "@apollo/client";
import React, { useCallback, useMemo, useState } from "react";
import { useDeleteMessageMutation, useSelectSingleMessageQuery } from "../../../generated/graphql";

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

    fragment ChatReactionData on chat_Reaction {
        data
        id
        senderId
        symbol
        type
    }

    fragment ChatMessageData on chat_Message {
        created_at
        data
        duplicatedMessageId
        id
        message
        reactions {
            ...ChatReactionData
        }
        senderId
        type
        chatId
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
`;

// type LoadF = (
//     index: number | null,
//     count: number
// ) => Promise<{ nextIndex: number | null; newItems: Map<number, ChatMessageDataFragment> } | false>;

interface ReceiveMessageQueriesCtx {
    // load: LoadF;
    refetch: (id: number) => void;
    delete: (id: number) => void;
    // liveMessages: Map<number, ChatMessageDataFragment> | null;
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
    setAnsweringQuestionId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    setAnsweringQuestionId: React.RefObject<{ f: (ids: number[] | null) => void; answeringIds: number[] | null }>;
}): JSX.Element {
    const refetchSingleMessageQ = useSelectSingleMessageQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const [deleteMessage] = useDeleteMessageMutation();

    const refetch = useCallback(
        (id: number) => {
            refetchSingleMessageQ.refetch({
                id,
            });
        },
        [refetchSingleMessageQ]
    );

    const [deletedItems, setDeletedItems] = useState<Set<number>>(new Set());
    const deleteMsg = useCallback(
        (id: number) => {
            deleteMessage({
                variables: {
                    id,
                },
                update: (cache, data) => {
                    if (data.data?.delete_chat_Message_by_pk?.id) {
                        const _data = data.data.delete_chat_Message_by_pk;
                        cache.evict({
                            id: cache.identify(_data),
                        });
                    }
                },
            });
            setDeletedItems((old) => {
                const newItems = new Set(old);
                newItems.add(id);
                return newItems;
            });
        },
        [deleteMessage]
    );

    const ctx = useMemo(
        () => ({
            refetch,
            delete: deleteMsg,
            setAnsweringQuestionId,
            deletedItems,
        }),
        [deleteMsg, deletedItems, refetch, setAnsweringQuestionId]
    );

    return <ReceiveMessageQueriesContext.Provider value={ctx}>{children}</ReceiveMessageQueriesContext.Provider>;
}
