export interface ParameterStoreEvent {
    version: string;
    id: string;
    "detail-type": "Parameter Store Change";
    source: "aws.ssm";
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: ParameterStoreEventDetail;
}

export interface ParameterStoreEventDetail {
    name: string;
    type: "String" | "SecureString";
    operation: "Create" | "Update" | "Delete";
}
