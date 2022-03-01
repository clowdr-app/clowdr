import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type P from "pino";
import * as R from "ramda";
import type {
    ChatPinCacheDataFragment,
    Chat_Pin_Bool_Exp,
    GetChatPinsForHydrationQuery,
    GetChatPinsForHydrationQueryVariables,
    GetChatPinsQuery,
    GetChatPinsQueryVariables,
} from "./generated/graphql";
import { GetChatPinsDocument, GetChatPinsForHydrationDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment ChatPinCacheData on chat_Pin {
        chatId
        registrantId
        wasManuallyPinned
    }

    query GetChatPins($chatId: uuid!) {
        chat_Pin(where: { chatId: { _eq: $chatId } }) {
            ...ChatPinCacheData
        }
    }

    query GetChatPinsForHydration($filters: chat_Pin_bool_exp!) {
        chat_Pin(where: $filters) {
            ...ChatPinCacheData
        }
    }
`;

export type ChatPinsEntity = Record<string, string>;

type ChatPinsCacheRecord = Record<string, string>;

export type ChatPinsHydrationFilters =
    | {
          registrantId: string;
      }
    | {
          chatId: string;
      }
    | {
          conferenceId: string;
      };

function convertToCacheRecord(data: ChatPinCacheDataFragment[]): CacheRecord<keyof ChatPinsCacheRecord> {
    return data.reduce<Record<string, string>>((acc, x) => {
        acc[x.registrantId] = x.wasManuallyPinned ? "true" : "false";
        return acc;
    }, {});
}

export const chatPinsCache = (logger: P.Logger) =>
    new TableCache<keyof ChatPinsCacheRecord, ChatPinsHydrationFilters>(
        logger,
        "ChatPin",
        async (chatId) => {
            const response = await gqlClient
                ?.query<GetChatPinsQuery, GetChatPinsQueryVariables>(GetChatPinsDocument, {
                    chatId,
                })
                .toPromise();

            const data = response?.data?.chat_Pin;
            if (data) {
                return convertToCacheRecord(data);
            }
            return undefined;
        },
        async (filters) => {
            const gqlFilters: Chat_Pin_Bool_Exp = {};

            if ("chatId" in filters) {
                gqlFilters.chatId = {
                    _eq: filters.chatId,
                };
            } else if ("registrantId" in filters) {
                gqlFilters.registrantId = {
                    _eq: filters.registrantId,
                };
            } else if ("conferenceId" in filters) {
                gqlFilters.chat = {
                    conferenceId: {
                        _eq: filters.conferenceId,
                    },
                };
            }

            const response = await gqlClient
                ?.query<GetChatPinsForHydrationQuery, GetChatPinsForHydrationQueryVariables>(
                    GetChatPinsForHydrationDocument,
                    {
                        filters: gqlFilters,
                    }
                )
                .toPromise();
            if (response?.data) {
                const groups = R.groupBy((x) => x.chatId, response.data.chat_Pin);
                return Object.entries(groups).map(([chatId, record]) => ({
                    entityKey: chatId,
                    data: convertToCacheRecord(record),
                }));
            }

            return undefined;
        }
    );
