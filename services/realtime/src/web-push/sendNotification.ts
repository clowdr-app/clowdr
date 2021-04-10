import { gql } from "@apollo/client/core";
import assert from "assert";
import webPush from "web-push";
import { DeletePushNotificationSubscriptionDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { Notification } from "../types/chat";
import { getVAPIDKeys } from "./vapidKeys";

gql`
    mutation DeletePushNotificationSubscription($endpoint: String!) {
        delete_PushNotificationSubscription_by_pk(endpoint: $endpoint) {
            endpoint
        }
    }
`;

export async function sendNotification(
    subscription: webPush.PushSubscription,
    notification: Notification
): Promise<void> {
    try {
        const vapidKeys = await getVAPIDKeys();
        assert(process.env.HOST_PUBLIC_URL, "Missing env var HOST_PUBLIC_URL");
        await webPush.sendNotification(subscription, JSON.stringify(notification), {
            vapidDetails: {
                ...vapidKeys,
                subject: process.env.HOST_PUBLIC_URL,
            },
        });
    } catch (e) {
        console.warn("ERROR in sending Notification, endpoint removed " + subscription.endpoint, subscription, e);
        try {
            await apolloClient?.mutate({
                mutation: DeletePushNotificationSubscriptionDocument,
                variables: {
                    endpoint: subscription.endpoint,
                },
            });
        } catch (e) {
            console.error("Unable to delete push notification subscription from the database", e);
        }
    }
}
