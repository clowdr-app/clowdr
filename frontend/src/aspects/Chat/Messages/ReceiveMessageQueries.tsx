import { ApolloQueryResult, gql } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import {
    ChatMessageDataFragment,
    SelectFirstMessagesPageQuery,
    SelectMessagesPageQuery,
    useDeleteMessageMutation,
    useNextMessageSubscription,
    useNextReactionsSubscription,
    useSelectFirstMessagesPageQuery,
    useSelectMessagesPageQuery,
    useSelectSingleMessageQuery,
} from "../../../generated/graphql";
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

    subscription NextMessage($prevId: Int!, $chatId: uuid!) {
        chat_Message(order_by: { id: desc }, where: { id: { _gt: $prevId }, chatId: { _eq: $chatId } }, limit: 1) {
            ...SubscribedChatMessageData
        }
    }

    subscription NextReactions($messageIds: [Int!]!) {
        chat_Reaction(where: { messageId: { _in: $messageIds } }) {
            ...SubscribedChatReactionData
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
    const selectMessagesPageQ = useSelectMessagesPageQuery({
        skip: true,
    });
    const selectFirstMessagesPageQ = useSelectFirstMessagesPageQuery({
        skip: true,
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

    const [liveMessages, setLiveMessages] = useState<{
        msgs: Map<number, ChatMessageDataFragment>;
        maxId: number;
    }>({
        msgs: new Map(),
        maxId: -1,
    });
    const nextMessageSub = useNextMessageSubscription({
        variables: {
            chatId,
            prevId: liveMessages.maxId,
        },
    });
    const liveReactions = useNextReactionsSubscription({
        fetchPolicy: "network-only",
        variables: {
            messageIds: [...liveMessages.msgs.keys()],
        }
    });
    // const [liveReactions, setLiveReactions] = useState<readonly SubscribedChatReactionDataFragment[]>([]);
    // const pollCb = useCallback(() => {
    //     (async () => {
    //         const data = await nextReactionsSub.refetch({
    //             messageIds: [...liveMessages.msgs.keys()],
    //         });
    //         setLiveReactions(data.data.chat_Reaction);
    //     })();
    // }, [liveMessages.msgs, nextReactionsSub]);
    // usePolling(pollCb, 5000, true);
    useEffect(() => {
        setRefetchMsg(null);
        setLiveMessages((prevLiveMessages) => {
            const newLiveMessages = new Map(prevLiveMessages.msgs.entries());
            let maxId = prevLiveMessages.maxId;

            if (refetchMsg) {
                newLiveMessages.set(refetchMsg.id, refetchMsg);
            }

            if (nextMessageSub.data?.chat_Message && nextMessageSub.data?.chat_Message.length > 0) {
                const nextMessage = nextMessageSub.data.chat_Message[0];
                const existingMessage = newLiveMessages.get(nextMessage.id);
                newLiveMessages.set(nextMessage.id, {
                    ...nextMessage,
                    reactions: existingMessage?.reactions ?? [],
                });
                maxId = Math.max(maxId, nextMessage.id);
            }

            if (liveReactions.data?.chat_Reaction && liveReactions.data.chat_Reaction.length > 0) {
                const freshMsgs = new Map<number, ChatMessageDataFragment>();
                for (const reaction of liveReactions.data.chat_Reaction) {
                    let msg = freshMsgs.get(reaction.messageId);
                    if (msg) {
                        freshMsgs.set(reaction.messageId, {
                            ...msg,
                            reactions: [...msg.reactions, reaction],
                        });
                    } else {
                        msg = newLiveMessages.get(reaction.messageId);
                        if (msg) {
                            freshMsgs.set(reaction.messageId, {
                                ...msg,
                                reactions: [reaction],
                            });
                        }
                    }
                }
                for (const [id, msg] of freshMsgs) {
                    newLiveMessages.set(id, msg);
                }
            }

            return {
                msgs: newLiveMessages,
                maxId,
            };
        });
    }, [liveReactions.data?.chat_Reaction, nextMessageSub.data?.chat_Message, refetchMsg]);

    return (
        <ReceiveMessageQueriesContext.Provider
            value={{
                load,
                refetch,
                delete: deleteMsg,
                liveMessages: liveMessages.msgs,
                deletedItems,
                setAnsweringQuestionId,
            }}
        >
            <ReadUpToIndexProvider chatId={chatId}>{children}</ReadUpToIndexProvider>
        </ReceiveMessageQueriesContext.Provider>
    );
}
