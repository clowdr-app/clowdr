import { conferenceCache } from "@midspace/caches/conference";
import { conferenceRoomsCache } from "@midspace/caches/conferenceRoom";
import type { SubconferenceMembership } from "@midspace/caches/registrant";
import { registrantCache } from "@midspace/caches/registrant";
import { roomCache } from "@midspace/caches/room";
import { roomMembershipsCache } from "@midspace/caches/roomMembership";
import { subconferenceCache } from "@midspace/caches/subconference";
import { subconferenceRoomsCache } from "@midspace/caches/subconferenceRoom";
import { userCache } from "@midspace/caches/user";
import type { CacheUpdate } from "../types/hasura/cacheUpdate";
import type { Payload } from "../types/hasura/event";

export async function handleConferenceCacheUpdate(payload: Payload<CacheUpdate.ConferenceData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // TODO
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                conferenceCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    ...newEntity,
                }));
            }
            break;
        case "DELETE":
            conferenceCache.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                conferenceCache.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                conferenceCache.invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleSubconferenceCacheUpdate(payload: Payload<CacheUpdate.SubconferenceData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                conferenceCache.updateEntity(newEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: [...old.subconferenceIds, newEntity.id],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                subconferenceCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceVisibilityLevel: newEntity.conferenceVisibilityLevel,
                }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                subconferenceCache.invalidateEntity(oldEntity.id);
                conferenceCache.updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                subconferenceCache.invalidateEntity(oldEntity.id);
                conferenceCache.updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            if (payload.event.data.new) {
                const oldEntity = payload.event.data.new;
                subconferenceCache.invalidateEntity(oldEntity.id);
                conferenceCache.updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: [...old.subconferenceIds, oldEntity.id],
                }));
            }
            break;
    }
}

export async function handleRoomCacheUpdate(payload: Payload<CacheUpdate.RoomData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                if (!newEntity.subconferenceId) {
                    conferenceRoomsCache.setField(newEntity.conferenceId, newEntity.id, newEntity.managementModeName);
                } else {
                    subconferenceRoomsCache.setField(
                        newEntity.conferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                }
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                const oldEntity = payload.event.data.old;
                roomCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    managementModeName: newEntity.managementModeName,
                    subconferenceId: newEntity.subconferenceId,
                    name: newEntity.name,
                }));
                if (oldEntity.subconferenceId && !newEntity.subconferenceId) {
                    subconferenceRoomsCache.invalidateField(oldEntity.subconferenceId, oldEntity.id);
                    conferenceRoomsCache.setField(newEntity.conferenceId, newEntity.id, newEntity.managementModeName);
                } else if (!oldEntity.subconferenceId && newEntity.subconferenceId) {
                    conferenceRoomsCache.invalidateField(oldEntity.conferenceId, oldEntity.id);
                    subconferenceRoomsCache.setField(
                        newEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else if (oldEntity.subconferenceId) {
                    subconferenceRoomsCache.setField(
                        oldEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else {
                    conferenceRoomsCache.setField(oldEntity.conferenceId, newEntity.id, newEntity.managementModeName);
                }
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                if (oldEntity.subconferenceId) {
                    subconferenceRoomsCache.invalidateField(oldEntity.subconferenceId, oldEntity.id);
                }
                conferenceRoomsCache.invalidateField(oldEntity.conferenceId, oldEntity.id);
                roomCache.invalidateEntity(oldEntity.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                if (payload.event.data.old.subconferenceId) {
                    subconferenceRoomsCache.invalidateField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.old.id
                    );
                }
                conferenceRoomsCache.invalidateField(payload.event.data.old.conferenceId, payload.event.data.old.id);
                roomCache.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                if (payload.event.data.new.subconferenceId) {
                    subconferenceRoomsCache.setField(
                        payload.event.data.new.subconferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else {
                    conferenceRoomsCache.setField(
                        payload.event.data.new.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                }
                roomCache.invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleRegistrantCacheUpdate(payload: Payload<CacheUpdate.RegistrantData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                if (newEntity.userId) {
                    const id = newEntity.id;
                    const conferenceId = newEntity.conferenceId;
                    userCache.updateEntity(newEntity.userId, (old) => ({
                        ...old,
                        registrants: [
                            ...old.registrants,
                            {
                                id,
                                conferenceId,
                            },
                        ],
                    }));
                }
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                const oldEntity = payload.event.data.old;
                const id = oldEntity.id;

                registrantCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceRole: newEntity.conferenceRole,
                    displayName: newEntity.displayName,
                }));
                if (newEntity.userId) {
                    const conferenceId = newEntity.conferenceId;
                    if (oldEntity.userId !== newEntity.userId) {
                        if (oldEntity.userId) {
                            userCache.updateEntity(oldEntity.userId, (old) => ({
                                ...old,
                                registrants: [
                                    ...old.registrants.filter((x) => x.id !== id),
                                    {
                                        id,
                                        conferenceId,
                                    },
                                ],
                            }));
                        } else {
                            userCache.updateEntity(newEntity.userId, (old) => ({
                                ...old,
                                registrants: [
                                    ...old.registrants,
                                    {
                                        id,
                                        conferenceId,
                                    },
                                ],
                            }));
                        }
                    }
                } else if (oldEntity.userId) {
                    userCache.updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "DELETE":
            {
                const id = payload.event.data.old.id;
                registrantCache.invalidateEntity(id);
                if (payload.event.data.old.userId) {
                    userCache.updateEntity(payload.event.data.old.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                registrantCache.invalidateEntity(oldEntity.id);
                if (oldEntity.userId) {
                    userCache.updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== oldEntity.id),
                    }));
                }
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                const id = newEntity.id;
                const conferenceId = newEntity.conferenceId;
                registrantCache.invalidateEntity(newEntity.id);
                if (newEntity.userId) {
                    userCache.updateEntity(newEntity.userId, (old) => ({
                        ...old,
                        registrants: [
                            ...old.registrants,
                            {
                                id,
                                conferenceId,
                            },
                        ],
                    }));
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
                const newEntity = payload.event.data.new;
                const obj: SubconferenceMembership = {
                    id: newEntity.id,
                    subconferenceId: newEntity.subconferenceId,
                    role: newEntity.role,
                };
                registrantCache.updateEntity(newEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: [...old.subconferenceMemberships, obj],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                registrantCache.updateEntity(newEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: old.subconferenceMemberships.map((x) =>
                        x.subconferenceId === newEntity.subconferenceId ? { ...x, role: newEntity.role } : x
                    ),
                }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                registrantCache.updateEntity(oldEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: old.subconferenceMemberships.filter(
                        (x) => x.subconferenceId !== oldEntity.subconferenceId
                    ),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                registrantCache.updateEntity(oldEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: old.subconferenceMemberships.filter(
                        (x) => x.subconferenceId !== oldEntity.subconferenceId
                    ),
                }));
            }
            if (payload.event.data.new) {
                registrantCache.invalidateEntity(payload.event.data.new.registrantId);
            }
            break;
    }
}

export async function handleRoomMembershipCacheUpdate(payload: Payload<CacheUpdate.RoomMembershipData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                roomMembershipsCache.setField(newEntity.roomId, newEntity.registrantId, newEntity.personRoleName);
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                roomMembershipsCache.setField(newEntity.roomId, newEntity.registrantId, newEntity.personRoleName);
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                roomMembershipsCache.invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                roomMembershipsCache.invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                roomMembershipsCache.invalidateField(newEntity.roomId, newEntity.registrantId);
            }
            break;
    }
}

export async function handleUserCacheUpdate(payload: Payload<CacheUpdate.UserData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // TODO
            break;
        case "UPDATE":
            // Do nothing
            break;
        case "DELETE":
            userCache.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                userCache.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                userCache.invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}
