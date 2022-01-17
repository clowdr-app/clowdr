import { Registrant_RegistrantRole_Enum } from "@midspace/caches/generated/graphql";
import { Room_ManagementMode_Enum, Room_PersonRole_Enum } from "../generated/graphql";

export async function canSelectChat(userId: string, chatId: string, respectAdminRestriction = false): Promise<boolean> {
    const chat = await caches.chat.getEntity(chatId);
    if (chat) {
        const user = await caches.user.getEntity(userId);
        if (user) {
            const userRegistrant = user.registrants.find((x) => x.conferenceId === chat.conferenceId);
            if (userRegistrant) {
                const registrant = await caches.registrant.getEntity(userRegistrant.id);
                if (registrant) {
                    if ((!chat.restrictToAdmins || !respectAdminRestriction) && chat.itemId) {
                        return true;
                    }

                    if (
                        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ||
                        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator
                    ) {
                        return true;
                    }

                    if (chat.roomId) {
                        const roomId = chat.roomId;
                        const room = await caches.room.getEntity(roomId);
                        if (room) {
                            if (
                                (!chat.restrictToAdmins || !respectAdminRestriction) &&
                                room.managementModeName === Room_ManagementMode_Enum.Public
                            ) {
                                return true;
                            }
                            const membership = await caches.roomMemberships.getField(roomId, registrant.id);
                            if (membership) {
                                if (
                                    !chat.restrictToAdmins ||
                                    !respectAdminRestriction ||
                                    membership === Room_PersonRole_Enum.Admin
                                ) {
                                    return true;
                                }
                            }
                        }
                    } else {
                        return !chat.restrictToAdmins || !respectAdminRestriction;
                    }
                }
            }
        }
    }

    return false;
}

export async function canAccessEvent(userId: string, eventId: string): Promise<boolean> {
    const event = await caches.event.getEntity(eventId);
    if (event) {
        const user = await caches.user.getEntity(userId);
        if (user) {
            const userRegistrant = user.registrants.find((x) => x.conferenceId === event.conferenceId);
            if (userRegistrant) {
                const registrant = await caches.registrant.getEntity(userRegistrant.id);
                if (registrant) {
                    if (
                        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ||
                        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator
                    ) {
                        return true;
                    }

                    const room = await caches.room.getEntity(event.roomId);
                    if (room) {
                        if (room.managementModeName === Room_ManagementMode_Enum.Public) {
                            return true;
                        }
                        const membership = await caches.roomMemberships.getField(event.roomId, registrant.id);
                        if (membership) {
                            return true;
                        }
                    }
                }
            }
        }
    }

    return false;
}

export async function canIUDMessage(userId: string, chatId: string): Promise<boolean> {
    return canSelectChat(userId, chatId, true);
}

export const canIUDReaction = canIUDMessage;
