import {
    ApolloClient,
    ApolloProvider,
    HttpLink,
    InMemoryCache,
    split,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/link-context";
import { useAuth0 } from "@auth0/auth0-react";
import React from "react";

export default function ApolloCustomProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}) {
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    const useSecureProtocols =
        import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_SECURE_PROTOCOLS !==
        "false";
    const httpProtocol = useSecureProtocols ? "https" : "http";
    const wsProtocol = useSecureProtocols ? "wss" : "ws";

    const authLink = setContext(async () => {
        if (isAuthenticated) {
            const token = await getAccessTokenSilently();
            return {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
        }
        return {};
    });

    const httpLink = new HttpLink({
        uri: `${httpProtocol}://${
            import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN
        }/v1/graphql`,
    });

    const wsLink = new WebSocketLink({
        uri: `${wsProtocol}://${
            import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN
        }/v1/graphql`, // use wss for a secure endpoint
        options: {
            reconnect: true,
            // connectionParams: async () => {
            //     if (isAuthenticated) {
            //         return {
            //             headers: {
            //                 Authorization: await getAccessTokenSilently()
            //             }
            //         };
            //     }
            //     else {
            //         return {};
            //     }
            // }
        },
    });

    const link = authLink.concat(
        split(
            ({ query }) => {
                const definition = getMainDefinition(query);
                return (
                    definition.kind === "OperationDefinition" &&
                    definition.operation === "subscription"
                );
            },
            wsLink,
            httpLink
        )
    );

    const client = new ApolloClient({
        link,
        cache: new InMemoryCache(),
    });

    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
