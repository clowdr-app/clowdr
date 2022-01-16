export interface SecretsManagerEvent {
    version: string;
    id: string;
    "detail-type": "AWS API Call via CloudTrail";
    source: "aws.secretsmanager";
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: SecretsManagerEventDetail;
}

export interface SecretsManagerEventDetail {
    eventVersion: string;
    eventTime: string;
    eventSource: "secretsmanager.amazonaws.com";
    eventName: "PutSecretValue" | string;
    awsRegion: string;
    requestParameters: {
        secretId: string;
        clientRequestToken: string;
    };
    requestID: string;
    eventID: string;
    eventType: string;
    recipientAccountId: string;
}
