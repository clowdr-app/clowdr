import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";
import fetch from "cross-fetch";
import { awsClient } from "./lib/aws/awsClient";

async function createApolloClient() {
    const GRAPHQL_API_SECURE_PROTOCOLS = await awsClient.getAWSParameter("GRAPHQL_API_SECURE_PROTOCOLS");
    const GRAPHQL_API_DOMAIN = await awsClient.getAWSParameter("GRAPHQL_API_DOMAIN");
    const HASURA_ADMIN_SECRET = await awsClient.getSecret("HASURA_ADMIN_SECRET");

    const useSecureProtocols = GRAPHQL_API_SECURE_PROTOCOLS !== "false";
    const httpProtocol = useSecureProtocols ? "https" : "http";

    const httpLink = new HttpLink({
        uri: `${httpProtocol}://${GRAPHQL_API_DOMAIN}/v1/graphql`,
        headers: {
            "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
        },
        fetch,
    });

    const cache = new InMemoryCache();

    return new ApolloClient({
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
}

export const apolloClient = createApolloClient();
