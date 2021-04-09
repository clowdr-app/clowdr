import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import {
    GetVapidPublicKeyDocument,
    GetVapidPublicKeyQuery,
    GetVapidPublicKeyQueryVariables,
} from "../../generated/graphql";
import { GraphQLHTTPUrl } from "../GQL/ApolloCustomProvider";

gql`
    query GetVAPIDPublicKey {
        vapidPublicKey {
            key
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
        } catch (e) {
            this.pushSubscription = `Unexpected error: ${e.toString()}`;
        }
    }

    // Subscribe and unsubscribe inspired by https://serviceworke.rs/push-subscription-management_index_doc.html

    async subscribe(): Promise<void> {
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
                    const keyResponse = await new ApolloClient({
                        uri: GraphQLHTTPUrl,
                        cache: new InMemoryCache(),
                    }).query<GetVapidPublicKeyQuery, GetVapidPublicKeyQueryVariables>({
                        query: GetVapidPublicKeyDocument,
                    });

                    if (keyResponse.data?.vapidPublicKey?.key) {
                        console.info("Push notifications: Attempting to subscribe...");
                        this.pushSubscription = await swRegistration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlB64ToUint8Array(keyResponse.data.vapidPublicKey.key),
                        });
                        // CHAT_TODO: Don't log the endpoint here...
                        console.info(
                            `Push notifications: Subscribed. Saving to server...\n${JSON.stringify(
                                this.pushSubscription,
                                null,
                                2
                            )}`
                        );

                        try {
                            // CHAT_TODO: Insert into db
                            await fetch("https://ed-realtime.dev2.clowdr.org/push/register", {
                                method: "post",
                                headers: {
                                    "Content-type": "application/json",
                                },
                                body: JSON.stringify({
                                    subscription: this.pushSubscription,
                                }),
                            });
                        } catch (e) {
                            console.error("Error saving subscription information to the server", e);
                            this.pushSubscription = `Could not save subscription to the server!\n${e.toString()}`;
                        }
                    } else {
                        console.warn("Push notifications: Server responded with blank key.");
                        this.pushSubscription = "Server responded with blank key.";
                    }
                } catch (e) {
                    console.error("Push notifications: Error fetching VAPID public key.", e);
                    this.pushSubscription = `Could not obtain VAPID public key!\n${e.toString()}`;
                }
            } else {
                console.info(
                    "Push notifications: Service workers not available. Have you enabled service workers for localhost in the developer tools settings?"
                );
                this.pushSubscription = "Service workers not available (perhaps you're in private browsing mode?)";
            }
        } catch (e) {
            this.pushSubscription = `Unexpected error: ${e.toString()}`;
        }
    }

    async unsubscribe(): Promise<void> {
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
                    console.info("Push notifications: Subscribed");

                    // CHAT_TODO: Delete from db
                    try {
                        await fetch("https://ed-realtime.dev2.clowdr.org/push/unregister", {
                            method: "post",
                            headers: {
                                "Content-type": "application/json",
                            },
                            body: JSON.stringify({
                                subscription: sub,
                            }),
                        });
                    } catch (e) {
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
        } catch (e) {
            this.pushSubscription = `Unexpected error: ${e.toString()}`;
        }
    }
}

export const pushNotificationsState = new PushNotificationsState();
