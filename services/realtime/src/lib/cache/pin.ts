import { gql } from "@apollo/client/core";
import { PinsDocument } from "../../generated/graphql";
import { testMode } from "../../testMode";
import { Cache } from "./cache";

gql`
    query Pins($chatId: uuid!) {
        chat_Pin(where: { chatId: { _eq: $chatId } }) {
            chatId
            attendeeId
        }
    }
`;

export type Pins = {
    chatId: string;
    attendeeIds: string[];
};

const PinsCache = new Cache<Pins>(
    "caches:Pins",
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
                          attendeeIds: response.data.chat_Pin.map((x) => x.attendeeId),
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

export async function insertPin(chatId: string, attendeeId: string): Promise<void> {
    await PinsCache.update(
        chatId,
        (existing) => {
            if (!existing?.attendeeIds.includes(attendeeId)) {
                return {
                    chatId,
                    attendeeIds: existing ? [...existing.attendeeIds, attendeeId] : [attendeeId],
                };
            } else {
                return existing;
            }
        },
        {
            chatId,
            attendeeIds: [],
        }
    );
}

export async function deletePin(chatId: string, attendeeId: string): Promise<void> {
    await PinsCache.update(
        chatId,
        (existing) => {
            return {
                chatId,
                attendeeIds: existing ? existing.attendeeIds.filter((x) => x !== attendeeId) : [],
            };
        },
        {
            chatId,
            attendeeIds: [attendeeId],
        }
    );
}
