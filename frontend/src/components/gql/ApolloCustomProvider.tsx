import {
    ApolloClient,
    ApolloProvider,
    HttpLink,
    InMemoryCache,
    NormalizedCacheObject,
    split,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/link-context";
import { useAuth0 } from "@auth0/auth0-react";
import { persistCache } from "apollo3-cache-persist";
import React, { useEffect, useState } from "react";
import AppLoadingScreen from "../../AppLoadingScreen";

export default function ApolloCustomProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();
    const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>();

    useEffect(() => {
        (async () => {
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
                    connectionParams: async () => {
                        if (isAuthenticated) {
                            return {
                                headers: {
                                    Authorization: `Bearer ${await getAccessTokenSilently()}`,
                                },
                            };
                        } else {
                            return {};
                        }
                    },
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

            const cache = new InMemoryCache();
            await persistCache({
                cache,
                storage: window.localStorage,
                maxSize: 1048576 * 50, // 50 MiB
            });

            const client = new ApolloClient({
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

            setClient(client);
        })();
    }, [getAccessTokenSilently, isAuthenticated]);

    if (client === undefined) {
        return <AppLoadingScreen />;
    }

    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
