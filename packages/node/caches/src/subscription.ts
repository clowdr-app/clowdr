import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type P from "pino";
import * as R from "ramda";
import type {
    ChatSubscriptionCacheDataFragment,
    Chat_Subscription_Bool_Exp,
    GetChatSubscriptionsForHydrationQuery,
    GetChatSubscriptionsForHydrationQueryVariables,
    GetChatSubscriptionsQuery,
    GetChatSubscriptionsQueryVariables,
} from "./generated/graphql";
import { GetChatSubscriptionsDocument, GetChatSubscriptionsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment ChatSubscriptionCacheData on chat_Subscription {
        chatId
        registrantId
        wasManuallySubscribed
    }

    query GetChatSubscriptions($chatId: uuid!) {
        chat_Subscription(where: { chatId: { _eq: $chatId } }) {
            ...ChatSubscriptionCacheData
        }
    }

    query GetChatSubscriptionsForHydration($filters: chat_Subscription_bool_exp!) {
        chat_Subscription(where: $filters) {
            ...ChatSubscriptionCacheData
        }
    }
`;

export type ChatSubscriptionsEntity = Record<string, string>;

type ChatSubscriptionsCacheRecord = Record<string, string>;

export type ChatSubscriptionsHydrationFilters =
    | {
          registrantId: string;
      }
    | {
          chatId: string;
      }
    | {
          conferenceId: string;
      };

function convertToCacheRecord(
    data: ChatSubscriptionCacheDataFragment[]
): CacheRecord<keyof ChatSubscriptionsCacheRecord> {
    return data.reduce<Record<string, string>>((acc, x) => {
        acc[x.registrantId] = x.wasManuallySubscribed ? "true" : "false";
        return acc;
    }, {});
}

export const chatSubscriptionsCache = (logger: P.Logger) =>
    new TableCache<keyof ChatSubscriptionsCacheRecord, ChatSubscriptionsHydrationFilters>(
        logger,
        "ChatSubscription",
        async (chatId) => {
            const response = await gqlClient
                ?.query<GetChatSubscriptionsQuery, GetChatSubscriptionsQueryVariables>(GetChatSubscriptionsDocument, {
                    chatId,
                })
                .toPromise();

            const data = response?.data?.chat_Subscription;
            if (data) {
                return convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Chat_Subscription_Bool_Exp = {};

            if ("chatId" in filters) {
                gqlFilters.chatId = {
                    _eq: filters.chatId,
                };
            } else if ("registrantId" in filters) {
                gqlFilters.registrantId = {
                    _eq: filters.registrantId,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.chat = {
                    conferenceId: {
                        _eq: filters.conferenceId,
                    },
                };
            }

            const response = await gqlClient
                ?.query<GetChatSubscriptionsForHydrationQuery, GetChatSubscriptionsForHydrationQueryVariables>(
                    GetChatSubscriptionsForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                const groups = R.groupBy((x) => x.chatId, response.data.chat_Subscription);
                return Object.entries(groups).map(([chatId, record]) => ({
                    entityKey: chatId,
                    data: convertToCacheRecord(record),
                }));
            }

            return undefined;
        }
    );
