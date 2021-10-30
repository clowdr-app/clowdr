import type { ConferenceEntity } from "@midspace/caches/conference";
import { conferenceCache } from "@midspace/caches/conference";
import { conferenceRoomsCache } from "@midspace/caches/conferenceRoom";
import {
    Conference_VisibilityLevel_Enum,
    Registrant_RegistrantRole_Enum,
    Room_ManagementMode_Enum,
    Room_PersonRole_Enum,
} from "@midspace/caches/generated/graphql";
import { registrantCache } from "@midspace/caches/registrant";
import { roomCache } from "@midspace/caches/room";
import { roomMembershipsCache } from "@midspace/caches/roomMembership";
import { subconferenceCache } from "@midspace/caches/subconference";
import { subconferenceRoomsCache } from "@midspace/caches/subconferenceRoom";
import { userCache } from "@midspace/caches/user";

enum HasuraHeaders {
    Role = "x-hasura-role",

    UserId = "x-hasura-user-id",
    RegistrantIds = "x-hasura-registrant-ids",
    ConferenceIds = "x-hasura-conference-ids",
    SubconferenceIds = "x-hasura-subconference-ids",
    RoomIds = "x-hasura-room-ids",

    MagicToken = "x-hasura-magic-token",
    InviteCode = "x-hasura-invite-code",
}

enum HasuraRoleNames {
    User = "user",
    Unauthenticated = "unauthenticated",
    MainConferenceOrganizer = "main-conference-organizer",
    Organizer = "organizer",
    Moderator = "moderator",
    Attendee = "attendee",
    Submitter = "submitter",
    RoomAdmin = "room-admin",
    RoomMember = "room-member",
    Superuser = "superuser",
}

function formatArrayForHasuraHeader(values: string | string[]): string {
    if (typeof values === "string") {
        return `{"${values}"}`;
    } else {
        return `{${values.map((x) => `"${x}"`).join(",")}}`;
    }
}

export async function computeAuthHeaders(
    verifiedParams: Partial<{ userId: string }>,
    unverifiedParams: Partial<{
        conferenceId: string;
        subconferenceId: string;
        roomId: string;
        magicToken: string;
        inviteCode: string;
        role: string;
        includeRoomIds: boolean;
    }>
): Promise<false | Partial<Record<HasuraHeaders, string>>> {
    console.log("Auth webhook inputs", { verifiedParams, unverifiedParams });

    // TODO: Do we want to cache the outcome of this logic?
    //          And if so, what is the invalidation strategy?
    //          Particularly given the constraints of redis deleting keys

    if (unverifiedParams.role === HasuraRoleNames.Superuser) {
        if (verifiedParams.userId?.length) {
            // We rely on Hasura permissions to figure this out since it is so
            // infrequent that we don't want to waste space caching these
            // permissions.
            return {
                [HasuraHeaders.UserId]: verifiedParams.userId,
                [HasuraHeaders.Role]: HasuraRoleNames.Superuser,
            };
        } else {
            return false;
        }
    }

    if (unverifiedParams.magicToken) {
        return {
            [HasuraHeaders.Role]: HasuraRoleNames.Submitter,
            [HasuraHeaders.MagicToken]: unverifiedParams.magicToken,
        };
    }

    if (unverifiedParams.inviteCode) {
        return {
            [HasuraHeaders.Role]: HasuraRoleNames.Unauthenticated,
            [HasuraHeaders.InviteCode]: unverifiedParams.inviteCode,
        };
    }

    if (!verifiedParams.userId?.length || unverifiedParams.role === HasuraRoleNames.Unauthenticated) {
        const result: Partial<Record<HasuraHeaders, string>> = {
            [HasuraHeaders.Role]: HasuraRoleNames.Unauthenticated,
            [HasuraHeaders.ConferenceIds]: formatArrayForHasuraHeader([]),
            [HasuraHeaders.SubconferenceIds]: formatArrayForHasuraHeader([]),
        };

        if (unverifiedParams.conferenceId) {
            const conference = await conferenceCache.getEntity(unverifiedParams.conferenceId);

            if (conference) {
                await evaluateUnauthenticatedConference(conference, result, unverifiedParams);
            }
        }

        return result;
    } else if (verifiedParams.userId?.length) {
        const result: Partial<Record<HasuraHeaders, string>> = {};
        const allowedRoles: HasuraRoleNames[] = [];
        let requestedRole = (unverifiedParams.role ?? HasuraRoleNames.User) as HasuraRoleNames;

        const user = await userCache.getEntity(verifiedParams.userId);
        if (user) {
            result[HasuraHeaders.UserId] = user.id;
            allowedRoles.push(HasuraRoleNames.User);

            if (unverifiedParams.conferenceId) {
                const registrantId = user.registrants.find((x) => x.conferenceId === unverifiedParams.conferenceId);
                if (registrantId) {
                    const registrant = await registrantCache.getEntity(registrantId.id);
                    const conference = await conferenceCache.getEntity(unverifiedParams.conferenceId);

                    if (registrant && conference) {
                        result[HasuraHeaders.RegistrantIds] = formatArrayForHasuraHeader(registrant.id);
                        result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(conference.id);

                        if (!unverifiedParams.subconferenceId) {
                            allowedRoles.push(HasuraRoleNames.Attendee);

                            let availableSubconferenceIds: string[] = [];

                            if (registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator) {
                                allowedRoles.push(HasuraRoleNames.Moderator);

                                for (const subconferenceId of conference.subconferenceIds) {
                                    const subconference = await subconferenceCache.getEntity(subconferenceId);
                                    if (
                                        subconference?.conferenceVisibilityLevel ===
                                            Conference_VisibilityLevel_Enum.Public ||
                                        subconference?.conferenceVisibilityLevel ===
                                            Conference_VisibilityLevel_Enum.External
                                    ) {
                                        availableSubconferenceIds.push(subconference.id);
                                    }
                                }
                            } else if (registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer) {
                                allowedRoles.push(HasuraRoleNames.Moderator);
                                allowedRoles.push(HasuraRoleNames.Organizer);
                                allowedRoles.push(HasuraRoleNames.MainConferenceOrganizer);

                                availableSubconferenceIds = conference.subconferenceIds;
                            } else {
                                for (const subconferenceId of conference.subconferenceIds) {
                                    const subconference = await subconferenceCache.getEntity(subconferenceId);
                                    if (
                                        subconference?.conferenceVisibilityLevel ===
                                            Conference_VisibilityLevel_Enum.Public ||
                                        subconference?.conferenceVisibilityLevel ===
                                            Conference_VisibilityLevel_Enum.External
                                    ) {
                                        availableSubconferenceIds.push(subconference.id);
                                    }
                                }
                            }

                            result[HasuraHeaders.SubconferenceIds] =
                                formatArrayForHasuraHeader(availableSubconferenceIds);

                            if (unverifiedParams.roomId) {
                                const room = await roomCache.getEntity(unverifiedParams.roomId);
                                if (room) {
                                    if (room.conferenceId === conference.id && !room.subconferenceId) {
                                        if (
                                            allowedRoles.includes(HasuraRoleNames.Moderator) ||
                                            allowedRoles.includes(HasuraRoleNames.Organizer) ||
                                            allowedRoles.includes(HasuraRoleNames.MainConferenceOrganizer)
                                        ) {
                                            result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                                            allowedRoles.push(HasuraRoleNames.RoomAdmin);
                                            allowedRoles.push(HasuraRoleNames.RoomMember);
                                        } else if (room.managementModeName === Room_ManagementMode_Enum.Public) {
                                            result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                                            allowedRoles.push(HasuraRoleNames.RoomMember);
                                        } else {
                                            const role = await roomMembershipsCache.getField(room.id, registrant.id);
                                            if (role) {
                                                result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                                                allowedRoles.push(HasuraRoleNames.RoomMember);

                                                if (role === Room_PersonRole_Enum.Admin) {
                                                    allowedRoles.push(HasuraRoleNames.RoomAdmin);
                                                }
                                            } else {
                                                return false;
                                            }
                                        }
                                    } else {
                                        return false;
                                    }
                                } else {
                                    return false;
                                }
                            } else if (unverifiedParams.includeRoomIds) {
                                allowedRoles.push(HasuraRoleNames.RoomMember);

                                const allRooms: Record<string, string> | undefined =
                                    await conferenceRoomsCache.getEntity(conference.id);
                                if (allRooms) {
                                    for (const subconferenceId of availableSubconferenceIds) {
                                        const allSubconfRooms = await subconferenceRoomsCache.getEntity(
                                            subconferenceId
                                        );
                                        for (const roomId in allSubconfRooms) {
                                            const roomManagementMode = allSubconfRooms[roomId];
                                            allRooms[roomId] = roomManagementMode;
                                        }
                                    }

                                    if (requestedRole === HasuraRoleNames.Organizer) {
                                        if (allowedRoles.includes(requestedRole)) {
                                            const availableRoomIds: string[] = [];
                                            for (const roomId in allRooms) {
                                                const roomManagementMode = allRooms[roomId];
                                                // We exclude DM and Managed Rooms from the catch-all list of rooms
                                                // since the UI currently doesn't need them and the list of ids
                                                // could rapidly become massive / out of bounds.
                                                if (
                                                    roomManagementMode === Room_ManagementMode_Enum.Public ||
                                                    roomManagementMode === Room_ManagementMode_Enum.Private
                                                ) {
                                                    availableRoomIds.push(roomId);
                                                }
                                            }
                                            result[HasuraHeaders.RoomIds] =
                                                formatArrayForHasuraHeader(availableRoomIds);
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        const availableRoomIds: string[] = [];
                                        for (const roomId in allRooms) {
                                            const roomManagementMode = allRooms[roomId];
                                            if (roomManagementMode === Room_ManagementMode_Enum.Public) {
                                                availableRoomIds.push(roomId);
                                            } else if (
                                                roomManagementMode === Room_ManagementMode_Enum.Private ||
                                                roomManagementMode === Room_ManagementMode_Enum.Managed ||
                                                roomManagementMode === Room_ManagementMode_Enum.Dm
                                            ) {
                                                const roomMembership = await roomMembershipsCache.getField(
                                                    roomId,
                                                    registrant.id
                                                );
                                                if (roomMembership) {
                                                    availableRoomIds.push(roomId);
                                                }
                                            }
                                        }
                                        result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(availableRoomIds);
                                    }
                                } else {
                                    return false;
                                }
                            } else {
                                result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader([]);
                            }
                        } else {
                            const subconferenceMembership = registrant.subconferenceMemberships.find(
                                (x) => x.subconferenceId === unverifiedParams.subconferenceId
                            );
                            if (subconferenceMembership) {
                                result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(
                                    unverifiedParams.subconferenceId
                                );
                                allowedRoles.push(HasuraRoleNames.Attendee);
                                if (subconferenceMembership.role === Registrant_RegistrantRole_Enum.Moderator) {
                                    allowedRoles.push(HasuraRoleNames.Moderator);
                                } else if (subconferenceMembership.role === Registrant_RegistrantRole_Enum.Organizer) {
                                    allowedRoles.push(HasuraRoleNames.Moderator);
                                    allowedRoles.push(HasuraRoleNames.Organizer);
                                }

                                if (unverifiedParams.roomId) {
                                    const room = await roomCache.getEntity(unverifiedParams.roomId);
                                    if (room) {
                                        if (
                                            room.conferenceId === conference.id &&
                                            room.subconferenceId === subconferenceMembership.subconferenceId
                                        ) {
                                            if (
                                                allowedRoles.includes(HasuraRoleNames.Moderator) ||
                                                allowedRoles.includes(HasuraRoleNames.Organizer)
                                            ) {
                                                result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                                                allowedRoles.push(HasuraRoleNames.RoomAdmin);
                                                allowedRoles.push(HasuraRoleNames.RoomMember);
                                            } else if (room.managementModeName === Room_ManagementMode_Enum.Public) {
                                                result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                                                allowedRoles.push(HasuraRoleNames.RoomMember);
                                            } else {
                                                const role = await roomMembershipsCache.getField(
                                                    room.id,
                                                    registrant.id
                                                );
                                                if (role) {
                                                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader(room.id);
                                                    allowedRoles.push(HasuraRoleNames.RoomMember);

                                                    if (role === Room_PersonRole_Enum.Admin) {
                                                        allowedRoles.push(HasuraRoleNames.RoomAdmin);
                                                    }
                                                } else {
                                                    return false;
                                                }
                                            }
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return false;
                                    }
                                } else if (unverifiedParams.includeRoomIds) {
                                    allowedRoles.push(HasuraRoleNames.RoomMember);

                                    const allRooms = await subconferenceRoomsCache.getEntity(
                                        subconferenceMembership.subconferenceId
                                    );
                                    if (allRooms) {
                                        if (requestedRole === HasuraRoleNames.Organizer) {
                                            if (allowedRoles.includes(requestedRole)) {
                                                const availableRoomIds: string[] = [];
                                                for (const roomId in allRooms) {
                                                    const roomManagementMode = allRooms[roomId];
                                                    // We exclude DM and Managed Rooms from the catch-all list of rooms
                                                    // since the UI currently doesn't need them and the list of ids
                                                    // could rapidly become massive / out of bounds.
                                                    if (
                                                        roomManagementMode === Room_ManagementMode_Enum.Public ||
                                                        roomManagementMode === Room_ManagementMode_Enum.Private
                                                    ) {
                                                        availableRoomIds.push(roomId);
                                                    }
                                                }
                                                result[HasuraHeaders.RoomIds] =
                                                    formatArrayForHasuraHeader(availableRoomIds);
                                            } else {
                                                return false;
                                            }
                                        } else {
                                            const availableRoomIds: string[] = [];
                                            for (const roomId in allRooms) {
                                                const roomManagementMode = allRooms[roomId];
                                                if (roomManagementMode === Room_ManagementMode_Enum.Public) {
                                                    availableRoomIds.push(roomId);
                                                } else if (
                                                    roomManagementMode === Room_ManagementMode_Enum.Private ||
                                                    roomManagementMode === Room_ManagementMode_Enum.Managed ||
                                                    roomManagementMode === Room_ManagementMode_Enum.Dm
                                                ) {
                                                    const roomMembership = await roomMembershipsCache.getField(
                                                        roomId,
                                                        registrant.id
                                                    );
                                                    if (roomMembership) {
                                                        availableRoomIds.push(roomId);
                                                    }
                                                }
                                            }
                                            result[HasuraHeaders.RoomIds] =
                                                formatArrayForHasuraHeader(availableRoomIds);
                                        }
                                    } else {
                                        return false;
                                    }
                                } else {
                                    result[HasuraHeaders.RoomIds] = formatArrayForHasuraHeader([]);
                                }
                            } else {
                                return false;
                            }
                        }
                    } else {
                        return false;
                    }
                } else {
                    const conference = await conferenceCache.getEntity(unverifiedParams.conferenceId);
                    if (conference) {
                        if (conference.createdBy === user.id) {
                            allowedRoles.push(HasuraRoleNames.Organizer);
                            allowedRoles.push(HasuraRoleNames.MainConferenceOrganizer);
                            result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(conference.id);
                        } else {
                            result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader([]);
                            result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader([]);
                            if (await evaluateUnauthenticatedConference(conference, result, unverifiedParams)) {
                                allowedRoles.push(HasuraRoleNames.Unauthenticated);
                                requestedRole = HasuraRoleNames.Unauthenticated;
                            } else {
                                return false;
                            }
                        }
                    } else {
                        return false;
                    }
                }
            } else {
                result[HasuraHeaders.RegistrantIds] = formatArrayForHasuraHeader(user.registrants.map((x) => x.id));
                result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(
                    user.registrants.map((x) => x.conferenceId)
                );
            }
        }

        if (allowedRoles.includes(requestedRole)) {
            result[HasuraHeaders.Role] = requestedRole;
        } else {
            return false;
        }

        return result;
    }

    return false;
}
async function evaluateUnauthenticatedConference(
    conference: ConferenceEntity,
    result: Partial<Record<HasuraHeaders, string>>,
    unverifiedParams: Partial<{
        conferenceId: string;
        subconferenceId: string;
        roomId: string;
        magicToken: string;
        inviteCode: string;
        role: string;
        includeRoomIds: boolean;
    }>
): Promise<boolean> {
    if (conference.conferenceVisibilityLevel === Conference_VisibilityLevel_Enum.Public) {
        result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(conference.id);

        if (unverifiedParams.subconferenceId) {
            const conferenceVisibilityLevel = await subconferenceCache.getField(
                unverifiedParams.subconferenceId,
                "conferenceVisibilityLevel"
            );

            if (conferenceVisibilityLevel === Conference_VisibilityLevel_Enum.Public) {
                result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(unverifiedParams.subconferenceId);
                return true;
            }
        } else {
            // All public subconferences
            const publicSubconferenceIds: string[] = [];
            for (const subconferenceId of conference.subconferenceIds) {
                const conferenceVisibilityLevel = await subconferenceCache.getField(
                    subconferenceId,
                    "conferenceVisibilityLevel"
                );
                if (conferenceVisibilityLevel === Conference_VisibilityLevel_Enum.Public) {
                    publicSubconferenceIds.push(subconferenceId);
                }
            }
            result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(publicSubconferenceIds);
            return true;
        }
    }
    return false;
}
