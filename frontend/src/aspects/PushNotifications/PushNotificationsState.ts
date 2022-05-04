import { assert } from "@midspace/assert";
import type { Client } from "@urql/core";
import { gql } from "@urql/core";
import type {
    DeletePushNotificationSubscriptionMutation,
    DeletePushNotificationSubscriptionMutationVariables,
    GetVapidPublicKeyQuery,
    GetVapidPublicKeyQueryVariables,
    UpsertPushNotificationSubscriptionMutation,
    UpsertPushNotificationSubscriptionMutationVariables,
} from "../../generated/graphql";
import {
    DeletePushNotificationSubscriptionDocument,
    GetVapidPublicKeyDocument,
    UpsertPushNotificationSubscriptionDocument,
} from "../../generated/graphql";

gql`
    query GetVAPIDPublicKey {
        vapidPublicKey {
            key
        }
    }

    mutation UpsertPushNotificationSubscription($object: PushNotificationSubscription_insert_input!) {
        insert_PushNotificationSubscription_one(
            object: $object
            on_conflict: { constraint: PushNotificationSubscription_pkey, update_columns: [auth, endpoint, p256dh] }
        ) {
            endpoint
        }
    }

    mutation DeletePushNotificationSubscription($endpoint: String!) {
        delete_PushNotificationSubscription(where: { endpoint: { _eq: $endpoint } }) {
            affected_rows
        }
    }
`;

function urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

class PushNotificationsState {
    // CHAT_TODO: How do we handle the fact that the push notification subscription may be for a different Clowdr user?

    constructor() {
        this.init();
    }

    private _pushSubscription: PushSubscription | string | null | undefined;
    private get pushSubscription(): PushSubscription | string | null | undefined {
        return this._pushSubscription;
    }
    private set pushSubscription(value) {
        this._pushSubscription = value;

        for (const [_, handler] of this._onIsSubscribed) {
            handler(
                this.pushSubscription && typeof this.pushSubscription !== "string"
                    ? true
                    : this.pushSubscription && typeof this.pushSubscription === "string"
                    ? this.pushSubscription
                    : this.pushSubscription === null
                    ? false
                    : null
            );
        }
    }

    private _onIsSubscribed: Map<number, (isSubscribed: boolean | string | null) => void> = new Map();
    private _onIsSubscribedGen = 1;
    /**
     * Null = Indeterminate
     * String = Error
     * True = Subscribed
     * False = Not subscribed
     */
    onIsSubscribed(handler: (isSubscribed: boolean | string | null) => void): () => void {
        const id = this._onIsSubscribedGen++;
        this._onIsSubscribed.set(id, handler);

        handler(
            this.pushSubscription && typeof this.pushSubscription !== "string"
                ? true
                : this.pushSubscription && typeof this.pushSubscription === "string"
                ? this.pushSubscription
                : this.pushSubscription === null
                ? false
                : null
        );

        return () => {
            this._onIsSubscribed.delete(id);
        };
    }

    async init(): Promise<void> {
        try {
            if ("serviceWorker" in navigator) {
                console.info("Push notifications: Attempting to register service worker");
                navigator.serviceWorker.register("/pushNotificationsServiceWorker.js");

                const swRegistration = await navigator.serviceWorker.ready;

                if (!("pushManager" in swRegistration)) {
                    console.info(
                        "Push manager not available - push notifications may not be supported by your browser: https://caniuse.com/push-api"
                    );
                    this.pushSubscription =
                        "Push manager not available - push notifications may not be supported by your browser: https://caniuse.com/push-api";
                }

                console.info("Push notifications: Service worker ready");
                this.pushSubscription = await swRegistration.pushManager.getSubscription();
                if (this.pushSubscription) {
                    console.info("Push notifications: Found an existing subscription");
                } else {
                    console.info("Push notifications: No existing subscription");
                    this.pushSubscription = null;
                }
            } else {
                console.info(
                    "Push notifications: Service workers not available. Have you enabled service workers for localhost in the developer tools settings?"
                );
                this.pushSubscription = "Service workers not available (perhaps you're in private browsing mode?)";
            }
        } catch (e: any) {
            this.pushSubscription = `Unexpected error: ${e.toString()}`;
        }
    }

    // Subscribe and unsubscribe inspired by https://serviceworke.rs/push-subscription-management_index_doc.html

    async subscribe(client: Client): Promise<void> {
        try {
            this.pushSubscription = undefined;

            if ("serviceWorker" in navigator) {
                const swRegistration = await navigator.serviceWorker.ready;

                if (!("pushManager" in swRegistration)) {
                    console.info(
                        "Push manager not available - push notifications may not be supported by your browser: https://caniuse.com/push-api"
                    );
                    this.pushSubscription =
                        "Push manager not available - push notifications may not be supported by your browser: https://caniuse.com/push-api";
                }

                try {
                    const keyResponse = await client
                        .query<GetVapidPublicKeyQuery, GetVapidPublicKeyQueryVariables>(GetVapidPublicKeyDocument)
                        .toPromise();

                    if (keyResponse.data?.vapidPublicKey?.key) {
                        console.info("Push notifications: Attempting to subscribe...");
                        try {
                            this.pushSubscription = await swRegistration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlB64ToUint8Array(keyResponse.data.vapidPublicKey.key),
                            });
                            assert.truthy(this.pushSubscription, "Push subscription was not defined.");
                            console.info("Push notifications: Subscribed. Saving to server...");

                            try {
                                const subJSON = this.pushSubscription.toJSON();
                                assert.truthy(subJSON.endpoint, "Subscription JSON did not have an endpoint");
                                assert.truthy(subJSON.keys, "Subscription JSON did not have any keys");
                                assert.truthy(
                                    subJSON.keys.auth,
                                    "Subscription JSON keys did not have auth information"
                                );
                                assert.truthy(
                                    subJSON.keys.p256dh,
                                    "Subscription JSON keys did not have p256dh information"
                                );

                                await client
                                    .mutation<
                                        UpsertPushNotificationSubscriptionMutation,
                                        UpsertPushNotificationSubscriptionMutationVariables
                                    >(UpsertPushNotificationSubscriptionDocument, {
                                        object: {
                                            auth: subJSON.keys.auth,
                                            endpoint: subJSON.endpoint,
                                            p256dh: subJSON.keys.p256dh,
                                        },
                                    })
                                    .toPromise();
                            } catch (e: any) {
                                console.error("Error saving subscription information to the server", e);
                                this.pushSubscription = `Could not save subscription to the server!\n${e.toString()}`;
                            }
                        } catch (e: any) {
                            console.error("Browser denied the push subscription", e);
                            this.pushSubscription = `Browser denied the push subscription!\n${e.toString()}`;
                        }
                    } else {
                        console.warn("Push notifications: Server responded with blank key.");
                        this.pushSubscription = "Server responded with blank key.";
                    }
                } catch (e: any) {
                    console.error("Push notifications: Error fetching VAPID public key.", e);
                    this.pushSubscription = `Could not obtain VAPID public key!\n${e.toString()}`;
                }
            } else {
                console.info(
                    "Push notifications: Service workers not available. Have you enabled service workers for localhost in the developer tools settings?"
                );
                this.pushSubscription = "Service workers not available (perhaps you're in private browsing mode?)";
            }
        } catch (e: any) {
            this.pushSubscription = `Unexpected error: ${e.toString()}`;
        }
    }

    async unsubscribe(client: Client): Promise<void> {
        try {
            this.pushSubscription = undefined;

            if ("serviceWorker" in navigator) {
                const swRegistration = await navigator.serviceWorker.ready;

                if (!("pushManager" in swRegistration)) {
                    console.info(
                        "Push manager not available - push notifications may not be supported by your browser: https://caniuse.com/push-api"
                    );
                    this.pushSubscription =
                        "Push manager not available - push notifications may not be supported by your browser: https://caniuse.com/push-api";
                }

                const sub = await swRegistration.pushManager.getSubscription();
                this.pushSubscription = null;
                if (sub) {
                    await sub.unsubscribe();
                    console.info("Push notifications: Unsubscribed. Deleting from server...");

                    try {
                        await client
                            .mutation<
                                DeletePushNotificationSubscriptionMutation,
                                DeletePushNotificationSubscriptionMutationVariables
                            >(DeletePushNotificationSubscriptionDocument, {
                                endpoint: sub.endpoint,
                            })
                            .toPromise();
                    } catch (e: any) {
                        console.error("Error deleting subscription information from the server", e);
                        this.pushSubscription = `Could not delete subscription from the server!\n${e.toString()}`;
                    }
                }
            } else {
                console.info(
                    "Push notifications: Service workers not available. Have you enabled service workers for localhost in the developer tools settings?"
                );
                this.pushSubscription = "Service workers not available (perhaps you're in private browsing mode?)";
            }
        } catch (e: any) {
            this.pushSubscription = `Unexpected error: ${e.toString()}`;
        }
    }
}

export const pushNotificationsState = new PushNotificationsState();
