import webPush from "web-push";

export async function sendNotification(subscription: webPush.PushSubscription): Promise<void> {
    try {
        await webPush.sendNotification(subscription);
        console.log("Push Application Server - Notification sent to " + subscription.endpoint);
        // CHAT_TODO
    } catch (e) {
        console.warn("ERROR in sending Notification, endpoint removed " + subscription.endpoint, e);
        // CHAT_TODO
    }
}
