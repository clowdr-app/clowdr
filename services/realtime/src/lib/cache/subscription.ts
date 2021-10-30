import { Cache } from "@midspace/component-clients/cache/cache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type { SubscriptionsQuery, SubscriptionsQueryVariables } from "../../generated/graphql";
import { SubscriptionsDocument } from "../../generated/graphql";

gql`
    query Subscriptions($chatId: uuid!) {
        chat_Subscription(where: { chatId: { _eq: $chatId } }) {
            chatId
            registrantId
        }
    }
`;

export type Subscriptions = {
    chatId: string;
    registrantIds: string[];
};

const SubscriptionsCache = new Cache<Subscriptions>(
    "realtime.caches:Subscriptions",
    async (chatId) => {
        const response =
            gqlClient &&
            (await gqlClient
                .query<SubscriptionsQuery, SubscriptionsQueryVariables>(SubscriptionsDocument, {
                    chatId,
                })
                .toPromise());

        const result: Subscriptions | undefined = response?.data?.chat_Subscription
            ? {
                  chatId,
                  registrantIds: response.data.chat_Subscription.map((x) => x.registrantId),
              }
            : undefined;

        return result;
    },
    JSON.stringify,
    JSON.parse,
    24 * 60 * 60 * 1000,
    5 * 60 * 1000
);

export async function getSubscriptions(chatId: string, refetchNow = false): Promise<Subscriptions | undefined> {
    const info = await SubscriptionsCache.get(chatId, refetchNow);
    if (!info && !refetchNow) {
        return getSubscriptions(chatId, true);
    }
    return info;
}

export async function insertSubscription(chatId: string, registrantId: string): Promise<void> {
    await SubscriptionsCache.update(
        chatId,
        (existing) => {
            if (!existing?.registrantIds.includes(registrantId)) {
                return {
                    chatId,
                    registrantIds: existing ? [...existing.registrantIds, registrantId] : [registrantId],
                };
            } else {
                return existing;
            }
        },
        false
    );
}

export async function deleteSubscription(chatId: string, registrantId: string): Promise<void> {
    await SubscriptionsCache.update(
        chatId,
        (existing) => {
            return {
                chatId,
                registrantIds: existing ? existing.registrantIds.filter((x) => x !== registrantId) : [],
            };
        },
        false
    );
}
