import { Chat_MessageType_Enum, RoomPrivacy_Enum } from "../../../generated/graphql";
import { getAttendeeInfo } from "../../../lib/cache/attendeeInfo";
import { getChatInfo } from "../../../lib/cache/chatInfo";
import { getPins } from "../../../lib/cache/pin";
import { setReadUpToIndex } from "../../../lib/cache/readUpToIndex";
import { getSubscriptions } from "../../../lib/cache/subscription";
import { chatListenersKeyName, generateChatRecentMessagesSetKey, generateChatRoomName } from "../../../lib/chat";
import { sendNotifications } from "../../../lib/notifications";
import { maxUnreadMessages, sendUnreadCount } from "../../../lib/unreadCounts";
import { onDistributionMessage } from "../../../rabbitmq/chat/messages";
import { redisClientP } from "../../../redis";
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

    const redisSetKey = generateChatRecentMessagesSetKey(chatId);
    await redisClientP.zadd(redisSetKey, Date.parse(action.data.created_at), action.data.sId);
    await redisClientP.zremrangebyrank(redisSetKey, 0, -(1 + maxUnreadMessages));

    emitter.to(generateChatRoomName(chatId)).emit(`chat.messages.${eventName}`, action.data);

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
    }
}

async function updateRecentMessagesAndUnreadCounts(action: Action<Message>) {
    const chatId = action.data.chatId;

    const pins = await getPins(chatId, {
        chatId,
        attendeeIds: [],
    });
    if (pins) {
        const listenerUserIds = (await redisClientP.smembers(chatListenersKeyName(chatId))).map((x) => x.split("¬")[1]);
        const infos = await Promise.all(
            pins.attendeeIds.map((attendeeId) =>
                getAttendeeInfo(attendeeId, {
                    displayName: "unknown",
                })
            )
        );
        const senderInfo = infos.find((x) => !!x?.userId && x.id === action.data.senderId);
        if (senderInfo?.userId) {
            await setReadUpToIndex(chatId, senderInfo.userId, action.data.sId);
        }
        const pinnedUserIds = new Set(
            infos.filter((x) => !!x?.userId && !listenerUserIds.includes(x.userId)).map((x) => x?.userId) as string[]
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
        attendeeIds: [],
    });
    if (subscriptions) {
        const listenerUserIds = (await redisClientP.smembers(chatListenersKeyName(chatId))).map((x) => x.split("¬")[1]);
        const subscribedAttendeeIds = subscriptions.attendeeIds.filter((x) => x !== action.data.senderId);
        const subscribedUserIds = new Set(
            (
                await Promise.all(
                    subscribedAttendeeIds.map((attendeeId) =>
                        getAttendeeInfo(attendeeId, {
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
            contentGroups: [],
            restrictToAdmins: false,
            rooms: [],
        });
        if (chatInfo) {
            const room = chatInfo.rooms.length > 0 ? chatInfo.rooms[0] : undefined;
            const attendeeInfo =
                room?.privacy === RoomPrivacy_Enum.Dm && action.data.senderId
                    ? await getAttendeeInfo(action.data.senderId, {
                          displayName: "distribution.onMessage:unknown-attendee-displayName",
                      })
                    : undefined;

            const chatName =
                chatInfo.contentGroups && chatInfo.contentGroups.length > 0
                    ? chatInfo.contentGroups && chatInfo.contentGroups[0].title
                    : room?.name ?? "Unknown chat";

            sendNotifications(subscribedUserIds, {
                description: action.data.message,
                title: `New ${
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
                subtitle: attendeeInfo ? `from ${attendeeInfo.displayName}` : `in ${chatName}`,
            });
        }
    }
}

async function Main() {
    onDistributionMessage(onMessage);
}

Main();
