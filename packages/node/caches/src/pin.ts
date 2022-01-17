import type { RedisClientPool } from "@midspace/component-clients/redis";
import type { Client as GQLClient } from "@urql/core";
import { gql } from "@urql/core";
import type Redlock from "redlock";
import type { GetChatPinsQuery, GetChatPinsQueryVariables } from "./generated/graphql";
import { GetChatPinsDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetChatPins($chatId: uuid!) {
        chat_Pin(where: { chatId: { _eq: $chatId } }) {
            chatId
            registrantId
            wasManuallyPinned
        }
    }
`;

export type ChatPinsEntity = Record<string, string>;

export class ChatPinsCache extends TableCache {
    constructor(redisClientPool: RedisClientPool, redlock: Redlock, gqlClient: GQLClient) {
        super("ChatPin", redisClientPool, redlock, async (chatId) => {
            const response = await gqlClient
                ?.query<GetChatPinsQuery, GetChatPinsQueryVariables>(GetChatPinsDocument, {
                    chatId,
                })
                .toPromise();

            const data = response?.data?.chat_Pin;
            if (data) {
                return data.reduce<Record<string, string>>((acc, x) => {
                    acc[x.registrantId] = x.wasManuallyPinned ? "true" : "false";
                    return acc;
                }, {});
            }
            return undefined;
        });
    }
}
