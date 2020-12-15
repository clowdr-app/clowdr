export type SNSNotification<T> =
    | SubscriptionConfirmationMessage<T>
    | NotificationMessage<T>
    | UnsubscribeMessage<T>;

export interface SubscriptionConfirmationMessage<T>
    extends SNSNotificationBase<T> {
    Type: "SubscriptionConfirmation";
    Token: string;
    SubscribeURL: string;
}

export interface NotificationMessage<T> extends SNSNotificationBase<T> {
    Type: "Notification";
    Subject?: string;
    UnsubscribeURL: string;
}

export interface UnsubscribeMessage<T> extends SNSNotificationBase<T> {
    Type: "UnsubscribeConfirmation";
    Token: string;
    SubscribeURL: string;
}

export interface SNSNotificationBase<T> {
    Type: string;
    MessageId: string;
    Message: T;
    TopicArn: string;
    Timestamp: string;
    SignatureVersion: string;
    Signature: string;
    SigningCertURL: string;
}
