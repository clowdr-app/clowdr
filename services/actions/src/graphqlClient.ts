import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";
import fetch from "cross-fetch";

const useSecureProtocols = process.env.GRAPHQL_API_SECURE_PROTOCOLS !== "false";
const httpProtocol = useSecureProtocols ? "https" : "http";

const httpLink = new HttpLink({
    uri: `${httpProtocol}://${process.env.GRAPHQL_API_DOMAIN}/v1/graphql`,
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    },
    fetch,
});

const cache = new InMemoryCache();

export const apolloClient = new ApolloClient({
    cache,
    link: httpLink,
    defaultOptions: {
        mutate: {
            fetchPolicy: "no-cache",
        },
        query: {
            fetchPolicy: "no-cache",
            partialRefetch: true,
        },
        watchQuery: {
            fetchPolicy: "no-cache",
        },
    },
});
