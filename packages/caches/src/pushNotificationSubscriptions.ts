import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type webPush from "web-push";
import type {
    GetPushNotificationSubscriptionsQuery,
    GetPushNotificationSubscriptionsQueryVariables,
} from "./generated/graphql";
import { GetPushNotificationSubscriptionsDocument } from "./generated/graphql";
import { TableCache } from "./generic/table";

gql`
    query GetPushNotificationSubscriptions($userId: String!) {
        PushNotificationSubscription(where: { userId: { _eq: $userId } }) {
            userId
            endpoint
            p256dh
            auth
        }
    }
`;

export interface PushNotificationSubscriptionsEntity {
    userId: string;
    subscriptions: webPush.PushSubscription[];
}

class PushNotificationSubscriptionsCache {
    private readonly cache = new TableCache("PushNotificationSubscriptions", async (userId) => {
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
        return undefined;
    });

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
}

export const pushNotificationSubscriptionsCache = new PushNotificationSubscriptionsCache();
