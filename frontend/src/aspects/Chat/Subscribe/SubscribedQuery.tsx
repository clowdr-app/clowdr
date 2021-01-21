import { ApolloError, gql } from "@apollo/client";
import React, { createContext, useEffect, useMemo } from "react";
import {
    useSelectSubscriptionQuery,
    useSubscribeChatMutation,
    useUnsubscribeChatMutation,
} from "../../../generated/graphql";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useChatConfiguration } from "../Configuration";
import { useSelectedChat } from "../SelectedChat";
import type { MutableQuery } from "../Types/Queries";

export interface SubscribedQuery
    extends MutableQuery<
        {
            isSubscribed: boolean;
            allowedToUnsubscribe: boolean;
        },
        boolean
    > {}

const QueryContext = createContext<SubscribedQuery | undefined>(undefined);

gql`
    fragment SubscriptionData on chat_Subscription {
        chatId
        attendeeId
        wasManuallySubscribed
    }

    fragment ChatSubscriptionConfig on chat_Chat {
        id
        enableAutoSubscribe
        enableMandatorySubscribe
    }

    query SelectSubscription($chatId: uuid!, $attendeeId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            ...ChatSubscriptionConfig
        }
        chat_Subscription(where: { chatId: { _eq: $chatId }, attendeeId: { _eq: $attendeeId } }) {
            ...SubscriptionData
        }
    }

    mutation SubscribeChat($chatId: uuid!, $attendeeId: uuid!) {
        insert_chat_Subscription(
            objects: { chatId: $chatId, attendeeId: $attendeeId }
            on_conflict: { constraint: Subscription_pkey, update_columns: wasManuallySubscribed }
        ) {
            returning {
                ...SubscriptionData
            }
        }
        insert_chat_ReadUpToIndex(
            objects: { chatId: $chatId, attendeeId: $attendeeId, messageId: -1 }
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [] }
        ) {
            affected_rows
        }
    }

    mutation UnsubscribeChat($chatId: uuid!, $attendeeId: uuid!) {
        delete_chat_Subscription_by_pk(chatId: $chatId, attendeeId: $attendeeId) {
            ...SubscriptionData
        }
    }
`;

export function ChatSubscribedQueryProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const config = useChatConfiguration();
    const selectedChat = useSelectedChat();
    const subscriptionQ = useSelectSubscriptionQuery({
        variables: {
            attendeeId: config.currentAttendeeId,
            chatId: selectedChat.id,
        },
    });

    useEffect(() => {
        if (subscriptionQ.variables?.chatId !== selectedChat.id) {
            subscriptionQ.refetch({
                attendeeId: config.currentAttendeeId,
                chatId: selectedChat.id,
            });
        }
    }, [subscriptionQ, selectedChat.id, config.currentAttendeeId]);

    const [subscribeChat, { loading: subscribeChatLoading }] = useSubscribeChatMutation({
        variables: {
            attendeeId: config.currentAttendeeId,
            chatId: selectedChat.id,
        },
    });
    const [
        unsubscribeChat,
        { loading: unsubscribeChatLoading, error: unsubscribeChatError },
    ] = useUnsubscribeChatMutation({
        variables: {
            attendeeId: config.currentAttendeeId,
            chatId: selectedChat.id,
        },
    });

    const data = useMemo(
        () => ({
            isSubscribed: !!subscriptionQ.data && subscriptionQ.data?.chat_Subscription.length > 0,
            allowedToUnsubscribe:
                !!subscriptionQ.data?.chat_Chat_by_pk && !subscriptionQ.data.chat_Chat_by_pk.enableMandatorySubscribe,
        }),
        [subscriptionQ.data]
    );

    useQueryErrorToast(subscriptionQ.error ?? unsubscribeChatError, true, "SubscribedQuery.tsx");

    const value: SubscribedQuery = useMemo(
        () => ({
            data,
            error: subscriptionQ.error,
            loading: subscriptionQ.loading || subscribeChatLoading || unsubscribeChatLoading,
            refetch: async () => {
                const newD = await subscriptionQ.refetch();
                return {
                    isSubscribed: newD.data.chat_Subscription.length > 0,
                    allowedToUnsubscribe:
                        !!newD.data?.chat_Chat_by_pk && !newD.data.chat_Chat_by_pk.enableMandatorySubscribe,
                };
            },
            mutate: async (v) => {
                if (data.allowedToUnsubscribe) {
                    if (v) {
                        try {
                            await subscribeChat();
                            await subscriptionQ.refetch();
                        } catch (e) {
                            if (!(e instanceof ApolloError) || !e.message.includes("uniqueness violation")) {
                                throw e;
                            }
                        }
                    } else {
                        try {
                            await unsubscribeChat();
                            await subscriptionQ.refetch();
                        } catch (e) {
                            alert(e);
                        }
                    }
                }
            },
        }),
        [data, subscribeChat, subscribeChatLoading, subscriptionQ, unsubscribeChat, unsubscribeChatLoading]
    );

    return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useChatSubscribedQuery(): SubscribedQuery {
    const ctx = React.useContext(QueryContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
