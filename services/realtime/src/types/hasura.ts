export interface Payload<T = any> {
    event: {
        session_variables: { [x: string]: string };
        op: "INSERT" | "UPDATE" | "DELETE" | "MANUAL";
        data: {
            old: T | null;
            new: T | null;
        };
    };
    created_at: string;
    id: string;
    delivery_info: {
        max_retries: number;
        current_retry: number;
    };
    trigger: {
        name: string;
    };
    table: {
        schema: string;
        name: string;
    };
}

export interface Subscription {
    chatId: string;
    registrantId: string;
    wasManuallySubscribed: boolean;
    created_at: string;
}

export interface Pin {
    chatId: string;
    registrantId: string;
    wasManuallyPinned: boolean;
    created_at: string;
}

export interface PushNotificationSubscription {
    userId: string;
    endpoint: string;
    auth: string;
    p256dh: string;
}

export interface EventEndedNotification {
    eventId: string;
}
