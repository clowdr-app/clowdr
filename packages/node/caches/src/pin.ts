import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type { P } from "pino";
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

export const chatPinsCache = (logger: P.Logger) =>
    new TableCache(logger, "ChatPin", async (chatId) => {
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
