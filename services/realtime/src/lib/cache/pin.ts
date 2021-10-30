import { Cache } from "@midspace/component-clients/cache/cache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type { PinsQuery, PinsQueryVariables } from "../../generated/graphql";
import { PinsDocument } from "../../generated/graphql";

gql`
    query Pins($chatId: uuid!) {
        chat_Pin(where: { chatId: { _eq: $chatId } }) {
            chatId
            registrantId
        }
    }
`;

export type Pins = {
    chatId: string;
    registrantIds: string[];
};

const PinsCache = new Cache<Pins>(
    "realtime.caches:Pins",
    async (chatId) => {
        const response =
            gqlClient &&
            (await gqlClient
                .query<PinsQuery, PinsQueryVariables>(PinsDocument, {
                    chatId,
                })
                .toPromise());

        const result: Pins | undefined = response?.data?.chat_Pin
            ? {
                  chatId,
                  registrantIds: response.data.chat_Pin.map((x) => x.registrantId),
              }
            : undefined;

        return result;
    },
    JSON.stringify,
    JSON.parse,
    60 * 60 * 1000,
    1 * 60 * 1000
);

export async function getPins(chatId: string, refetchNow = false): Promise<Pins | undefined> {
    const info = await PinsCache.get(chatId, refetchNow);
    if (!info && !refetchNow) {
        return getPins(chatId, true);
    }
    return info;
}

export async function insertPin(chatId: string, registrantId: string): Promise<void> {
    await PinsCache.update(
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

export async function deletePin(chatId: string, registrantId: string): Promise<void> {
    await PinsCache.update(
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
