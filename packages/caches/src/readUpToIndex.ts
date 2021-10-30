import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type { GetReadUpToIndicesQuery, GetReadUpToIndicesQueryVariables } from "./generated/graphql";
import { GetReadUpToIndicesDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetReadUpToIndices($chatId: uuid!) {
        chat_ReadUpToIndex(where: { chatId: { _eq: $chatId }, registrant: { userId: { _is_null: false } } }) {
            chatId
            registrant {
                userId
            }
            messageSId
        }
    }
`;

export type ReadUpToIndicesEntity = Record<string, string>;

export const readUpToIndicesCache = new TableCache("ReadUpToIndex", async (chatId) => {
    const response = await gqlClient
        ?.query<GetReadUpToIndicesQuery, GetReadUpToIndicesQueryVariables>(GetReadUpToIndicesDocument, {
            chatId,
        })
        .toPromise();

    const data = response?.data?.chat_ReadUpToIndex;
    if (data) {
        return data.reduce<Record<string, string>>((acc, x) => {
            if (x.registrant.userId) {
                acc[x.registrant.userId] = x.messageSId;
            }
            return acc;
        }, {});
    }
    return undefined;
});
