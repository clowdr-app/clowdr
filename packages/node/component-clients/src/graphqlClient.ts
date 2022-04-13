import type { Client } from "@urql/core";
import { createClient, fetchExchange, gql } from "@urql/core";
import { retryExchange } from "@urql/exchange-retry";
import fetch from "node-fetch";

export let gqlClient: Client | undefined;

if (process.env.GRAPHQL_API_DOMAIN && process.env.HASURA_ADMIN_SECRET) {
    const useSecureProtocols = process.env.GRAPHQL_API_SECURE_PROTOCOLS !== "false";
    const httpProtocol = useSecureProtocols ? "https" : "http";

    gqlClient = createClient({
        url: `${httpProtocol}://${process.env.GRAPHQL_API_DOMAIN}/v1/graphql`,
        fetch: fetch as any,
        fetchOptions: {
            headers: {
                "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
            },
        },
        // No caching in this service - we don't want consistency nightmares in
        // our long-running server nodes.
        requestPolicy: "network-only",
        exchanges: [
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

    // To keep GQL codegen happy when starting out
    gql`
        query EmptyQuery {
            conference_Conference {
                id
            }
        }
    `;
} else {
    console.warn("Skipping GraphQL Client initialisation as GraphQL/Hasura env vars not provided.");
}
