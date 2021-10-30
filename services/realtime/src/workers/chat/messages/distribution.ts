import { chatCache } from "@midspace/caches/chat";
import { conferenceCache } from "@midspace/caches/conference";
import { chatPinsCache } from "@midspace/caches/pin";
import { readUpToIndicesCache } from "@midspace/caches/readUpToIndex";
import { registrantCache } from "@midspace/caches/registrant";
import type { RoomEntity } from "@midspace/caches/room";
import { roomCache } from "@midspace/caches/room";
import { chatSubscriptionsCache } from "@midspace/caches/subscription";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import { Chat_MessageType_Enum, Room_ManagementMode_Enum } from "../../../generated/graphql";
import { chatListenersKeyName, generateChatRecentMessagesSetKey, generateChatRoomName } from "../../../lib/chat";
import { sendNotifications } from "../../../lib/notifications";
import { maxUnreadMessages, sendUnreadCount } from "../../../lib/unreadCounts";
import { onDistributionMessage } from "../../../rabbitmq/chat/messages";
import { emitter } from "../../../socket-emitter/socket-emitter";
import type { Action, Message } from "../../../types/chat";

console.info("Chat messages distribution worker running");

async function onMessage(action: Action<Message>) {
    const eventName =
        action.op === "INSERT"
            ? "receive"
            : action.op === "UPDATE"
            ? "update"
            : action.op === "DELETE"
            ? "delete"
            : "unknown";

    const chatId = action.data.chatId;

    const client = await redisClientPool.acquire("workers/chat/messages/distribution/onMessage");
    let clientReleased = false;
    try {
        if (
            action.op === "INSERT" &&
            action.data.type !== Chat_MessageType_Enum.DuplicationMarker &&
            action.data.type !== Chat_MessageType_Enum.Emote
        ) {
            const redisSetKey = generateChatRecentMessagesSetKey(chatId);
            await redisClientP.zadd(client)(redisSetKey, Date.parse(action.data.created_at), action.data.sId);
            await redisClientP.zremrangebyrank(client)(redisSetKey, 0, -(1 + maxUnreadMessages));
        } else if (action.op === "DELETE") {
            const redisSetKey = generateChatRecentMessagesSetKey(chatId);
            await redisClientP.zrem(client)(redisSetKey, action.data.sId);
        }

        redisClientPool.release("workers/chat/messages/distribution/onMessage", client);
        clientReleased = true;

        emitter.to(generateChatRoomName(chatId)).emit(`chat.messages.${eventName}`, action.data);

        if (
            action.data.type !== Chat_MessageType_Enum.DuplicationMarker &&
            action.data.type !== Chat_MessageType_Enum.Emote
        ) {
            if (action.op === "INSERT") {
                await new Promise<unknown>((resolve, reject) => {
                    setTimeout(
                        () =>
                            Promise.all([
                                distributeMessageToSubscribedUsers(action),
                                updateRecentMessagesAndUnreadCounts(action),
                            ])
                                .then(resolve)
                                .catch(reject),
                        1500
                    );
                });
            } else if (action.op === "DELETE") {
                await new Promise<unknown>((resolve, reject) => {
                    setTimeout(() => updateRecentMessagesAndUnreadCounts(action).then(resolve).catch(reject), 1500);
                });
            }
        }
    } finally {
        if (!clientReleased) {
            redisClientPool.release("workers/chat/messages/distribution/onMessage", client);
        }
    }
}

async function updateRecentMessagesAndUnreadCounts(action: Action<Message>) {
    const chatId = action.data.chatId;

    const pins = await chatPinsCache.getEntity(chatId);
    if (pins) {
        const infos = await Promise.all(
            Object.keys(pins).map((registrantId) => registrantCache.getEntity(registrantId))
        );
        const senderInfo = infos.find((x) => x?.id === action.data.senderId);
        if (senderInfo?.userId) {
            await readUpToIndicesCache.setField(chatId, senderInfo.userId, action.data.sId);
        }
        const pinnedUserIds = new Set(infos.filter((x) => !!x?.userId).map((x) => x?.userId) as string[]);

        await Promise.all(
            [...pinnedUserIds].map(
                (userId) =>
                    new Promise<void>((resolve, reject) => {
                        setTimeout(() => {
                            sendUnreadCount(chatId, userId).then(resolve).catch(reject);
                        }, Math.random() * 1000);
                    })
            )
        );
    }
}

async function distributeMessageToSubscribedUsers(action: Action<Message>) {
    const chatId = action.data.chatId;

    const subscriptions = await chatSubscriptionsCache.getEntity(chatId);
    if (subscriptions) {
        const client = await redisClientPool.acquire(
            "workers/chat/messages/distribution/distributeMessageToSubscribedUsers"
        );
        let clientReleased = false;
        try {
            const listenerUserIds = (await redisClientP.smembers(client)(chatListenersKeyName(chatId))).map(
                (x) => x.split("¬")[1]
            );

            redisClientPool.release("workers/chat/messages/distribution/distributeMessageToSubscribedUsers", client);
            clientReleased = true;

            const subscribedRegistrantIds = Object.keys(subscriptions).filter((x) => x !== action.data.senderId);
            const subscribedUserIds = new Set(
                (
                    await Promise.all(
                        subscribedRegistrantIds.map((registrantId) => registrantCache.getEntity(registrantId))
                    )
                )
                    .filter((x) => !!x?.userId && !listenerUserIds.includes(x.userId))
                    .map((x) => x?.userId) as string[]
            );

            const chatInfo = await chatCache.getEntity(chatId);
            if (chatInfo) {
                const roomId = chatInfo.roomIds.length > 0 ? chatInfo.roomIds[0] : undefined;
                let registrantDisplayName: string | undefined;
                let room: RoomEntity | undefined;
                if (roomId) {
                    room = await roomCache.getEntity(roomId);
                    registrantDisplayName =
                        (!room || room.managementModeName === Room_ManagementMode_Enum.Dm) && action.data.senderId
                            ? await registrantCache.getField(action.data.senderId, "displayName")
                            : undefined;
                }

                const chatName = room?.name ?? "";
                const conference = await conferenceCache.getEntity(chatInfo.conferenceId);

                if (conference) {
                    sendNotifications(subscribedUserIds, {
                        description: action.data.message,
                        title:
                            (conference?.shortName ? conference.shortName + ": " : "") +
                            `New ${
                                action.data.type === Chat_MessageType_Enum.Message
                                    ? "message"
                                    : action.data.type === Chat_MessageType_Enum.Answer
                                    ? "answer"
                                    : action.data.type === Chat_MessageType_Enum.Question
                                    ? "question"
                                    : action.data.type === Chat_MessageType_Enum.Emote
                                    ? "emote"
                                    : action.data.type === Chat_MessageType_Enum.DuplicationMarker
                                    ? "event"
                                    : "message"
                            }`,
                        chatId,
                        linkURL: `/conference/${conference.slug}/chat/${chatId}`,
                        subtitle: registrantDisplayName ? `from ${registrantDisplayName}` : `in ${chatName}`,
                    });
                }
            }
        } finally {
            if (!clientReleased) {
                redisClientPool.release(
                    "workers/chat/messages/distribution/distributeMessageToSubscribedUsers",
                    client
                );
            }
        }
    }
}

async function Main() {
    onDistributionMessage(onMessage);
}

Main();
