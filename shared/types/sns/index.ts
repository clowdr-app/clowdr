export interface SubscriptionConfirmationMessage<T> extends SNSNotification<T> {
    Type: "SubscriptionConfirmation";
    Token: string;
    SubscribeURL: string;
}

export interface NotificationMessage<T> extends SNSNotification<T> {
    Type: "Notification";
    Subject: string;
    UnsubscribeURL: string;
}

export interface UnsubscribeMessage<T> extends SNSNotification<T> {
    Type: "UnsubscribeConfirmation";
    Token: string;
    SubscribeURL: string;
}

export interface SNSNotification<T> {
    Type: string;
    MessageId: string;
    Message: T;
    TopicArn: string;
    Timestamp: string;
    SignatureVersion: string;
    Signature: string;
    SigningCertURL: string;
}
