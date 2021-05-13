import { gql } from "@apollo/client/core";
import { ChatInfoDocument, Room_ManagementMode_Enum } from "../../generated/graphql";
import { testMode } from "../../testMode";
import { Cache } from "./cache";

gql`
    query ChatInfo($chatId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            restrictToAdmins
            conference {
                id
                slug
                shortName
            }
            items {
                id
                title
                shortTitle
            }
            rooms {
                id
                name
                managementModeName
                roomPeople {
                    id
                    registrant {
                        id
                        userId
                    }
                }
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
    conference: {
        id: string;
        slug: string;
        shortName?: string;
    };
    items: Item[];
    rooms: {
        id: string;
        name: string;
        managementMode: Room_ManagementMode_Enum;
        people: Person[];
    }[];
};

const chatInfoCache = new Cache<ChatInfo>(
    "caches:ChatInfo",
    async (chatId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: ChatInfoDocument,
                    variables: {
                        chatId,
                    },
                });

                const result: ChatInfo | undefined = response.data.chat_Chat_by_pk
                    ? {
                          restrictToAdmins: response.data.chat_Chat_by_pk.restrictToAdmins,
                          conference: {
                              id: response.data.chat_Chat_by_pk.conference.id,
                              slug: response.data.chat_Chat_by_pk.conference.slug,
                              shortName: response.data.chat_Chat_by_pk.conference.shortName,
                          },
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
                                            managementMode: room.managementModeName,
                                            people: room.roomPeople.map<Person>((p) => ({
                                                registrantId: p.registrant.id,
                                                userId: p.registrant.userId ?? undefined,
                                            })),
                                        }),
                                        []
                                    )
                                  : [],
                      }
                    : undefined;

                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse
);

export async function getChatInfo(
    chatId: string,
    testMode_ExpectedInfo: ChatInfo,
    refetchNow = false
): Promise<ChatInfo | undefined> {
    const info = await chatInfoCache.get(chatId, testMode_ExpectedInfo, refetchNow);
    if (!info && !refetchNow) {
        return getChatInfo(chatId, testMode_ExpectedInfo, true);
    }
    return info;
}
