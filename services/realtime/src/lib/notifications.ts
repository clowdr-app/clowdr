import { emitter } from "../socket-emitter/socket-emitter";
import { Notification } from "../types/chat";
import { notificationsRoomName } from "./chat";

export async function sendNotifications(userIds: Set<string>, notification: Notification): Promise<void> {
    // TODO: Choose web-push, web-socket, email or no notification channel

    // Web-socket notifications
    userIds.forEach((userId) => {
        emitter.in(notificationsRoomName(userId)).emit("notification", notification);
    });
}
