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

export interface Action<T = any> {
    action: {
        name: string;
    };
    input: T;
    session_variables?: any;
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

export enum FlagType {
    /** It's abusive or harmful. */
    Abusive = "Abusive",
    /** It contains false information and is intended to mislead readers. */
    Disinformation = "Disinformation",
    /** It gives the wrong idea or impression. */
    Misleading = "Misleading",
    /** It expresses intentions of self-harm or suicide. */
    RiskToLife = "Risk_To_Life",
    /** It's spam, suspicious or annoying. */
    Spam = "Spam",
}

export interface Flag {
    created_at: string;
    discussionChatId?: string | null;
    flaggedById?: string | null;
    id: number;
    messageSId: string;
    notes?: string | null;
    resolution?: string | null;
    resolved_at?: string | null;
    type: FlagType;
    updated_at: string;
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
