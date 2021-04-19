import { emitter } from "../socket-emitter/socket-emitter";
import { Notification } from "../types/chat";
import { sendNotification } from "../web-push/sendNotification";
import { getPushNotificationSubscriptions, PushNotificationSubscriptions } from "./cache/pushNotificationSubscriptions";
import { notificationsRoomName } from "./chat";

export async function sendNotifications(userIds: Set<string>, notification: Notification): Promise<void> {
    const userIdsArr = [...userIds.values()];
    const pushNotifSubs = new Map<string, PushNotificationSubscriptions | undefined>(
        await Promise.all<[string, PushNotificationSubscriptions | undefined]>(
            userIdsArr.map(async (userId) => [
                userId,
                await getPushNotificationSubscriptions(userId, {
                    userId,
                    subscriptions: [],
                }),
            ])
        )
    );

    // Web-socket notifications
    await Promise.all(
        userIdsArr.map(async (userId) => {
            // CHAT_TODO: Choose web-push, web-socket, email or no notification channel

            const pushNotifSub = pushNotifSubs.get(userId);
            if (pushNotifSub?.subscriptions.length) {
                await Promise.all(pushNotifSub.subscriptions.map((sub) => sendNotification(sub, notification)));
            } else {
                emitter.in(notificationsRoomName(userId)).emit("notification", notification);
            }
        })
    );
}
