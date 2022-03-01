interface AuthPayload {
    headers: Record<string, string>;
    request?: {
        variables?: Record<string, any>;
        operationName?: string;
        query: string;
    } | null;
}
