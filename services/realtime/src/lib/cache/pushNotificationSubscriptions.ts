import { Cache } from "@midspace/component-clients/cache/cache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type webPush from "web-push";
import type {
    PushNotificationSubscriptionsQuery,
    PushNotificationSubscriptionsQueryVariables,
} from "../../generated/graphql";
import { PushNotificationSubscriptionsDocument } from "../../generated/graphql";

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
    async (userId) => {
        const response =
            gqlClient &&
            (await gqlClient
                .query<PushNotificationSubscriptionsQuery, PushNotificationSubscriptionsQueryVariables>(
                    PushNotificationSubscriptionsDocument,
                    {
                        userId,
                    }
                )
                .toPromise());

        const result: PushNotificationSubscriptions | undefined = {
            userId,
            subscriptions:
                response?.data?.PushNotificationSubscription.map((x) => ({
                    endpoint: x.endpoint,
                    keys: {
                        auth: x.auth,
                        p256dh: x.p256dh,
                    },
                })) ?? [],
        };

        return result;
    },
    JSON.stringify,
    JSON.parse,
    7 * 24 * 60 * 60 * 1000, // Refetch subscription info every 7 days
    5 * 60 * 1000
);

export async function getPushNotificationSubscriptions(
    userId: string,
    refetchNow = false
): Promise<PushNotificationSubscriptions | undefined> {
    const info = await PushNotificationSubscriptionsCache.get(userId, refetchNow);
    if (!info && !refetchNow) {
        return getPushNotificationSubscriptions(userId, true);
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
        false
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
        false
    );
}
