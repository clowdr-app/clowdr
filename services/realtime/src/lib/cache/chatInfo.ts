import { gql } from "@apollo/client/core";
import { ChatInfoDocument, RoomPrivacy_Enum } from "../../generated/graphql";
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
            }
            contentGroup {
                id
                title
                shortTitle
            }
            room {
                id
                name
                roomPrivacyName
                roomPeople {
                    id
                    attendee {
                        id
                        userId
                    }
                }
            }
        }
    }
`;

export type Person = {
    attendeeId: string;
    userId?: string;
};

export type ContentGroup = {
    id: string;
    title: string;
    shortTitle?: string;
};

export type ChatInfo = {
    restrictToAdmins: boolean;
    conference: {
        id: string;
        slug: string;
    };
    contentGroups: ContentGroup[];
    rooms: {
        id: string;
        name: string;
        privacy: RoomPrivacy_Enum;
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
                          },
                          contentGroups: response.data.chat_Chat_by_pk.contentGroup.map((cg) => ({
                              id: cg.id,
                              shortTitle: cg.shortTitle ?? undefined,
                              title: cg.title,
                          })),
                          rooms:
                              response.data.chat_Chat_by_pk.room.length > 0
                                  ? response.data.chat_Chat_by_pk.room.map(
                                        (room) => ({
                                            id: room.id,
                                            name: room.name,
                                            privacy: room.roomPrivacyName,
                                            people: room.roomPeople.map<Person>((p) => ({
                                                attendeeId: p.attendee.id,
                                                userId: p.attendee.userId ?? undefined,
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
