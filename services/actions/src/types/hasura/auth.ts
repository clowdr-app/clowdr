interface AuthPayload {
    headers: {
        "x-hasura-conference-slug"?: string;
        "x-hasura-magic-token"?: string;
        "X-Hasura-Conference-Slug"?: string;
        "X-Hasura-Magic-Token"?: string;
        "X-Hasura-Invite-Code"?: string;
        "x-hasura-invite-code"?: string;
        Authorization?: string;
        authorization?: string;
    };
    request?: {
        variables?: Record<string, any>;
        operationName?: string;
        query: string;
    } | null;
}
