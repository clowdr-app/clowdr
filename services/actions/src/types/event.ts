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

export interface BaseData {
    created_at: string;
    updated_at: string;
    id: string;
}

export interface ConferenceData extends BaseData {
    createdBy: string;
    demoCodeId: string;
    name: string;
    shortName: string;
    slug: string;
}

export interface EmailData extends BaseData {
    userId: string | null;
    invitationId: string | null;
    reason: string;
    htmlContents: string;
    emailAddress: string;
    retriesCount: number;
    plainTextContents: string;
    sentAt: string | null;
    subject: string;
}
