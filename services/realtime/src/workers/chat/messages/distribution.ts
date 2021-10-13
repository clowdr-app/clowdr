import { Chat_MessageType_Enum, Room_ManagementMode_Enum } from "../../../generated/graphql";
import { getChatInfo } from "../../../lib/cache/chatInfo";
import { getPins } from "../../../lib/cache/pin";
import { setReadUpToIndex } from "../../../lib/cache/readUpToIndex";
import { getRegistrantInfo } from "../../../lib/cache/registrantInfo";
import { getSubscriptions } from "../../../lib/cache/subscription";
import { chatListenersKeyName, generateChatRecentMessagesSetKey, generateChatRoomName } from "../../../lib/chat";
import { sendNotifications } from "../../../lib/notifications";
import { maxUnreadMessages, sendUnreadCount } from "../../../lib/unreadCounts";
import { onDistributionMessage } from "../../../rabbitmq/chat/messages";
import { redisClientP, redisClientPool } from "../../../redis";
import { emitter } from "../../../socket-emitter/socket-emitter";
import { Action, Message } from "../../../types/chat";

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

    const pins = await getPins(chatId, {
        chatId,
        registrantIds: [],
    });
    if (pins) {
        // const listenerUserIds = (await redisClientP.smembers(chatListenersKeyName(chatId))).map((x) => x.split("¬")[1]);
        const infos = await Promise.all(
            pins.registrantIds.map((registrantId) =>
                getRegistrantInfo(registrantId, {
                    displayName: "unknown",
                })
            )
        );
        const senderInfo = infos.find((x) => !!x?.userId && x.id === action.data.senderId);
        if (senderInfo?.userId) {
            await setReadUpToIndex(chatId, senderInfo.userId, action.data.sId);
        }
        const pinnedUserIds = new Set(
            infos
                .filter(
                    (x) =>
                        !!x?.userId /* TODO: Do we need this performance filter: && !listenerUserIds.includes(x.userId) */
                )
                .map((x) => x?.userId) as string[]
        );

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

    const subscriptions = await getSubscriptions(chatId, {
        chatId,
        registrantIds: [],
    });
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

            const subscribedRegistrantIds = subscriptions.registrantIds.filter((x) => x !== action.data.senderId);
            const subscribedUserIds = new Set(
                (
                    await Promise.all(
                        subscribedRegistrantIds.map((registrantId) =>
                            getRegistrantInfo(registrantId, {
                                displayName: "unknown",
                            })
                        )
                    )
                )
                    .filter((x) => !!x?.userId && !listenerUserIds.includes(x.userId))
                    .map((x) => x?.userId) as string[]
            );

            const chatInfo = await getChatInfo(chatId, {
                conference: {
                    id: "distribution.onMessage:unknown-conference-id",
                    slug: "distribution.onMessage:unknown-conference-slug",
                },
                items: [],
                restrictToAdmins: false,
                rooms: [],
            });
            if (chatInfo) {
                const room = chatInfo.rooms.length > 0 ? chatInfo.rooms[0] : undefined;
                const registrantInfo =
                    room?.managementMode === Room_ManagementMode_Enum.Dm && action.data.senderId
                        ? await getRegistrantInfo(action.data.senderId, {
                              displayName: "distribution.onMessage:unknown-registrant-displayName",
                          })
                        : undefined;

                const chatName =
                    chatInfo.items && chatInfo.items.length > 0
                        ? chatInfo.items && chatInfo.items[0].title
                        : room?.name ?? "Unknown chat";

                sendNotifications(subscribedUserIds, {
                    description: action.data.message,
                    title:
                        (chatInfo.conference.shortName ? chatInfo.conference.shortName + ": " : "") +
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
                    linkURL: `/conference/${chatInfo.conference.slug}/chat/${chatId}`,
                    subtitle: registrantInfo ? `from ${registrantInfo.displayName}` : `in ${chatName}`,
                });
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
