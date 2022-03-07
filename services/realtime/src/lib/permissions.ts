import { ChatCache } from "@midspace/caches/chat";
import { EventCache } from "@midspace/caches/event";
import { Registrant_RegistrantRole_Enum } from "@midspace/caches/generated/graphql";
import { RegistrantCache } from "@midspace/caches/registrant";
import { RoomCache } from "@midspace/caches/room";
import { roomMembershipsCache } from "@midspace/caches/roomMembership";
import { UserCache } from "@midspace/caches/user";
import { Room_ManagementMode_Enum, Room_PersonRole_Enum } from "../generated/graphql";
import { logger } from "./logger";

export async function canSelectChat(userId: string, chatId: string, respectAdminRestriction = false): Promise<boolean> {
    const chat = await new ChatCache(logger).getEntity(chatId);
    if (chat) {
        const user = await new UserCache(logger).getEntity(userId);
        if (user) {
            const userRegistrant = user.registrants.find((x) => x.conferenceId === chat.conferenceId);
            if (userRegistrant) {
                const registrant = await new RegistrantCache(logger).getEntity(userRegistrant.id);
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
                        const room = await new RoomCache(logger).getEntity(roomId);
                        if (room) {
                            if (
                                (!chat.restrictToAdmins || !respectAdminRestriction) &&
                                room.managementModeName === Room_ManagementMode_Enum.Public
                            ) {
                                return true;
                            }
                            const membership = await roomMembershipsCache(logger).getField(roomId, registrant.id);
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
    const event = await new EventCache(logger).getEntity(eventId);
    if (event) {
        return canAccessRoom(userId, event.conferenceId, event.roomId);
    }

    return false;
}

export async function canAccessRoom(userId: string, conferenceId: string, roomId: string): Promise<boolean> {
    const user = await new UserCache(logger).getEntity(userId);
    if (user) {
        const userRegistrant = user.registrants.find((x) => x.conferenceId === conferenceId);
        if (userRegistrant) {
            const registrant = await new RegistrantCache(logger).getEntity(userRegistrant.id);
            if (registrant) {
                if (
                    registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ||
                    registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator
                ) {
                    return true;
                }

                const room = await new RoomCache(logger).getEntity(roomId);
                if (room) {
                    if (room.managementModeName === Room_ManagementMode_Enum.Public) {
                        return true;
                    }
                    const membership = await roomMembershipsCache(logger).getField(roomId, registrant.id);
                    if (membership) {
                        return true;
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
