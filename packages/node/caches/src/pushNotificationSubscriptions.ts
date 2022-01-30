import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type P from "pino";
import type webPush from "web-push";
import type {
    GetPushNotificationSubscriptionsQuery,
    GetPushNotificationSubscriptionsQueryVariables,
    PushNotificationSubscriptionCacheDataFragment,
} from "./generated/graphql";
import { GetPushNotificationSubscriptionsDocument } from "./generated/graphql";
import type { CacheRecord } from "./generic/table";
import { TableCache } from "./generic/table";

gql`
    fragment PushNotificationSubscriptionCacheData on PushNotificationSubscription {
        userId
        endpoint
        p256dh
        auth
    }

    query GetPushNotificationSubscriptions($userId: String!) {
        PushNotificationSubscription(where: { userId: { _eq: $userId } }) {
            ...PushNotificationSubscriptionCacheData
        }
    }
`;

export interface PushNotificationSubscriptionsEntity {
    userId: string;
    subscriptions: webPush.PushSubscription[];
}

type PushNotificationSubscriptionCacheRecord = {
    userId: string;
    subscriptions: string;
};

export type PushNotificationSubscriptionHydrationFilters = {
    userId: string;
};

export class PushNotificationSubscriptionsCache {
    constructor(private readonly logger: P.Logger) {}

    private readonly cache = new TableCache<
        keyof PushNotificationSubscriptionCacheRecord,
        PushNotificationSubscriptionHydrationFilters
    >(
        this.logger,
        "PushNotificationSubscriptions",
        async (userId) => {
            const response = await gqlClient
                ?.query<GetPushNotificationSubscriptionsQuery, GetPushNotificationSubscriptionsQueryVariables>(
                    GetPushNotificationSubscriptionsDocument,
                    {
                        userId,
                    }
                )
                .toPromise();

            const data = response?.data?.PushNotificationSubscription;
            if (data) {
                return this.convertToCacheRecord(userId, data);
            }
            return undefined;
        },
        async (filters) => {
            const response = await gqlClient
                ?.query<GetPushNotificationSubscriptionsQuery, GetPushNotificationSubscriptionsQueryVariables>(
                    GetPushNotificationSubscriptionsDocument,
                    {
                        userId: filters.userId,
                    }
                )
                .toPromise();

            const data = response?.data?.PushNotificationSubscription;
            if (data) {
                return [{ entityKey: filters.userId, data: this.convertToCacheRecord(filters.userId, data) }];
            }
            return undefined;
        }
    );

    private convertToCacheRecord(
        userId: string,
        data: PushNotificationSubscriptionCacheDataFragment[]
    ): CacheRecord<keyof PushNotificationSubscriptionCacheRecord> {
        return {
            userId,
            subscriptions: JSON.stringify(
                data.map((x) => ({
                    endpoint: x.endpoint,
                    keys: {
                        p256dh: x.p256dh,
                        auth: x.auth,
                    },
                }))
            ),
        };
    }

    public async getEntity(
        id: string,
        fetchIfNotFound = true
    ): Promise<PushNotificationSubscriptionsEntity | undefined> {
        const rawEntity = await this.cache.getEntity(id, fetchIfNotFound);
        if (rawEntity) {
            return {
                userId: rawEntity.userId,
                subscriptions: JSON.parse(rawEntity.subscriptions),
            };
        }
        return undefined;
    }

    public async getField<FieldKey extends keyof PushNotificationSubscriptionsEntity>(
        id: string,
        field: FieldKey,
        fetchIfNotFound = true
    ): Promise<PushNotificationSubscriptionsEntity[FieldKey] | undefined> {
        const rawField = await this.cache.getField(id, field, fetchIfNotFound);
        if (rawField) {
            if (field === "userId") {
                return rawField as PushNotificationSubscriptionsEntity[FieldKey];
            } else if (field === "subscriptions") {
                return JSON.parse(rawField) as PushNotificationSubscriptionsEntity[FieldKey];
            }
        }
        return undefined;
    }

    public async setEntity(id: string, value: PushNotificationSubscriptionsEntity | undefined): Promise<void> {
        await this.cache.setEntity(
            id,
            value && {
                userId: value.userId,
                subscriptions: JSON.stringify(value.subscriptions),
            }
        );
    }

    public async setField<FieldKey extends keyof PushNotificationSubscriptionsEntity>(
        id: string,
        field: FieldKey,
        value: PushNotificationSubscriptionsEntity[FieldKey] | undefined
    ): Promise<void> {
        if (value === undefined) {
            await this.cache.setField(id, field, undefined);
        } else {
            if (field === "userId") {
                await this.cache.setField(id, field, value as string);
            } else if (field === "subscriptions") {
                await this.cache.setField(id, field, JSON.stringify(value));
            }
        }
    }

    public async invalidateEntity(id: string): Promise<void> {
        await this.cache.invalidateEntity(id);
    }

    public async invalidateField(id: string, field: keyof PushNotificationSubscriptionsEntity): Promise<void> {
        await this.cache.invalidateField(id, field);
    }

    public async updateEntity(
        id: string,
        update: (entity: PushNotificationSubscriptionsEntity) => PushNotificationSubscriptionsEntity | undefined,
        fetchIfNotFound = false
    ): Promise<void> {
        const entity = await this.getEntity(id, false);
        if (entity) {
            const newEntity = update(entity);
            await this.setEntity(id, newEntity);
        } else if (fetchIfNotFound) {
            await this.getEntity(id, true);
        }
    }

    public async hydrateIfNecessary(filters: PushNotificationSubscriptionHydrationFilters): Promise<void> {
        return this.cache.hydrateIfNecessary(filters);
    }
}
