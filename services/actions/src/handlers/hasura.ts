export async function handleAuthWebhook(
    payload: AuthPayload,
    userId: string | undefined
): Promise<false | Record<string, any>> {
    // TODO: Fetch list of conferences a user is registered for
    // TODO: Somewhere cache the list of conferences a user is registered for
    // TODO: Some kind of cache expiry
    // TODO: Refetch conferences list if desired conference is not in the cached list
    // TODO: Apply conditions for unauth vs user role based on list of registered conferences
    const result: Record<string, any> = {
        "x-hasura-conference-slug":
            payload.headers["x-hasura-conference-slug"] ?? payload.headers["X-Hasura-Conference-Slug"],
        "x-hasura-magic-token": payload.headers["x-hasura-magic-token"] ?? payload.headers["X-Hasura-Magic-Token"],
    };
    if (userId) {
        result["x-hasura-role"] = "user"; // TODO: No conference or user has access to conference? Then "user", Else "unauthenticated"
        result["x-hasura-user-id"] = userId;
    } else {
        result["x-hasura-role"] = "unauthenticated";
    }
    return result;
}
