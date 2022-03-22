import { ChatCache } from "@midspace/caches/chat";
import { ConferenceCache } from "@midspace/caches/conference";
import { conferenceRoomsCache } from "@midspace/caches/conferenceRoom";
import { EventCache } from "@midspace/caches/event";
import { chatPinsCache } from "@midspace/caches/pin";
import { PushNotificationSubscriptionsCache } from "@midspace/caches/pushNotificationSubscriptions";
import type { SubconferenceMembership } from "@midspace/caches/registrant";
import { RegistrantCache } from "@midspace/caches/registrant";
import { RoomCache } from "@midspace/caches/room";
import { roomMembershipsCache } from "@midspace/caches/roomMembership";
import { SubconferenceCache } from "@midspace/caches/subconference";
import { subconferenceRoomsCache } from "@midspace/caches/subconferenceRoom";
import { chatSubscriptionsCache } from "@midspace/caches/subscription";
import { UserCache } from "@midspace/caches/user";
import type { P } from "pino";
import type { CacheUpdate } from "../types/hasura/cacheUpdate";
import type { Payload } from "../types/hasura/event";

export async function handleConferenceCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.ConferenceData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await new ConferenceCache(logger).setEntity(newEntity.id, {
                    id: newEntity.id,
                    shortName: newEntity.shortName,
                    createdBy: newEntity.createdBy,
                    slug: newEntity.slug,
                    conferenceVisibilityLevel: newEntity.conferenceVisibilityLevel,
                    subconferenceIds: [],
                    lowestRoleWithAccess: newEntity.lowestRoleWithAccess,
                });
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await new ConferenceCache(logger).updateEntity(newEntity.id, (old) => ({
                    ...old,
                    id: newEntity.id,
                    shortName: newEntity.shortName,
                    createdBy: newEntity.createdBy,
                    slug: newEntity.slug,
                    conferenceVisibilityLevel: newEntity.conferenceVisibilityLevel,
                    lowestRoleWithAccess: newEntity.lowestRoleWithAccess,
                }));
            }
            break;
        case "DELETE":
            await new ConferenceCache(logger).invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await new ConferenceCache(logger).invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await new ConferenceCache(logger).invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleSubconferenceCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.SubconferenceData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await new ConferenceCache(logger).updateEntity(newEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: [...old.subconferenceIds, newEntity.id],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await new SubconferenceCache(logger).updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceVisibilityLevel: newEntity.conferenceVisibilityLevel,
                }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await new SubconferenceCache(logger).invalidateEntity(oldEntity.id);
                await new ConferenceCache(logger).updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await new SubconferenceCache(logger).invalidateEntity(oldEntity.id);
                await new ConferenceCache(logger).updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: old.subconferenceIds.filter((x) => x !== oldEntity.id),
                }));
            }
            if (payload.event.data.new) {
                const oldEntity = payload.event.data.new;
                await new SubconferenceCache(logger).invalidateEntity(oldEntity.id);
                await new ConferenceCache(logger).updateEntity(oldEntity.conferenceId, (old) => ({
                    ...old,
                    subconferenceIds: [...old.subconferenceIds, oldEntity.id],
                }));
            }
            break;
    }
}

export async function handleRoomCacheUpdate(logger: P.Logger, payload: Payload<CacheUpdate.RoomData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                if (!newEntity.subconferenceId) {
                    await conferenceRoomsCache(logger).setField(
                        newEntity.conferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else {
                    await subconferenceRoomsCache(logger).setField(
                        newEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                }

                await new ChatCache(logger).updateEntity(newEntity.chatId, (old) => ({
                    ...old,
                    roomId: newEntity.id,
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                const oldEntity = payload.event.data.old;
                await new RoomCache(logger).updateEntity(newEntity.id, (old) => ({
                    ...old,
                    managementModeName: newEntity.managementModeName,
                    subconferenceId: newEntity.subconferenceId,
                    name: newEntity.name,
                }));
                await new ChatCache(logger).updateEntity(oldEntity.chatId, (old) => ({
                    ...old,
                    roomId: null,
                }));
                await new ChatCache(logger).updateEntity(newEntity.chatId, (old) => ({
                    ...old,
                    roomId: newEntity.id,
                }));
                if (oldEntity.subconferenceId && !newEntity.subconferenceId) {
                    await subconferenceRoomsCache(logger).invalidateField(oldEntity.subconferenceId, oldEntity.id);
                    await conferenceRoomsCache(logger).setField(
                        newEntity.conferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else if (!oldEntity.subconferenceId && newEntity.subconferenceId) {
                    await conferenceRoomsCache(logger).invalidateField(oldEntity.conferenceId, oldEntity.id);
                    await subconferenceRoomsCache(logger).setField(
                        newEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else if (oldEntity.subconferenceId) {
                    await subconferenceRoomsCache(logger).setField(
                        oldEntity.subconferenceId,
                        newEntity.id,
                        newEntity.managementModeName
                    );
                } else {
                    await conferenceRoomsCache(logger).setField(
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
                    await subconferenceRoomsCache(logger).invalidateField(oldEntity.subconferenceId, oldEntity.id);
                }
                await conferenceRoomsCache(logger).invalidateField(oldEntity.conferenceId, oldEntity.id);
                await new RoomCache(logger).invalidateEntity(oldEntity.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                if (payload.event.data.old.subconferenceId) {
                    await subconferenceRoomsCache(logger).invalidateField(
                        payload.event.data.old.subconferenceId,
                        payload.event.data.old.id
                    );
                }
                await conferenceRoomsCache(logger).invalidateField(
                    payload.event.data.old.conferenceId,
                    payload.event.data.old.id
                );
                await new RoomCache(logger).invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                if (payload.event.data.new.subconferenceId) {
                    await subconferenceRoomsCache(logger).setField(
                        payload.event.data.new.subconferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                } else {
                    await conferenceRoomsCache(logger).setField(
                        payload.event.data.new.conferenceId,
                        payload.event.data.new.id,
                        payload.event.data.new.managementModeName
                    );
                }
                await new RoomCache(logger).invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleRegistrantCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.RegistrantData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                if (newEntity.userId) {
                    const id = newEntity.id;
                    const conferenceId = newEntity.conferenceId;
                    await new UserCache(logger).updateEntity(newEntity.userId, (old) => ({
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

                await new RegistrantCache(logger).updateEntity(newEntity.id, (old) => ({
                    ...old,
                    conferenceRole: newEntity.conferenceRole,
                    displayName: newEntity.displayName,
                    userId: newEntity.userId,
                }));
                if (newEntity.userId) {
                    const conferenceId = newEntity.conferenceId;
                    if (oldEntity.userId !== newEntity.userId) {
                        if (oldEntity.userId) {
                            await new UserCache(logger).updateEntity(oldEntity.userId, (old) => ({
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
                            await new UserCache(logger).updateEntity(newEntity.userId, (old) => ({
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
                    await new UserCache(logger).updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "DELETE":
            {
                const id = payload.event.data.old.id;
                await new RegistrantCache(logger).invalidateEntity(id);
                if (payload.event.data.old.userId) {
                    await new UserCache(logger).updateEntity(payload.event.data.old.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== id),
                    }));
                }
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await new RegistrantCache(logger).invalidateEntity(oldEntity.id);
                if (oldEntity.userId) {
                    await new UserCache(logger).updateEntity(oldEntity.userId, (old) => ({
                        ...old,
                        registrants: old.registrants.filter((x) => x.id !== oldEntity.id),
                    }));
                }
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                const id = newEntity.id;
                const conferenceId = newEntity.conferenceId;
                await new RegistrantCache(logger).invalidateEntity(newEntity.id);
                if (newEntity.userId) {
                    await new UserCache(logger).updateEntity(newEntity.userId, (old) => ({
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
    logger: P.Logger,
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
                await new RegistrantCache(logger).updateEntity(newEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: [...old.subconferenceMemberships, obj],
                }));
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await new RegistrantCache(logger).updateEntity(newEntity.registrantId, (old) => ({
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
                await new RegistrantCache(logger).updateEntity(oldEntity.registrantId, (old) => ({
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
                await new RegistrantCache(logger).updateEntity(oldEntity.registrantId, (old) => ({
                    ...old,
                    subconferenceMemberships: old.subconferenceMemberships.filter(
                        (x) => x.subconferenceId !== oldEntity.subconferenceId
                    ),
                }));
            }
            if (payload.event.data.new) {
                await new RegistrantCache(logger).invalidateEntity(payload.event.data.new.registrantId);
            }
            break;
    }
}

export async function handleRoomMembershipCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.RoomMembershipData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await roomMembershipsCache(logger).setField(
                    newEntity.roomId,
                    newEntity.registrantId,
                    newEntity.personRoleName
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await roomMembershipsCache(logger).setField(
                    newEntity.roomId,
                    newEntity.registrantId,
                    newEntity.personRoleName
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await roomMembershipsCache(logger).invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await roomMembershipsCache(logger).invalidateField(oldEntity.roomId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await roomMembershipsCache(logger).invalidateField(newEntity.roomId, newEntity.registrantId);
            }
            break;
    }
}

export async function handleUserCacheUpdate(logger: P.Logger, payload: Payload<CacheUpdate.UserData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // Do nothing
            break;
        case "UPDATE":
            // Do nothing
            break;
        case "DELETE":
            await new UserCache(logger).invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await new UserCache(logger).invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await new UserCache(logger).invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handleEventCacheUpdate(logger: P.Logger, payload: Payload<CacheUpdate.EventData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // Do nothing
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await new EventCache(logger).updateEntity(newEntity.id, (old) => ({
                    ...old,
                    ...newEntity,
                }));
            }
            break;
        case "DELETE":
            await new EventCache(logger).invalidateEntity(payload.event.data.old.id);
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                await new EventCache(logger).invalidateEntity(payload.event.data.old.id);
            }
            if (payload.event.data.new) {
                await new EventCache(logger).invalidateEntity(payload.event.data.new.id);
            }
            break;
    }
}

export async function handlePushNotificationSubscriptionCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.PushNotificationSubscriptionData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await new PushNotificationSubscriptionsCache(logger).updateEntity(
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
                await new PushNotificationSubscriptionsCache(logger).updateEntity(
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
                await new PushNotificationSubscriptionsCache(logger).updateEntity(oldEntity.userId, (old) => ({
                    ...old,
                    subscriptions: old.subscriptions.filter((x) => x.endpoint !== oldEntity.endpoint),
                }));
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await new PushNotificationSubscriptionsCache(logger).updateEntity(oldEntity.userId, (old) => ({
                    ...old,
                    subscriptions: old.subscriptions.filter((x) => x.endpoint !== oldEntity.endpoint),
                }));
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await new PushNotificationSubscriptionsCache(logger).updateEntity(
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

export async function handleChatCacheUpdate(logger: P.Logger, payload: Payload<CacheUpdate.ChatData>): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            // Do nothing
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await new ChatCache(logger).updateEntity(newEntity.id, (old) => ({ ...old, ...newEntity }));
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await new ChatCache(logger).invalidateEntity(oldEntity.id);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await new ChatCache(logger).invalidateEntity(oldEntity.id);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await new ChatCache(logger).invalidateEntity(newEntity.id);
            }
            break;
    }
}

export async function handleContentItemCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.ContentItemData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                if (newEntity.chatId) {
                    await new ChatCache(logger).updateEntity(newEntity.chatId, (old) => ({
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
                    await new ChatCache(logger).updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemId: old.itemId === oldEntity.id ? null : old.itemId,
                    }));
                }
                if (newEntity.chatId) {
                    await new ChatCache(logger).updateEntity(newEntity.chatId, (old) => ({
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
                    await new ChatCache(logger).updateEntity(oldEntity.chatId, (old) => ({
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
                    await new ChatCache(logger).updateEntity(oldEntity.chatId, (old) => ({
                        ...old,
                        itemId: old.itemId === oldEntity.id ? null : old.itemId,
                    }));
                }
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                if (newEntity.chatId) {
                    await new ChatCache(logger).updateEntity(newEntity.chatId, (old) => ({
                        ...old,
                        itemId: newEntity.id,
                    }));
                }
            }
            break;
    }
}

export async function handleChatPinCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.ChatPinData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await chatPinsCache(logger).setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await chatPinsCache(logger).setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await chatPinsCache(logger).invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await chatPinsCache(logger).invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await chatPinsCache(logger).setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallyPinned ? "true" : "false"
                );
            }
            break;
    }
}

export async function handleChatSubscriptionCacheUpdate(
    logger: P.Logger,
    payload: Payload<CacheUpdate.ChatSubscriptionData>
): Promise<void> {
    switch (payload.event.op) {
        case "INSERT":
            {
                const newEntity = payload.event.data.new;
                await chatSubscriptionsCache(logger).setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
        case "UPDATE":
            {
                const newEntity = payload.event.data.new;
                await chatSubscriptionsCache(logger).setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
        case "DELETE":
            {
                const oldEntity = payload.event.data.old;
                await chatSubscriptionsCache(logger).invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            break;
        case "MANUAL":
            if (payload.event.data.old) {
                const oldEntity = payload.event.data.old;
                await chatSubscriptionsCache(logger).invalidateField(oldEntity.chatId, oldEntity.registrantId);
            }
            if (payload.event.data.new) {
                const newEntity = payload.event.data.new;
                await chatSubscriptionsCache(logger).setField(
                    newEntity.chatId,
                    newEntity.registrantId,
                    newEntity.wasManuallySubscribed ? "true" : "false"
                );
            }
            break;
    }
}
