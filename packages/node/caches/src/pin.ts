import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
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

export const chatPinsCache = new TableCache("ChatPin", async (chatId) => {
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
