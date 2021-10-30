import { Cache } from "@midspace/component-clients/cache/cache";
import { gql } from "graphql-tag";
import { PinsDocument } from "../../generated/graphql";
import { testMode } from "../../testMode";

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
    async (chatId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: PinsDocument,
                    variables: {
                        chatId,
                    },
                });

                const result: Pins | undefined = response.data.chat_Pin
                    ? {
                          chatId,
                          registrantIds: response.data.chat_Pin.map((x) => x.registrantId),
                      }
                    : undefined;

                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse,
    24 * 60 * 60 * 1000,
    5 * 60 * 1000
);

export async function getPins(
    chatId: string,
    testMode_ExpectedInfo: Pins,
    refetchNow = false
): Promise<Pins | undefined> {
    const info = await PinsCache.get(chatId, testMode_ExpectedInfo, refetchNow);
    if (!info && !refetchNow) {
        return getPins(chatId, testMode_ExpectedInfo, true);
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
        {
            chatId,
            registrantIds: [],
        }
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
        {
            chatId,
            registrantIds: [registrantId],
        }
    );
}
