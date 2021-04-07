import { Permission_Enum, RoomPrivacy_Enum } from "../generated/graphql";
import { AttendeeInfo, getAttendeeInfo } from "./cache/attendeeInfo";
import { ChatInfo, ContentGroup, getChatInfo } from "./cache/chatInfo";
import { hasAtLeastOnePermissionForConfSlug } from "./cache/userPermission";

export async function canSelectChat(
    userId: string,
    chatId: string,
    confSlugs: string[],
    testMode_RestrictToAdmins: boolean,
    testMode_AttendeeId: string,
    testMode_ConferenceId: string,
    testMode_RoomId: string,
    testMode_RoomName: string,
    testMode_RoomPrivacy: RoomPrivacy_Enum,
    testMode_ContentGroups: ContentGroup[],
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
    const testMode_Result = {
        restrictToAdmins: testMode_RestrictToAdmins,
        conference: { id: testMode_ConferenceId, slug: confSlugs[0] },
        contentGroups: testMode_ContentGroups,
        rooms: [
            {
                id: testMode_RoomId,
                name: testMode_RoomName,
                people: [{ attendeeId: testMode_AttendeeId, userId }],
                privacy: testMode_RoomPrivacy,
            },
        ],
    };

    if (hasPermissionForConfSlugs) {
        let chatInfo = chatInfoPrior ?? (await getChatInfo(chatId, testMode_Result));

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
                        testMode_RoomId,
                        testMode_RoomName,
                        testMode_RoomPrivacy,
                        testMode_ContentGroups,
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
                chatInfo = await getChatInfo(chatId, testMode_Result, true);
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
    senderId: string | undefined,
    testMode_RestrictToAdmins: boolean,
    testMode_ConferenceId: string,
    testMode_AttendeeDisplayName: string,
    testMode_RoomId: string,
    testMode_RoomName: string,
    testMode_RoomPrivacy: RoomPrivacy_Enum,
    testMode_ContentGroups: ContentGroup[]
): Promise<boolean> {
    let isOwnMessage = false;

    if (senderId) {
        const testMode_AttendeeInfoResult: AttendeeInfo = {
            displayName: testMode_AttendeeDisplayName,
            userId,
        };

        let attendeeInfo = await getAttendeeInfo(senderId, testMode_AttendeeInfoResult);
        if (attendeeInfo && !attendeeInfo.userId) {
            // If the attendee existed but didn't have a user yet, we might have inadvertently
            // cached the attendee info from before the user completed registration
            attendeeInfo = await getAttendeeInfo(senderId, testMode_AttendeeInfoResult, true);
        }

        if (attendeeInfo && attendeeInfo.userId) {
            isOwnMessage = attendeeInfo.userId === userId;
        }
    }

    const testMode_ChatInfoResult: ChatInfo = {
        restrictToAdmins: testMode_RestrictToAdmins,
        conference: { id: testMode_ConferenceId, slug: confSlugs[0] },
        contentGroups: testMode_ContentGroups,
        rooms: [
            {
                id: testMode_RoomId,
                name: testMode_RoomName,
                people: senderId ? [{ attendeeId: senderId, userId }] : [],
                privacy: testMode_RoomPrivacy,
            },
        ],
    };

    const chatInfo = await getChatInfo(chatId, testMode_ChatInfoResult);

    if (chatInfo) {
        return canSelectChat(
            userId,
            chatId,
            confSlugs,
            testMode_RestrictToAdmins,
            senderId ?? "canIUDMessage:test-no-sender-id",
            testMode_ConferenceId,
            testMode_RoomId,
            testMode_RoomName,
            testMode_RoomPrivacy,
            testMode_ContentGroups,
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

export const canIUDReaction = canIUDMessage;
