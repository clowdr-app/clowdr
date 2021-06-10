interface AuthPayload {
    headers: {
        "x-hasura-conference-slug"?: string;
        "x-hasura-magic-token"?: string;
        "X-Hasura-Conference-Slug"?: string;
        "X-Hasura-Magic-Token"?: string;
        Authorization?: string;
    };
    request?: {
        variables?: Record<string, any>;
        operationName?: string;
        query: string;
    } | null;
}
