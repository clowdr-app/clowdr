import { Cache } from "@midspace/component-clients/cache/cache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type { ChatInfoQuery, ChatInfoQueryVariables } from "../../generated/graphql";
import { ChatInfoDocument } from "../../generated/graphql";

gql`
    query ChatInfo($chatId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            restrictToAdmins
            conferenceId
            items {
                id
                title
                shortTitle
            }
            rooms {
                id
                name
            }
        }
    }
`;

export type Person = {
    registrantId: string;
    userId?: string;
};

export type Item = {
    id: string;
    title: string;
    shortTitle?: string;
};

export type ChatInfo = {
    restrictToAdmins: boolean;
    conferenceId: string;
    items: Item[];
    rooms: {
        id: string;
        name: string;
    }[];
};

const chatInfoCache = new Cache<ChatInfo>(
    "realtime.caches:ChatInfo",
    async (chatId) => {
        const response =
            gqlClient &&
            (await gqlClient
                .query<ChatInfoQuery, ChatInfoQueryVariables>(ChatInfoDocument, {
                    chatId,
                })
                .toPromise());

        const result: ChatInfo | undefined = response?.data?.chat_Chat_by_pk
            ? {
                  restrictToAdmins: response.data.chat_Chat_by_pk.restrictToAdmins,
                  conferenceId: response.data.chat_Chat_by_pk.conferenceId,
                  items: response.data.chat_Chat_by_pk.items.map((item) => ({
                      id: item.id,
                      shortTitle: item.shortTitle ?? undefined,
                      title: item.title,
                  })),
                  rooms:
                      response.data.chat_Chat_by_pk.rooms.length > 0
                          ? response.data.chat_Chat_by_pk.rooms.map(
                                (room) => ({
                                    id: room.id,
                                    name: room.name,
                                }),
                                []
                            )
                          : [],
              }
            : undefined;

        return result;
    },
    JSON.stringify,
    JSON.parse
);

export async function getChatInfo(chatId: string, refetchNow = false): Promise<ChatInfo | undefined> {
    const info = await chatInfoCache.get(chatId, refetchNow);
    if (!info && !refetchNow) {
        return getChatInfo(chatId, true);
    }
    return info;
}
