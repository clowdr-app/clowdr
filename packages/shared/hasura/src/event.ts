export interface EventPayload<T = any> {
    event: {
        session_variables?: { [x: string]: string } | null;
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

export interface ScheduledEventPayload<T = any> {
    scheduled_time: string;
    payload: T;
    created_at: string;
    id: string;
    comment: string | null;
}
