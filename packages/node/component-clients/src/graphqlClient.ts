import type { Client } from "@urql/core";
import { createClient, dedupExchange, fetchExchange } from "@urql/core";
import { retryExchange } from "@urql/exchange-retry";
import fetch from "node-fetch";
import type { AWSClient } from "./aws/client";

export async function createGQLClient(awsClient: AWSClient): Promise<Client> {
    const GRAPHQL_API_SECURE_PROTOCOLS = await awsClient.getAWSParameter("GRAPHQL_API_SECURE_PROTOCOLS");
    const GRAPHQL_API_DOMAIN = await awsClient.getAWSParameter("GRAPHQL_API_DOMAIN");
    const HASURA_ADMIN_SECRET = await awsClient.getSecret("HASURA_ADMIN_SECRET");

    const useSecureProtocols = GRAPHQL_API_SECURE_PROTOCOLS !== "false";
    const httpProtocol = useSecureProtocols ? "https" : "http";

    const gqlClient = createClient({
        url: `${httpProtocol}://${GRAPHQL_API_DOMAIN}/v1/graphql`,
        fetch: fetch as any,
        fetchOptions: {
            headers: {
                "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
            },
        },
        // No caching in this service - we don't want consistency nightmares in
        // our long-running server nodes.
        requestPolicy: "network-only",
        exchanges: [
            dedupExchange,
            retryExchange({
                initialDelayMs: 500,
                maxDelayMs: 5000,
                randomDelay: true,
                maxNumberAttempts: 3,
                // Only retry an operation if it was caused by a network error
                // We don't want to retry just because our GQL operation returned an error
                retryIf: (err, _op) => !!err && !!err.networkError,
            }),
            fetchExchange,
        ],
    });

    return gqlClient;
}
