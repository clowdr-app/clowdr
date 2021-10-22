import type { NormalizedCacheObject} from "@apollo/client/core";
import { ApolloClient, gql, HttpLink, InMemoryCache, split } from "@apollo/client/core";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import fetch from "cross-fetch";
import WebSocket from "ws";

export let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

if (process.env.GRAPHQL_API_DOMAIN && process.env.HASURA_ADMIN_SECRET) {
    const useSecureProtocols = process.env.GRAPHQL_API_SECURE_PROTOCOLS !== "false";
    const httpProtocol = useSecureProtocols ? "https" : "http";
    const wsProtocol = useSecureProtocols ? "wss" : "ws";

    gql`
        query EmptyQuery {
            conference_Conference {
                id
            }
        }
    `;

    const httpLink = new HttpLink({
        uri: `${httpProtocol}://${process.env.GRAPHQL_API_DOMAIN}/v1/graphql`,
        headers: {
            "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
        },
        fetch,
    });

    const wsLink = new WebSocketLink({
        uri: `${wsProtocol}://${process.env.GRAPHQL_API_DOMAIN}/v1/graphql`, // use wss for a secure endpoint
        options: {
            reconnect: true,
            connectionParams: async () => {
                return {
                    headers: {
                        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
                    },
                };
            },
        },
        webSocketImpl: WebSocket,
    });

    const link = split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return definition.kind === "OperationDefinition" && definition.operation === "subscription";
        },
        wsLink,
        httpLink
    );

    const cache = new InMemoryCache();

    apolloClient = new ApolloClient({
        link,
        cache,
        defaultOptions: {
            query: {
                fetchPolicy: "network-only",
                partialRefetch: true,
            },
        },
    });
} else {
    console.warn("Skipping GraphQL (Apollo) Client initialisation as GraphQL/Hasura env vars not provided.");
}
