import type { SubconferenceMembership } from "@midspace/caches/registrant";
import { caches } from "../lib/caches";
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
                await (
                    await caches
                ).conference.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    ...newEntity,
                }));
            }
            break;
        case "DELETE":
            await (await caches).conference.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await (await caches).conference.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await (await caches).conference.invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleSubconferenceCacheUpdate(payload: Payload<CacheUpdate.SubconferenceData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).conference.updateEntity(newEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: [...old.subconferenceIds, newEntity.id],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).subconference.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceVisibilityLevel: newEntity.conferenceVisibilityLevel,
                }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await (await caches).subconference.invalidateEntity(oldEntity.id);
                await (
                    await caches
                ).conference.updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await (await caches).subconference.invalidateEntity(oldEntity.id);
                await (
                    await caches
                ).conference.updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            if (payload.event.data.new) {
                const oldEntity = payload.event.data.new;
                await (await caches).subconference.invalidateEntity(oldEntity.id);
                await (
                    await caches
                ).conference.updateEntity(oldEntity.conferenceId, (old) => ({
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
                    await (
                        await caches
                    ).conferenceRooms.setField(newEntity.conferenceId, newEntity.id, newEntity.managementModeName);
                } else {
                    await (
                        await caches
                    ).subconferenceRooms.setField(newEntity.conferenceId, newEntity.id, newEntity.managementModeName);
                }

                await (
                    await caches
                ).chat.updateEntity(newEntity.chatId, (old) => ({
                    ...old,
                    roomId: newEntity.id,
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                const oldEntity = payload.event.data.old;
                await (
                    await caches
                ).room.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    managementModeName: newEntity.managementModeName,
                    subconferenceId: newEntity.subconferenceId,
                    name: newEntity.name,
                }));
                await (
                    await caches
                ).chat.updateEntity(oldEntity.chatId, (old) => ({
                    ...old,
                    roomId: null,
                }));
                await (
                    await caches
                ).chat.updateEntity(newEntity.chatId, (old) => ({
                    ...old,
                    roomId: newEntity.id,
                }));
                if (oldEntity.subconferenceId && !newEntity.subconferenceId) {
                    await (await caches).subconferenceRooms.invalidateField(oldEntity.subconferenceId, oldEntity.id);
                    await (
                        await caches
                    ).conferenceRooms.setField(newEntity.conferenceId, newEntity.id, newEntity.managementModeName);
                } else if (!oldEntity.subconferenceId && newEntity.subconferenceId) {
                    await (await caches).conferenceRooms.invalidateField(oldEntity.conferenceId, oldEntity.id);
                    await (
                        await caches
                    ).subconferenceRooms.setField(
                        newEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else if (oldEntity.subconferenceId) {
                    await (
                        await caches
                    ).subconferenceRooms.setField(
                        oldEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else {
                    await (
                        await caches
                    ).conferenceRooms.setField(oldEntity.conferenceId, newEntity.id, newEntity.managementModeName);
                }
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                if (oldEntity.subconferenceId) {
                    await (await caches).subconferenceRooms.invalidateField(oldEntity.subconferenceId, oldEntity.id);
                }
                await (await caches).conferenceRooms.invalidateField(oldEntity.conferenceId, oldEntity.id);
                await (await caches).room.invalidateEntity(oldEntity.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                if (payload.event.data.old.subconferenceId) {
                    await (
                        await caches
                    ).subconferenceRooms.invalidateField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.old.id
                    );
                }
                await (
                    await caches
                ).conferenceRooms.invalidateField(payload.event.data.old.conferenceId, payload.event.data.old.id);
                await (await caches).room.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                if (payload.event.data.new.subconferenceId) {
                    await (
                        await caches
                    ).subconferenceRooms.setField(
                        payload.event.data.new.subconferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else {
                    await (
                        await caches
                    ).conferenceRooms.setField(
                        payload.event.data.new.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                }
                await (await caches).room.invalidateEntity(payload.event.data.new.id);
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
                    await (
                        await caches
                    ).user.updateEntity(newEntity.userId, (old) => ({
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

                await (
                    await caches
                ).registrant.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceRole: newEntity.conferenceRole,
                    displayName: newEntity.displayName,
                    userId: newEntity.userId,
                }));
                if (newEntity.userId) {
                    const conferenceId = newEntity.conferenceId;
                    if (oldEntity.userId !== newEntity.userId) {
                        if (oldEntity.userId) {
                            await (
                                await caches
                            ).user.updateEntity(oldEntity.userId, (old) => ({
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
                            await (
                                await caches
                            ).user.updateEntity(newEntity.userId, (old) => ({
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
                    await (
                        await caches
                    ).user.updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "DELETE":
            {
                const id = payload.event.data.old.id;
                await (await caches).registrant.invalidateEntity(id);
                if (payload.event.data.old.userId) {
                    await (
                        await caches
                    ).user.updateEntity(payload.event.data.old.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await (await caches).registrant.invalidateEntity(oldEntity.id);
                if (oldEntity.userId) {
                    await (
                        await caches
                    ).user.updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== oldEntity.id),
                    }));
                }
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                const id = newEntity.id;
                const conferenceId = newEntity.conferenceId;
                await (await caches).registrant.invalidateEntity(newEntity.id);
                if (newEntity.userId) {
                    await (
                        await caches
                    ).user.updateEntity(newEntity.userId, (old) => ({
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
                await (
                    await caches
                ).registrant.updateEntity(newEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: [...old.subconferenceMemberships, obj],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).registrant.updateEntity(newEntity.registrantId, (old) => ({
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
                await (
                    await caches
                ).registrant.updateEntity(oldEntity.registrantId, (old) => ({
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
                await (
                    await caches
                ).registrant.updateEntity(oldEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: old.subconferenceMemberships.filter(
                        (x) => x.subconferenceId !== oldEntity.subconferenceId
                    ),
                }));
            }
            if (payload.event.data.new) {
                await (await caches).registrant.invalidateEntity(payload.event.data.new.registrantId);
            }
            break;
    }
}

export async function handleRoomMembershipCacheUpdate(payload: Payload<CacheUpdate.RoomMembershipData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).roomMemberships.setField(newEntity.roomId, newEntity.registrantId, newEntity.personRoleName);
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).roomMemberships.setField(newEntity.roomId, newEntity.registrantId, newEntity.personRoleName);
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await (await caches).roomMemberships.invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await (await caches).roomMemberships.invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await (await caches).roomMemberships.invalidateField(newEntity.roomId, newEntity.registrantId);
            }
            break;
    }
}

export async function handleUserCacheUpdate(payload: Payload<CacheUpdate.UserData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // Do nothing
            break;
        case "UPDATE":
            // Do nothing
            break;
        case "DELETE":
            await (await caches).user.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await (await caches).user.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await (await caches).user.invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleEventCacheUpdate(payload: Payload<CacheUpdate.EventData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // Do nothing
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).event.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    ...newEntity,
                }));
            }
            break;
        case "DELETE":
            await (await caches).event.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await (await caches).event.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await (await caches).event.invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handlePushNotificationSubscriptionCacheUpdate(
    payload: Payload<CacheUpdate.PushNotificationSubscriptionData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).pushNotificationSubscriptions.updateEntity(
                    newEntity.userId,
                    (old) => ({
                        userId: newEntity.userId,
                        subscriptions: [
                            ...old.subscriptions,
                            {
                                endpoint: newEntity.endpoint,
                                keys: {
                                    auth: newEntity.auth,
                                    p256dh: newEntity.p256dh,
                                },
                            },
                        ],
                    }),
                    true
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).pushNotificationSubscriptions.updateEntity(
                    newEntity.userId,
                    (old) => ({
                        userId: newEntity.userId,
                        subscriptions: [
                            ...old.subscriptions,
                            {
                                endpoint: newEntity.endpoint,
                                keys: {
                                    auth: newEntity.auth,
                                    p256dh: newEntity.p256dh,
                                },
                            },
                        ],
                    }),
                    true
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await (
                    await caches
                ).pushNotificationSubscriptions.updateEntity(oldEntity.userId, (old) => ({
                    ...old,
                    subscriptions: old.subscriptions.filter((x) => x.endpoint !== oldEntity.endpoint),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await (
                    await caches
                ).pushNotificationSubscriptions.updateEntity(oldEntity.userId, (old) => ({
                    ...old,
                    subscriptions: old.subscriptions.filter((x) => x.endpoint !== oldEntity.endpoint),
                }));
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).pushNotificationSubscriptions.updateEntity(
                    newEntity.userId,
                    (old) => ({
                        userId: newEntity.userId,
                        subscriptions: [
                            ...old.subscriptions,
                            {
                                endpoint: newEntity.endpoint,
                                keys: {
                                    auth: newEntity.auth,
                                    p256dh: newEntity.p256dh,
                                },
                            },
                        ],
                    }),
                    true
                );
            }
            break;
    }
}

export async function handleChatCacheUpdate(payload: Payload<CacheUpdate.ChatData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // Do nothing
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (await caches).chat.updateEntity(newEntity.id, (old) => ({ ...old, ...newEntity }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await (await caches).chat.invalidateEntity(oldEntity.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await (await caches).chat.invalidateEntity(oldEntity.id);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await (await caches).chat.invalidateEntity(newEntity.id);
            }
            break;
    }
}

export async function handleContentItemCacheUpdate(payload: Payload<CacheUpdate.ContentItemData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                if (newEntity.chatId) {
                    await (
                        await caches
                    ).chat.updateEntity(newEntity.chatId, (old) => ({
                        ...old,
                        itemId: newEntity.id,
                    }));
                }
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                const oldEntity = payload.event.data.old;
                if (oldEntity.chatId && oldEntity.chatId !== newEntity.chatId) {
                    await (
                        await caches
                    ).chat.updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemId: old.itemId === oldEntity.id ? null : old.itemId,
                    }));
                }
                if (newEntity.chatId) {
                    await (
                        await caches
                    ).chat.updateEntity(newEntity.chatId, (old) => ({
                        ...old,
                        itemId: newEntity.id,
                    }));
                }
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                if (oldEntity.chatId) {
                    await (
                        await caches
                    ).chat.updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemId: old.itemId === oldEntity.id ? null : old.itemId,
                    }));
                }
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                const newEntity = payload.event.data.new;
                if (oldEntity.chatId && oldEntity.chatId !== newEntity?.chatId) {
                    await (
                        await caches
                    ).chat.updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemId: old.itemId === oldEntity.id ? null : old.itemId,
                    }));
                }
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                if (newEntity.chatId) {
                    await (
                        await caches
                    ).chat.updateEntity(newEntity.chatId, (old) => ({
                        ...old,
                        itemId: newEntity.id,
                    }));
                }
            }
            break;
    }
}

export async function handleChatPinCacheUpdate(payload: Payload<CacheUpdate.ChatPinData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).chatPins.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).chatPins.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await (await caches).chatPins.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await (await caches).chatPins.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).chatPins.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
    }
}

export async function handleChatSubscriptionCacheUpdate(
    payload: Payload<CacheUpdate.ChatSubscriptionData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).chatSubscriptions.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).chatSubscriptions.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await (await caches).chatSubscriptions.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await (await caches).chatSubscriptions.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await (
                    await caches
                ).chatSubscriptions.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
    }
}
