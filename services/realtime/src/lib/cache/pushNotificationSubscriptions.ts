import { gql } from "@apollo/client/core";
import webPush from "web-push";
import { PushNotificationSubscriptionsDocument } from "../../generated/graphql";
import { testMode } from "../../testMode";
import { Cache } from "./cache";

gql`
    query PushNotificationSubscriptions($userId: String!) {
        PushNotificationSubscription(where: { userId: { _eq: $userId } }) {
            userId
            endpoint
            p256dh
            auth
        }
    }
`;

export type PushNotificationSubscriptions = {
    userId: string;
    subscriptions: webPush.PushSubscription[];
};

const PushNotificationSubscriptionsCache = new Cache<PushNotificationSubscriptions>(
    "realtime.caches:PushNotificationSubscriptions",
    async (userId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: PushNotificationSubscriptionsDocument,
                    variables: {
                        userId,
                    },
                });

                const result: PushNotificationSubscriptions | undefined = {
                    userId,
                    subscriptions: response.data.PushNotificationSubscription.map((x) => ({
                        endpoint: x.endpoint,
                        keys: {
                            auth: x.auth,
                            p256dh: x.p256dh,
                        },
                    })),
                };

                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse,
    7 * 24 * 60 * 60 * 1000, // Refetch subscription info every 7 days
    5 * 60 * 1000
);

export async function getPushNotificationSubscriptions(
    userId: string,
    testMode_ExpectedInfo: PushNotificationSubscriptions,
    refetchNow = false
): Promise<PushNotificationSubscriptions | undefined> {
    const info = await PushNotificationSubscriptionsCache.get(userId, testMode_ExpectedInfo, refetchNow);
    if (!info && !refetchNow) {
        return getPushNotificationSubscriptions(userId, testMode_ExpectedInfo, true);
    }
    return info;
}

export async function insertOrUpdatePushNotificationSubscription(
    userId: string,
    sub: webPush.PushSubscription
): Promise<void> {
    await PushNotificationSubscriptionsCache.update(
        userId,
        (existing) => {
            if (!existing?.subscriptions.some((x) => x.endpoint === sub.endpoint)) {
                return {
                    userId,
                    subscriptions: existing ? [...existing.subscriptions, sub] : [sub],
                };
            } else {
                return {
                    userId,
                    subscriptions: existing.subscriptions.map((x) => (x.endpoint === sub.endpoint ? sub : x)),
                };
            }
        },
        {
            userId,
            subscriptions: [],
        }
    );
}

export async function deletePushNotificationSubscription(userId: string, endpoint: string): Promise<void> {
    await PushNotificationSubscriptionsCache.update(
        userId,
        (existing) => {
            return {
                userId,
                subscriptions: existing ? existing.subscriptions.filter((x) => x.endpoint !== endpoint) : [],
            };
        },
        {
            userId,
            subscriptions: [],
        }
    );
}
