import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "@urql/core";
import type Redlock from "redlock";
import type { GetChatSubscriptionsQuery, GetChatSubscriptionsQueryVariables } from "./generated/graphql";
import { GetChatSubscriptionsDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetChatSubscriptions($chatId: uuid!) {
        chat_Subscription(where: { chatId: { _eq: $chatId } }) {
            chatId
            registrantId
            wasManuallySubscribed
        }
    }
`;

export type ChatSubscriptionsEntity = Record<string, string>;

export class ChatSubscriptionsCache extends TableCache {
    constructor(redisClientPool: RedisClientPool, redlock: Redlock, gqlClient: GQLClient) {
        super("ChatSubscription", redisClientPool, redlock, async (chatId) => {
            const response = await gqlClient
                ?.query<GetChatSubscriptionsQuery, GetChatSubscriptionsQueryVariables>(GetChatSubscriptionsDocument, {
                    chatId,
                })
                .toPromise();

            const data = response?.data?.chat_Subscription;
            if (data) {
                return data.reduce<Record<string, string>>((acc, x) => {
                    acc[x.registrantId] = x.wasManuallySubscribed ? "true" : "false";
                    return acc;
                }, {});
            }
            return undefined;
        });
    }
}
