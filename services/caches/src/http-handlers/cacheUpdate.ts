import { chatCache } from "@midspace/caches/chat";
import { conferenceCache } from "@midspace/caches/conference";
import { conferenceRoomsCache } from "@midspace/caches/conferenceRoom";
import { eventCache } from "@midspace/caches/event";
import { chatPinsCache } from "@midspace/caches/pin";
import { pushNotificationSubscriptionsCache } from "@midspace/caches/pushNotificationSubscriptions";
import type { SubconferenceMembership } from "@midspace/caches/registrant";
import { registrantCache } from "@midspace/caches/registrant";
import { roomCache } from "@midspace/caches/room";
import { roomMembershipsCache } from "@midspace/caches/roomMembership";
import { subconferenceCache } from "@midspace/caches/subconference";
import { subconferenceRoomsCache } from "@midspace/caches/subconferenceRoom";
import { chatSubscriptionsCache } from "@midspace/caches/subscription";
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
                await conferenceCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    ...newEntity,
                }));
            }
            break;
        case "DELETE":
            await conferenceCache.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await conferenceCache.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await conferenceCache.invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleSubconferenceCacheUpdate(payload: Payload<CacheUpdate.SubconferenceData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await conferenceCache.updateEntity(newEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: [...old.subconferenceIds, newEntity.id],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await subconferenceCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceVisibilityLevel: newEntity.conferenceVisibilityLevel,
                }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await subconferenceCache.invalidateEntity(oldEntity.id);
                await conferenceCache.updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await subconferenceCache.invalidateEntity(oldEntity.id);
                await conferenceCache.updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            if (payload.event.data.new) {
                const oldEntity = payload.event.data.new;
                await subconferenceCache.invalidateEntity(oldEntity.id);
                await conferenceCache.updateEntity(oldEntity.conferenceId, (old) => ({
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
                    await conferenceRoomsCache.setField(
                        newEntity.conferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else {
                    await subconferenceRoomsCache.setField(
                        newEntity.conferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                }

                await chatCache.updateEntity(newEntity.chatId, (old) => ({
                    ...old,
                    roomIds: [...old.roomIds, newEntity.id],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                const oldEntity = payload.event.data.old;
                await roomCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    managementModeName: newEntity.managementModeName,
                    subconferenceId: newEntity.subconferenceId,
                    name: newEntity.name,
                }));
                await chatCache.updateEntity(oldEntity.chatId, (old) => ({
                    ...old,
                    roomIds: old.roomIds.filter((x) => x !== oldEntity.chatId),
                }));
                await chatCache.updateEntity(newEntity.chatId, (old) => ({
                    ...old,
                    roomIds: [...old.roomIds.filter((x) => x !== oldEntity.chatId), newEntity.id],
                }));
                if (oldEntity.subconferenceId && !newEntity.subconferenceId) {
                    await subconferenceRoomsCache.invalidateField(oldEntity.subconferenceId, oldEntity.id);
                    await conferenceRoomsCache.setField(
                        newEntity.conferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else if (!oldEntity.subconferenceId && newEntity.subconferenceId) {
                    await conferenceRoomsCache.invalidateField(oldEntity.conferenceId, oldEntity.id);
                    await subconferenceRoomsCache.setField(
                        newEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else if (oldEntity.subconferenceId) {
                    await subconferenceRoomsCache.setField(
                        oldEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else {
                    await conferenceRoomsCache.setField(
                        oldEntity.conferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                }
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                if (oldEntity.subconferenceId) {
                    await subconferenceRoomsCache.invalidateField(oldEntity.subconferenceId, oldEntity.id);
                }
                await conferenceRoomsCache.invalidateField(oldEntity.conferenceId, oldEntity.id);
                await roomCache.invalidateEntity(oldEntity.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                if (payload.event.data.old.subconferenceId) {
                    await subconferenceRoomsCache.invalidateField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.old.id
                    );
                }
                await conferenceRoomsCache.invalidateField(
                    payload.event.data.old.conferenceId,
                    payload.event.data.old.id
                );
                await roomCache.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                if (payload.event.data.new.subconferenceId) {
                    await subconferenceRoomsCache.setField(
                        payload.event.data.new.subconferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else {
                    await conferenceRoomsCache.setField(
                        payload.event.data.new.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                }
                await roomCache.invalidateEntity(payload.event.data.new.id);
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
                    await userCache.updateEntity(newEntity.userId, (old) => ({
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

                await registrantCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceRole: newEntity.conferenceRole,
                    displayName: newEntity.displayName,
                    userId: newEntity.userId,
                }));
                if (newEntity.userId) {
                    const conferenceId = newEntity.conferenceId;
                    if (oldEntity.userId !== newEntity.userId) {
                        if (oldEntity.userId) {
                            await userCache.updateEntity(oldEntity.userId, (old) => ({
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
                            await userCache.updateEntity(newEntity.userId, (old) => ({
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
                    await userCache.updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "DELETE":
            {
                const id = payload.event.data.old.id;
                await registrantCache.invalidateEntity(id);
                if (payload.event.data.old.userId) {
                    await userCache.updateEntity(payload.event.data.old.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await registrantCache.invalidateEntity(oldEntity.id);
                if (oldEntity.userId) {
                    await userCache.updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== oldEntity.id),
                    }));
                }
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                const id = newEntity.id;
                const conferenceId = newEntity.conferenceId;
                await registrantCache.invalidateEntity(newEntity.id);
                if (newEntity.userId) {
                    await userCache.updateEntity(newEntity.userId, (old) => ({
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
                await registrantCache.updateEntity(newEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: [...old.subconferenceMemberships, obj],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await registrantCache.updateEntity(newEntity.registrantId, (old) => ({
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
                await registrantCache.updateEntity(oldEntity.registrantId, (old) => ({
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
                await registrantCache.updateEntity(oldEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: old.subconferenceMemberships.filter(
                        (x) => x.subconferenceId !== oldEntity.subconferenceId
                    ),
                }));
            }
            if (payload.event.data.new) {
                await registrantCache.invalidateEntity(payload.event.data.new.registrantId);
            }
            break;
    }
}

export async function handleRoomMembershipCacheUpdate(payload: Payload<CacheUpdate.RoomMembershipData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await roomMembershipsCache.setField(newEntity.roomId, newEntity.registrantId, newEntity.personRoleName);
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await roomMembershipsCache.setField(newEntity.roomId, newEntity.registrantId, newEntity.personRoleName);
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await roomMembershipsCache.invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await roomMembershipsCache.invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await roomMembershipsCache.invalidateField(newEntity.roomId, newEntity.registrantId);
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
            await userCache.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await userCache.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await userCache.invalidateEntity(payload.event.data.new.id);
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
                await eventCache.updateEntity(newEntity.id, (old) => ({
                    ...old,
                    ...newEntity,
                }));
            }
            break;
        case "DELETE":
            await eventCache.invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await eventCache.invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await eventCache.invalidateEntity(payload.event.data.new.id);
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
                await pushNotificationSubscriptionsCache.updateEntity(
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
                await pushNotificationSubscriptionsCache.updateEntity(
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
                await pushNotificationSubscriptionsCache.updateEntity(oldEntity.userId, (old) => ({
                    ...old,
                    subscriptions: old.subscriptions.filter((x) => x.endpoint !== oldEntity.endpoint),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await pushNotificationSubscriptionsCache.updateEntity(oldEntity.userId, (old) => ({
                    ...old,
                    subscriptions: old.subscriptions.filter((x) => x.endpoint !== oldEntity.endpoint),
                }));
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await pushNotificationSubscriptionsCache.updateEntity(
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
                await chatCache.updateEntity(newEntity.id, (old) => ({ ...old, ...newEntity }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await chatCache.invalidateEntity(oldEntity.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await chatCache.invalidateEntity(oldEntity.id);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await chatCache.invalidateEntity(newEntity.id);
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
                    await chatCache.updateEntity(newEntity.chatId, (old) => ({
                        ...old,
                        itemIds: [...old.itemIds, newEntity.id],
                    }));
                }
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                const oldEntity = payload.event.data.old;
                if (oldEntity.chatId) {
                    await chatCache.updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemIds: old.itemIds.filter((x) => x !== oldEntity.id),
                    }));
                }
                if (newEntity.chatId) {
                    await chatCache.updateEntity(newEntity.chatId, (old) => ({
                        ...old,
                        itemIds: [...old.itemIds, newEntity.id],
                    }));
                }
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                if (oldEntity.chatId) {
                    await chatCache.updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemIds: old.itemIds.filter((x) => x !== oldEntity.id),
                    }));
                }
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                if (oldEntity.chatId) {
                    await chatCache.updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemIds: old.itemIds.filter((x) => x !== oldEntity.id),
                    }));
                }
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                if (newEntity.chatId) {
                    await chatCache.updateEntity(newEntity.chatId, (old) => ({
                        ...old,
                        itemIds: [...old.itemIds, newEntity.id],
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
                await chatPinsCache.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await chatPinsCache.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await chatPinsCache.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await chatPinsCache.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await chatPinsCache.setField(
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
                await chatSubscriptionsCache.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await chatSubscriptionsCache.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await chatSubscriptionsCache.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await chatSubscriptionsCache.invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await chatSubscriptionsCache.setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
    }
}
