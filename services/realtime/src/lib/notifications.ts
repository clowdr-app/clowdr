import type { PushNotificationSubscriptionsEntity } from "@midspace/caches/pushNotificationSubscriptions";
import { PushNotificationSubscriptionsCache } from "@midspace/caches/pushNotificationSubscriptions";
import { emitter } from "../socket-emitter/socket-emitter";
import type { Notification } from "../types/chat";
import { sendNotification } from "../web-push/sendNotification";
import { notificationsRoomName } from "./chat";
import { logger } from "./logger";

export async function sendNotifications(userIds: Set<string>, notification: Notification): Promise<void> {
    const userIdsArr = [...userIds.values()];
    const pushNotifSubs = new Map<string, PushNotificationSubscriptionsEntity | undefined>(
        await Promise.all<[string, PushNotificationSubscriptionsEntity | undefined]>(
            userIdsArr.map(
                async (userId): Promise<[string, PushNotificationSubscriptionsEntity | undefined]> => [
                    userId,
                    await new PushNotificationSubscriptionsCache(logger).getEntity(userId),
                ]
            )
        )
    );

    // Web-socket notifications
    await Promise.all(
        userIdsArr.map(async (userId) => {
            // CHAT_TODO: Choose web-push, web-socket, email or no notification channel

            const pushNotifSub = pushNotifSubs.get(userId);
            if (pushNotifSub?.subscriptions.length) {
                await Promise.all(pushNotifSub.subscriptions.map((sub) => sendNotification(sub, notification)));
            }
            // else {
            emitter.in(notificationsRoomName(userId)).emit("notification", notification);
            // }
        })
    );
}
