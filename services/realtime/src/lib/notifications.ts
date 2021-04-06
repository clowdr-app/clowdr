import { emitter } from "../socket-emitter/socket-emitter";
import { notificationsRoomName } from "./chat";

export async function sendNotifications(userIds: string[], notification: any): Promise<void> {
    // TODO: Choose web-push, web-socket, email or no notification channel

    // Web-socket notifications
    for (const userId of userIds) {
        emitter.in(notificationsRoomName(userId)).emit("notification", notification);
    }
}
