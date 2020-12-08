import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
    split,
} from "@apollo/client/core";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import fetch from "cross-fetch";
import WebSocket from "ws";

const useSecureProtocols = process.env.GRAPHQL_API_SECURE_PROTOCOLS !== "false";
const httpProtocol = useSecureProtocols ? "https" : "http";
const wsProtocol = useSecureProtocols ? "wss" : "ws";

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
        return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
        );
    },
    wsLink,
    httpLink
);

const cache = new InMemoryCache();

export const apolloClient = new ApolloClient({
    link,
    cache,
    defaultOptions: {
        query: {
            partialRefetch: true,
            // TODO: Remove cast to any when this Apollo Client issue is resolved:
            //       https://github.com/apollographql/apollo-client/issues/6177
        } as any,
    },
});
