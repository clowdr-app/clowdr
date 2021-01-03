import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, NormalizedCacheObject, split } from "@apollo/client";
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
            const useSecureProtocols = import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_SECURE_PROTOCOLS !== "false";
            const httpProtocol = useSecureProtocols ? "https" : "http";
            const wsProtocol = useSecureProtocols ? "wss" : "ws";

            const authLink = setContext(async (_, { headers }) => {
                const newHeaders: any = { ...headers };

                const sendRequestUnauthenticated = headers ? headers["SEND-WITHOUT-AUTH"] === true : false;
                delete newHeaders["SEND-WITHOUT-AUTH"];

                if (isAuthenticated && !sendRequestUnauthenticated) {
                    const magicToken = headers ? headers["x-hasura-magic-token"] : undefined;
                    delete newHeaders["x-hasura-magic-token"];

                    const ignoreCache = !!magicToken;
                    const token = await getAccessTokenSilently({
                        ignoreCache,
                        "magic-token": magicToken,
                    });
                    // Auth0 issues tokens a few seconds in the future
                    // so we wait a brief period before using a definitely-fresh
                    // token.
                    // (The error may still occur if ignoreCache was false but a
                    //  new token was required anyway. The `useQueryErrorResult`
                    //  handles that case.)
                    if (ignoreCache) {
                        await new Promise((resolve) => {
                            setTimeout(resolve, 3000);
                        });
                    }
                    newHeaders.Authorization = `Bearer ${token}`;
                }
                return {
                    headers: newHeaders,
                };
            });

            const httpLink = new HttpLink({
                uri: `${httpProtocol}://${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN}/v1/graphql`,
            });

            const wsLink = new WebSocketLink({
                uri: `${wsProtocol}://${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN}/v1/graphql`, // use wss for a secure endpoint
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
                        return definition.kind === "OperationDefinition" && definition.operation === "subscription";
                    },
                    wsLink,
                    httpLink
                )
            );

            const cache = new InMemoryCache();
            // Apollo's local storage cache is a totally broken PoS...
            //  if you hit the memory limit, it crashes your whole website
            //  with a quoto-exceeded error. It also doesn't handle switching
            //  accounts (i.e. auth tokens).
            //
            // if (import.meta.env.MODE !== "development") {
            //     await persistCache({
            //         cache,
            //         storage: window.localStorage,
            //         maxSize: 1048576 * 50, // 50 MiB
            //     });
            // }

            const client = new ApolloClient({
                link,
                cache,
                defaultOptions: {
                    query: {
                        partialRefetch: true,
                    },
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
