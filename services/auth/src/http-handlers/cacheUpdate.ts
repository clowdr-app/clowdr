import {
    invalidateCachedConference,
    updateCachedConference,
    updateCachedConferenceSubconferenceIds,
} from "@midspace/auth/cache/conference";
import { ConferenceRoomCache } from "@midspace/auth/cache/conferenceRoom";
import type { SubconferenceMembership } from "@midspace/auth/cache/registrant";
import {
    invalidateCachedRegistrant,
    updateCachedRegistrant,
    updateCachedRegistrantSubconferenceMemberships,
} from "@midspace/auth/cache/registrant";
import { invalidateCachedRoom, updateCachedRoom } from "@midspace/auth/cache/room";
import { RoomMembershipCache } from "@midspace/auth/cache/roomMembership";
import { invalidateCachedSubconference, updateCachedSubconference } from "@midspace/auth/cache/subconference";
import { SubconferenceRoomCache } from "@midspace/auth/cache/subconferenceRoom";
import { invalidateCachedUser, updateCachedUserRegistrantIds } from "@midspace/auth/cache/user";
import type { CacheUpdate } from "../types/hasura/cacheUpdate";
import type { Payload } from "../types/hasura/event";

export async function handleConferenceCacheUpdate(payload: Payload<CacheUpdate.ConferenceData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            invalidateCachedConference(payload.event.data.new.id);
            break;
        case "UPDATE":
            updateCachedConference(
                payload.event.data.new.id,
                payload.event.data.new.conferenceVisibilityLevel,
                payload.event.data.new.createdBy
            );
            break;
        case "DELETE":
            invalidateCachedConference(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                invalidateCachedConference(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                invalidateCachedConference(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleSubconferenceCacheUpdate(payload: Payload<CacheUpdate.SubconferenceData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const id = payload.event.data.new.id;
                invalidateCachedSubconference(id);
                updateCachedConferenceSubconferenceIds(payload.event.data.new.conferenceId, (oldIds) => [
                    ...oldIds,
                    id,
                ]);
            }
            break;
        case "UPDATE":
            {
                updateCachedSubconference(payload.event.data.new.id, payload.event.data.new.conferenceVisibilityLevel);
            }
            break;
        case "DELETE":
            {
                const id = payload.event.data.old.id;
                invalidateCachedSubconference(id);
                updateCachedConferenceSubconferenceIds(payload.event.data.old.conferenceId, (oldIds) =>
                    oldIds.filter((x) => x !== id)
                );
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const id = payload.event.data.old.id;
                invalidateCachedSubconference(payload.event.data.old.id);
                updateCachedConferenceSubconferenceIds(payload.event.data.old.conferenceId, (oldIds) =>
                    oldIds.filter((x) => x !== id)
                );
            }
            if (payload.event.data.new) {
                const id = payload.event.data.new.id;
                invalidateCachedSubconference(payload.event.data.new.id);
                updateCachedConferenceSubconferenceIds(payload.event.data.new.conferenceId, (oldIds) => [
                    ...oldIds,
                    id,
                ]);
            }
            break;
    }
}

export async function handleRoomCacheUpdate(payload: Payload<CacheUpdate.RoomData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                if (!payload.event.data.new.subconferenceId) {
                    ConferenceRoomCache.setField(
                        payload.event.data.new.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else {
                    SubconferenceRoomCache.setField(
                        payload.event.data.new.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                }
            }
            break;
        case "UPDATE":
            {
                updateCachedRoom(
                    payload.event.data.new.id,
                    payload.event.data.new.managementModeName,
                    payload.event.data.new.subconferenceId
                );
                if (payload.event.data.old.subconferenceId && !payload.event.data.new.subconferenceId) {
                    SubconferenceRoomCache.deleteField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.old.id
                    );
                    ConferenceRoomCache.setField(
                        payload.event.data.new.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else if (!payload.event.data.old.subconferenceId && payload.event.data.new.subconferenceId) {
                    ConferenceRoomCache.deleteField(payload.event.data.old.conferenceId, payload.event.data.old.id);
                    SubconferenceRoomCache.setField(
                        payload.event.data.new.subconferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else if (payload.event.data.old.subconferenceId) {
                    SubconferenceRoomCache.setField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else {
                    ConferenceRoomCache.setField(
                        payload.event.data.old.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                }
            }
            break;
        case "DELETE":
            {
                if (payload.event.data.old.subconferenceId) {
                    SubconferenceRoomCache.deleteField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.old.id
                    );
                }
                ConferenceRoomCache.deleteField(payload.event.data.old.conferenceId, payload.event.data.old.id);
                invalidateCachedRoom(payload.event.data.old.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                if (payload.event.data.old.subconferenceId) {
                    SubconferenceRoomCache.deleteField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.old.id
                    );
                }
                ConferenceRoomCache.deleteField(payload.event.data.old.conferenceId, payload.event.data.old.id);
                invalidateCachedRoom(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                if (payload.event.data.new.subconferenceId) {
                    SubconferenceRoomCache.deleteField(
                        payload.event.data.new.subconferenceId,
                        payload.event.data.new.id
                    );
                }
                ConferenceRoomCache.deleteField(payload.event.data.new.conferenceId, payload.event.data.new.id);
                invalidateCachedRoom(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleRegistrantCacheUpdate(payload: Payload<CacheUpdate.RegistrantData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const id = payload.event.data.new.id;
                invalidateCachedRegistrant(id);
                if (payload.event.data.new.userId) {
                    const id = payload.event.data.new.id;
                    const conferenceId = payload.event.data.new.conferenceId;
                    updateCachedUserRegistrantIds(payload.event.data.new.userId, (old) => [
                        ...old,
                        {
                            id,
                            conferenceId,
                        },
                    ]);
                }
            }
            break;
        case "UPDATE":
            {
                updateCachedRegistrant(payload.event.data.new.id, payload.event.data.new.conferenceRole);
                const id = payload.event.data.old.id;
                if (payload.event.data.new.userId) {
                    const conferenceId = payload.event.data.new.conferenceId;
                    if (payload.event.data.old.userId !== payload.event.data.new.userId) {
                        if (payload.event.data.old.userId) {
                            updateCachedUserRegistrantIds(payload.event.data.old.userId, (old) =>
                                old.filter((x) => x.id !== id)
                            );
                        }
                        updateCachedUserRegistrantIds(payload.event.data.new.userId, (old) => [
                            ...old,
                            {
                                id,
                                conferenceId,
                            },
                        ]);
                    }
                } else if (payload.event.data.old.userId) {
                    updateCachedUserRegistrantIds(payload.event.data.old.userId, (old) =>
                        old.filter((x) => x.id !== id)
                    );
                }
            }
            break;
        case "DELETE":
            {
                const id = payload.event.data.old.id;
                invalidateCachedRegistrant(id);
                if (payload.event.data.old.userId) {
                    updateCachedUserRegistrantIds(payload.event.data.old.userId, (oldIds) =>
                        oldIds.filter((x) => x.id !== id)
                    );
                }
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const id = payload.event.data.old.id;
                invalidateCachedRegistrant(payload.event.data.old.id);
                if (payload.event.data.old.userId) {
                    updateCachedUserRegistrantIds(payload.event.data.old.userId, (oldIds) =>
                        oldIds.filter((x) => x.id !== id)
                    );
                }
            }
            if (payload.event.data.new) {
                const id = payload.event.data.new.id;
                const conferenceId = payload.event.data.new.conferenceId;
                invalidateCachedRegistrant(payload.event.data.new.id);
                if (payload.event.data.new.userId) {
                    updateCachedUserRegistrantIds(payload.event.data.new.userId, (oldIds) => [
                        ...oldIds,
                        {
                            id,
                            conferenceId,
                        },
                    ]);
                }
            }
            break;
    }
}

export async function handleSubconferenceMembershipCacheUpdate(
    payload: Payload<CacheUpdate.SubconferenceMembershipData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const obj: SubconferenceMembership = {
                    id: payload.event.data.new.id,
                    subconferenceId: payload.event.data.new.subconferenceId,
                    role: payload.event.data.new.role,
                };
                updateCachedRegistrantSubconferenceMemberships(payload.event.data.new.subconferenceId, (old) => [
                    ...old,
                    obj,
                ]);
            }
            break;
        case "UPDATE":
            {
                const id = payload.event.data.new.id;
                const role = payload.event.data.new.role;
                updateCachedRegistrantSubconferenceMemberships(payload.event.data.new.subconferenceId, (old) =>
                    old.map((x) => (x.id === id ? { ...x, role } : x))
                );
            }
            break;
        case "DELETE":
            {
                const id = payload.event.data.old.id;
                updateCachedRegistrantSubconferenceMemberships(payload.event.data.old.subconferenceId, (old) =>
                    old.filter((x) => x.id !== id)
                );
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const id = payload.event.data.old.id;
                updateCachedRegistrantSubconferenceMemberships(payload.event.data.old.subconferenceId, (old) =>
                    old.filter((x) => x.id !== id)
                );
            }
            if (payload.event.data.new) {
                invalidateCachedRegistrant(payload.event.data.new.registrantId);
            }
            break;
    }
}

export async function handleRoomMembershipCacheUpdate(payload: Payload<CacheUpdate.RoomMembershipData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            RoomMembershipCache.setField(
                payload.event.data.new.roomId,
                payload.event.data.new.registrantId,
                payload.event.data.new.personRoleName
            );
            break;
        case "UPDATE":
            RoomMembershipCache.setField(
                payload.event.data.new.roomId,
                payload.event.data.new.registrantId,
                payload.event.data.new.personRoleName
            );
            break;
        case "DELETE":
            RoomMembershipCache.deleteField(payload.event.data.old.roomId, payload.event.data.old.registrantId);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                RoomMembershipCache.deleteField(payload.event.data.old.roomId, payload.event.data.old.registrantId);
            }
            if (payload.event.data.new) {
                RoomMembershipCache.deleteField(payload.event.data.new.roomId, payload.event.data.new.registrantId);
            }
            break;
    }
}

export async function handleUserCacheUpdate(payload: Payload<CacheUpdate.UserData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            invalidateCachedUser(payload.event.data.new.id);
            break;
        case "UPDATE":
            // Do nothing
            break;
        case "DELETE":
            invalidateCachedUser(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                invalidateCachedUser(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                invalidateCachedUser(payload.event.data.new.id);
            }
            break;
    }
}
