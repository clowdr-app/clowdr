import { Permissions_Permission_Enum, Room_ManagementMode_Enum } from "../generated/graphql";
import { ChatInfo, getChatInfo, Item } from "./cache/chatInfo";
import { getRegistrantInfo, RegistrantInfo } from "./cache/registrantInfo";
import { hasAtLeastOnePermissionForConfSlug } from "./cache/userPermission";

export async function canSelectChat(
    userId: string,
    chatId: string,
    confSlugs: string[],
    testMode_RestrictToAdmins: boolean,
    testMode_RegistrantId: string,
    testMode_ConferenceId: string,
    testMode_RoomId: string,
    testMode_RoomName: string,
    testMode_RoomManagementMode: Room_ManagementMode_Enum,
    testMode_Items: Item[],
    expectedPermissions = [
        Permissions_Permission_Enum.ConferenceViewAttendees,
        Permissions_Permission_Enum.ConferenceManageSchedule,
        Permissions_Permission_Enum.ConferenceModerateAttendees,
        Permissions_Permission_Enum.ConferenceManageAttendees,
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
        items: testMode_Items,
        rooms: [
            {
                id: testMode_RoomId,
                name: testMode_RoomName,
                people: [{ registrantId: testMode_RegistrantId, userId }],
                managementMode: testMode_RoomManagementMode,
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
                        testMode_RegistrantId,
                        testMode_ConferenceId,
                        testMode_RoomId,
                        testMode_RoomName,
                        testMode_RoomManagementMode,
                        testMode_Items,
                        expectedPermissions,
                        chatInfo,
                        true
                    );
                }

                return false;
            }

            if (
                chatInfo.rooms.length === 0 ||
                chatInfo.rooms.some((room) => room.managementMode === Room_ManagementMode_Enum.Public)
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
    testMode_RegistrantDisplayName: string,
    testMode_RoomId: string,
    testMode_RoomName: string,
    testMode_RoomManagementMode: Room_ManagementMode_Enum,
    testMode_Items: Item[]
): Promise<boolean> {
    let isOwnMessage = false;

    if (senderId) {
        const testMode_RegistrantInfoResult: RegistrantInfo = {
            displayName: testMode_RegistrantDisplayName,
            userId,
        };

        let registrantInfo = await getRegistrantInfo(senderId, testMode_RegistrantInfoResult);
        if (registrantInfo && !registrantInfo.userId) {
            // If the registrant existed but didn't have a user yet, we might have inadvertently
            // cached the registrant info from before the user completed registration
            registrantInfo = await getRegistrantInfo(senderId, testMode_RegistrantInfoResult, true);
        }

        if (registrantInfo && registrantInfo.userId) {
            isOwnMessage = registrantInfo.userId === userId;
        }
    }

    const testMode_ChatInfoResult: ChatInfo = {
        restrictToAdmins: testMode_RestrictToAdmins,
        conference: { id: testMode_ConferenceId, slug: confSlugs[0] },
        items: testMode_Items,
        rooms: [
            {
                id: testMode_RoomId,
                name: testMode_RoomName,
                people: senderId ? [{ registrantId: senderId, userId }] : [],
                managementMode: testMode_RoomManagementMode,
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
            testMode_RoomManagementMode,
            testMode_Items,
            !isOwnMessage || chatInfo.restrictToAdmins
                ? [
                      Permissions_Permission_Enum.ConferenceManageSchedule,
                      Permissions_Permission_Enum.ConferenceModerateAttendees,
                      Permissions_Permission_Enum.ConferenceManageAttendees,
                  ]
                : [
                      Permissions_Permission_Enum.ConferenceViewAttendees,
                      Permissions_Permission_Enum.ConferenceManageSchedule,
                      Permissions_Permission_Enum.ConferenceModerateAttendees,
                      Permissions_Permission_Enum.ConferenceManageAttendees,
                  ],
            chatInfo
        );
    }

    return false;
}

export const canIUDReaction = canIUDMessage;
