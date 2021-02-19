import { gql } from "@apollo/client";
import React, { useCallback, useMemo } from "react";
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

    fragment SubscribedChatReactionData on chat_Reaction {
        data
        id
        senderId
        symbol
        type
        messageId
    }

    fragment SubscribedChatMessageData on chat_Message {
        created_at
        data
        duplicatedMessageId
        id
        message
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

    subscription NextReactions($messageIds: [Int!]!) {
        chat_Reaction(where: { messageId: { _in: $messageIds } }) {
            ...SubscribedChatReactionData
        }
    }
`;

// type LoadF = (
//     index: number | null,
//     count: number
// ) => Promise<{ nextIndex: number | null; newItems: Map<number, ChatMessageDataFragment> } | false>;

interface ReceiveMessageQueriesCtx {
    // load: LoadF;
    refetch: (id: number) => Promise<void>;
    delete: (id: number) => Promise<void>;
    // liveMessages: Map<number, ChatMessageDataFragment> | null;
    // deletedItems: Set<number>;
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
    const refetchSingleMessageQ = useSelectSingleMessageQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const [deleteMessage] = useDeleteMessageMutation();

    // const [refetchMsg, setRefetchMsg] = useState<ChatMessageDataFragment | null>(null);
    const refetch = useCallback(
        async (id: number) => {
            const msg = await refetchSingleMessageQ.refetch({
                id,
            });
            if (msg.data.chat_Message_by_pk?.chatId === chatId) {
                // TODO: setRefetchMsg(msg.data.chat_Message_by_pk ?? null);
            }
        },
        [chatId, refetchSingleMessageQ]
    );

    const deleteMsg = useCallback(
        async (id: number) => {
            await deleteMessage({
                variables: {
                    id,
                },
            });

            // TODO
            // setDeletedItems((old) => {
            //     const newS = new Set(old);
            //     newS.add(id);
            //     return newS;
            // });
        },
        [deleteMessage]
    );

    const ctx = useMemo(
        () => ({
            refetch,
            delete: deleteMsg,
            setAnsweringQuestionId,
        }),
        [deleteMsg, refetch, setAnsweringQuestionId]
    );

    return <ReceiveMessageQueriesContext.Provider value={ctx}>{children}</ReceiveMessageQueriesContext.Provider>;
}
