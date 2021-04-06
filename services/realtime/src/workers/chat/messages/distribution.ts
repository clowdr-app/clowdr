import { getAttendeeInfo } from "../../../lib/cache/attendeeInfo";
import { getSubscriptions } from "../../../lib/cache/subscription";
import { chatListenersKeyName, generateRoomName } from "../../../lib/chat";
import { sendNotifications } from "../../../lib/notifications";
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
    emitter.to(generateRoomName(chatId)).emit(`chat.messages.${eventName}`, JSON.stringify(action.data));

    if (action.op === "INSERT") {
        const subscriptions = await getSubscriptions(chatId, {
            chatId,
            attendeeIds: [],
        });
        if (subscriptions) {
            const listenerUserIds = (await redisClientP.smembers(chatListenersKeyName(chatId))).map(
                (x) => x.split("¬")[1]
            );
            const subscribedAttendeeIds = subscriptions.attendeeIds.filter((x) => x !== action.data.senderId);
            const subscribedUserIds = (
                await Promise.all(
                    subscribedAttendeeIds.map((attendeeId) =>
                        getAttendeeInfo(attendeeId, {
                            displayName: "unknown",
                        })
                    )
                )
            )
                .filter((x) => !!x?.userId && !listenerUserIds.includes(x.userId))
                .map((x) => x?.userId) as string[];
            sendNotifications(subscribedUserIds, action.data);
        }
    }
}

async function Main() {
    onDistributionMessage(onMessage);
}

Main();
