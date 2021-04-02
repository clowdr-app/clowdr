import { gql } from "@apollo/client/core";
import { ChatInfoDocument, Permission_Enum, RoomPrivacy_Enum, UserPermissionsDocument } from "../generated/graphql";
import { redisClientP, redlock } from "../redis";
import { testMode } from "../testMode";

gql`
    query UserPermissions($userId: String!) {
        FlatUserPermission(where: { user_id: { _eq: $userId } }) {
            slug
            permission_name
            user_id
        }
    }

    query ChatInfo($chatId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            restrictToAdmins
            conference {
                id
                slug
            }
            room {
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

class Cache<T> {
    constructor(
        private redisRootKey: string,
        private fetch: (key: string, testMode_ExpectedValue: T | undefined) => Promise<T | undefined>,
        private stringify: (value: T) => string,
        private parse: (value: string) => T,
        private refetchAfterMs = 24 * 60 * 60 * 1000,
        private rateLimitPeriodMs = 3 * 60 * 1000
    ) {}

    private generateCacheKey(itemKey: string): string {
        return `${this.redisRootKey}:${itemKey}`;
    }

    async get(itemKey: string, testMode_ExpectedValue: T | undefined, refetchNow = false): Promise<T | undefined> {
        const cacheKey = this.generateCacheKey(itemKey);
        const lease = await redlock.acquire(`locks:${cacheKey}`, 5000);
        try {
            const existingValStr = await redisClientP.get(cacheKey);
            if (existingValStr !== null) {
                const existingVal = JSON.parse(existingValStr);
                const fetchedAt: number = existingVal.fetchedAt;

                if (existingVal.value === "undefined" || refetchNow) {
                    if (Date.now() - fetchedAt < this.rateLimitPeriodMs) {
                        return existingVal.value === "undefined" ? undefined : this.parse(existingVal.value);
                    }
                } else {
                    return this.parse(existingVal.value);
                }
            }

            const val = await this.fetch(itemKey, testMode_ExpectedValue);
            const valStr = val !== undefined ? this.stringify(val) : "undefined";
            await redisClientP.set(
                cacheKey,
                JSON.stringify({ fetchedAt: Date.now(), value: valStr }),
                "NX",
                "PX",
                Date.now() + this.refetchAfterMs
            );
            return val;
        } finally {
            lease.unlock();
        }
    }
}

type UserPermission = {
    slug: string;
    permission_name: Permission_Enum;
};

type Person = {
    attendeeId: string;
    userId?: string;
};

type ChatInfo = {
    restrictToAdmins: boolean;
    conference: {
        id: string;
        slug: string;
    };
    rooms: {
        privacy: RoomPrivacy_Enum;
        people: Person[];
    }[];
};

const userPermissionCache = new Cache<UserPermission[]>(
    "caches:UserPermission",
    async (userId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: UserPermissionsDocument,
                    variables: {
                        userId,
                    },
                });

                const result = response.data.FlatUserPermission.map<UserPermission | undefined>((perm) =>
                    perm.permission_name && perm.slug
                        ? {
                              permission_name: perm.permission_name as Permission_Enum,
                              slug: perm.slug,
                          }
                        : undefined
                ).filter<UserPermission>((x): x is UserPermission => !!x);

                if (result.length === 0) {
                    return undefined;
                }
                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse
);

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
                          rooms:
                              response.data.chat_Chat_by_pk.room.length > 0
                                  ? response.data.chat_Chat_by_pk.room.map(
                                        (room) => ({
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

async function hasAtLeastOnePermissionForConfSlug(
    userId: string,
    permissionNames: Permission_Enum[],
    conferenceSlugs: string[],
    refetchNow = false
): Promise<string[] | false> {
    const perms = await userPermissionCache.get(
        userId,
        permissionNames.map((permission_name) => ({
            slug: conferenceSlugs[0],
            permission_name,
        })),
        refetchNow
    );
    const result =
        !!perms &&
        perms
            .filter((perm) => conferenceSlugs.includes(perm.slug) && permissionNames.includes(perm.permission_name))
            .map((x) => x.slug);
    // We didn't find the permission we were looking for, we didn't just refetch, but we did get
    // some permissions so the cache might be stale
    if (!result && !refetchNow && perms) {
        return hasAtLeastOnePermissionForConfSlug(userId, permissionNames, conferenceSlugs, true);
    }
    return result;
}

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

export async function canSelectChat(
    userId: string,
    chatId: string,
    confSlugs: string[],
    testMode_RestrictToAdmins: boolean,
    testMode_AttendeeId: string,
    testMode_ConferenceId: string,
    testMode_RoomPrivacy: RoomPrivacy_Enum,
    expectedPermissions = [
        Permission_Enum.ConferenceViewAttendees,
        Permission_Enum.ConferenceManageSchedule,
        Permission_Enum.ConferenceModerateAttendees,
        Permission_Enum.ConferenceManageAttendees,
    ],
    chatInfoPrior?: ChatInfo,
    refetchPermissionsNow = false
): Promise<boolean> {
    const hasPermissionForConfSlugs = await hasAtLeastOnePermissionForConfSlug(
        userId,
        expectedPermissions,
        confSlugs,
        refetchPermissionsNow
    );
    if (hasPermissionForConfSlugs) {
        let chatInfo =
            chatInfoPrior ??
            (await getChatInfo(chatId, {
                restrictToAdmins: testMode_RestrictToAdmins,
                conference: { id: testMode_ConferenceId, slug: confSlugs[0] },
                rooms: [
                    {
                        people: [{ attendeeId: testMode_AttendeeId, userId }],
                        privacy: testMode_RoomPrivacy,
                    },
                ],
            }));

        if (chatInfo) {
            if (!hasPermissionForConfSlugs.includes(chatInfo.conference.slug)) {
                if (!refetchPermissionsNow) {
                    return canSelectChat(
                        userId,
                        chatId,
                        confSlugs,
                        testMode_RestrictToAdmins,
                        testMode_AttendeeId,
                        testMode_ConferenceId,
                        testMode_RoomPrivacy,
                        expectedPermissions,
                        chatInfo,
                        true
                    );
                }

                return false;
            }

            if (
                chatInfo.rooms.length === 0 ||
                chatInfo.rooms.some((room) => room.privacy === RoomPrivacy_Enum.Public)
            ) {
                return true;
            }

            if (!chatInfo.rooms.some((room) => room.people.some((x) => x.userId === userId))) {
                chatInfo = await getChatInfo(
                    chatId,
                    {
                        restrictToAdmins: testMode_RestrictToAdmins,
                        conference: { id: testMode_ConferenceId, slug: confSlugs[0] },
                        rooms: [
                            {
                                people: [{ attendeeId: testMode_AttendeeId, userId }],
                                privacy: testMode_RoomPrivacy,
                            },
                        ],
                    },
                    true
                );
            }
        }

        return !!chatInfo && chatInfo.rooms.some((room) => room.people.some((x) => x.userId === userId));
    }

    return false;
}

export async function canIUDMessage(
    userId: string,
    chatId: string,
    confSlugs: string[],
    isOwnMessage: boolean,
    testMode_RestrictToAdmins: boolean,
    testMode_AttendeeId: string,
    testMode_ConferenceId: string,
    testMode_RoomPrivacy: RoomPrivacy_Enum
): Promise<boolean> {
    const chatInfo = await getChatInfo(chatId, {
        restrictToAdmins: testMode_RestrictToAdmins,
        conference: { id: testMode_ConferenceId, slug: confSlugs[0] },
        rooms: [
            {
                people: [{ attendeeId: testMode_AttendeeId, userId }],
                privacy: testMode_RoomPrivacy,
            },
        ],
    });

    if (chatInfo) {
        return canSelectChat(
            userId,
            chatId,
            confSlugs,
            testMode_RestrictToAdmins,
            testMode_AttendeeId,
            testMode_ConferenceId,
            testMode_RoomPrivacy,
            !isOwnMessage || chatInfo.restrictToAdmins
                ? [
                      Permission_Enum.ConferenceManageSchedule,
                      Permission_Enum.ConferenceModerateAttendees,
                      Permission_Enum.ConferenceManageAttendees,
                  ]
                : [
                      Permission_Enum.ConferenceViewAttendees,
                      Permission_Enum.ConferenceManageSchedule,
                      Permission_Enum.ConferenceModerateAttendees,
                      Permission_Enum.ConferenceManageAttendees,
                  ],
            chatInfo
        );
    }

    return false;
}
