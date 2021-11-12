import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
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

export const chatSubscriptionsCache = new TableCache("ChatSubscription", async (chatId) => {
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
