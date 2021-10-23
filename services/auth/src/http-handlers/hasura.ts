import {
    Conference_VisibilityLevel_Enum,
    Registrant_RegistrantRole_Enum,
    Room_ManagementMode_Enum,
    Room_PersonRole_Enum,
} from "../generated/graphql";
import { getConference } from "../lib/cache/conference";
import { ConferenceRoomCache } from "../lib/cache/conferenceRoom";
import { getRegistrant } from "../lib/cache/registrant";
import { getRoom } from "../lib/cache/room";
import { RoomMembershipCache } from "../lib/cache/roomMembership";
import { getSubconference } from "../lib/cache/subconference";
import { SubconferenceRoomCache } from "../lib/cache/subconferenceRoom";
import { getUser } from "../lib/cache/user";

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
}

function formatArrayForHasuraHeader(values: string | string[]): string {
    if (typeof values === "string") {
        return `{"${values}"}`;
    } else {
        return `{${values.map((x) => `"${x}"`).join(",")}}`;
    }
}

export async function handleAuthWebhook(
    _rawPayload: AuthPayload,
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
    console.log("Auth webhook inputs", { _rawPayload, verifiedParams, unverifiedParams });

    // TODO: Do we want to cache the outcome of this logic?
    //          And if so, what is the invalidation strategy?
    //          Particularly given the constraints of redis deleting keys

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

    if (!verifiedParams.userId) {
        const result: Partial<Record<HasuraHeaders, string>> = {
            [HasuraHeaders.Role]: HasuraRoleNames.Unauthenticated,
            [HasuraHeaders.ConferenceIds]: formatArrayForHasuraHeader([]),
            [HasuraHeaders.SubconferenceIds]: formatArrayForHasuraHeader([]),
        };

        if (unverifiedParams.conferenceId) {
            const conference = await getConference(unverifiedParams.conferenceId);

            if (conference) {
                if (conference.conferenceVisibilityLevel === Conference_VisibilityLevel_Enum.Public) {
                    result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(conference.id);

                    if (unverifiedParams.subconferenceId) {
                        const subconference = await getSubconference(unverifiedParams.subconferenceId);

                        if (subconference?.conferenceVisibilityLevel === Conference_VisibilityLevel_Enum.Public) {
                            result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(subconference.id);
                        }
                    } else {
                        // All public subconferences
                        const publicSubconferenceIds: string[] = [];
                        for (const subconferenceId of conference.subconferenceIds) {
                            const subconference = await getSubconference(subconferenceId);
                            if (subconference?.conferenceVisibilityLevel === Conference_VisibilityLevel_Enum.Public) {
                                publicSubconferenceIds.push(subconference.id);
                            }
                        }
                        result[HasuraHeaders.SubconferenceIds] = formatArrayForHasuraHeader(publicSubconferenceIds);
                    }
                }
            }
        }

        return result;
    } else {
        const result: Partial<Record<HasuraHeaders, string>> = {};
        const allowedRoles: HasuraRoleNames[] = [];
        const requestedRole = (unverifiedParams.role ?? HasuraRoleNames.User) as HasuraRoleNames;

        const user = await getUser(verifiedParams.userId);
        if (user) {
            result[HasuraHeaders.UserId] = user.id;
            allowedRoles.push(HasuraRoleNames.User);

            if (unverifiedParams.conferenceId) {
                const registrantId = user.registrantIds.find((x) => x.conferenceId === unverifiedParams.conferenceId);
                if (registrantId) {
                    const registrant = await getRegistrant(registrantId.id);
                    const conference = await getConference(unverifiedParams.conferenceId);

                    if (registrant && conference) {
                        result[HasuraHeaders.RegistrantIds] = formatArrayForHasuraHeader(registrant.id);
                        result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(conference.id);

                        if (!unverifiedParams.subconferenceId) {
                            allowedRoles.push(HasuraRoleNames.Attendee);

                            let availableSubconferenceIds: string[] = [];

                            if (registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator) {
                                allowedRoles.push(HasuraRoleNames.Moderator);

                                for (const subconferenceId of conference.subconferenceIds) {
                                    const subconference = await getSubconference(subconferenceId);
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
                                    const subconference = await getSubconference(subconferenceId);
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
                                const room = await getRoom(unverifiedParams.roomId);
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
                                            const role = await RoomMembershipCache.getField(room.id, registrant.id);
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

                                const allRooms: Record<string, string> | undefined = await ConferenceRoomCache.get(
                                    conference.id
                                );
                                if (allRooms) {
                                    for (const subconferenceId of availableSubconferenceIds) {
                                        const allSubconfRooms = await SubconferenceRoomCache.get(subconferenceId);
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
                                                const roomMembership = await RoomMembershipCache.getField(
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
                                    const room = await getRoom(unverifiedParams.roomId);
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
                                                const role = await RoomMembershipCache.getField(room.id, registrant.id);
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

                                    const allRooms = await SubconferenceRoomCache.get(
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
                                                    const roomMembership = await RoomMembershipCache.getField(
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
                    return false;
                }
            } else {
                result[HasuraHeaders.RegistrantIds] = formatArrayForHasuraHeader(user.registrantIds.map((x) => x.id));
                result[HasuraHeaders.ConferenceIds] = formatArrayForHasuraHeader(
                    user.registrantIds.map((x) => x.conferenceId)
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
}
