import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, NormalizedCacheObject, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/link-context";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AppLoadingScreen from "../../AppLoadingScreen";

interface ConferenceAuthCtx {
    setConferenceId: (value: string | null) => void;
    currentConferenceId: string | null;
}

export const ConferenceAuthContext = React.createContext<ConferenceAuthCtx>({
    setConferenceId: () => {
        /* EMPTY */
    },
    currentConferenceId: null,
});

export default function ApolloCustomProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();
    const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>();
    const location = useLocation();
    const conferenceSlug = useMemo(() => {
        const matches = location.pathname.match(/^\/conference\/([^/]+)/);
        if (matches && matches.length > 1) {
            return matches[1];
        }
        return undefined;
    }, [location.pathname]);

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

                    const oneTimeRefreshVar = window.localStorage.getItem("LAST_FORCE_REFRESH_TOKEN");
                    const authTokenConferenceId = window.localStorage.getItem("CLOWDR_AUTH_CONF_SLUG");
                    const ignoreCache =
                        (conferenceSlug && (!oneTimeRefreshVar ||
                            parseInt(oneTimeRefreshVar, 10) + 6 * 60 * 60 * 1000 < Date.now()
                        )) ||
                        !!magicToken ||
                        (!!conferenceSlug && conferenceSlug !== authTokenConferenceId);
                    const token = await getAccessTokenSilently({
                        ignoreCache,
                        "magic-token": magicToken,
                        "conference-slug": conferenceSlug ?? undefined,
                    });
                    if (ignoreCache) {
                        window.localStorage.setItem("LAST_FORCE_REFRESH_TOKEN", Date.now().toString());
                    }
                    if (conferenceSlug) {
                        window.localStorage.setItem("CLOWDR_AUTH_CONF_SLUG", conferenceSlug);
                    }
                    // // Auth0 issues tokens a few seconds in the future
                    // // so we wait a brief period before using a definitely-fresh
                    // // token.
                    // // (The error may still occur if ignoreCache was false but a
                    // //  new token was required anyway. The `useQueryErrorResult`
                    // //  handles that case.)
                    // if (ignoreCache) {
                    //     await new Promise((resolve) => {
                    //         setTimeout(resolve, 3000);
                    //     });
                    // }
                    newHeaders.Authorization = `Bearer ${token}`;
                } else {
                    if (conferenceSlug) {
                        newHeaders["X-Hasura-Conference-Slug"] = conferenceSlug;
                    }
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
                            const authTokenConferenceId = window.localStorage.getItem("CLOWDR_AUTH_CONF_SLUG_WSS");
                            const ignoreCache = !!conferenceSlug && conferenceSlug !== authTokenConferenceId;
                            if (conferenceSlug) {
                                window.localStorage.setItem("CLOWDR_AUTH_CONF_SLUG_WSS", conferenceSlug);
                            }
                            return {
                                headers: {
                                    Authorization: `Bearer ${await getAccessTokenSilently({
                                        ignoreCache,
                                        "conference-slug": conferenceSlug ?? undefined,
                                    })}`,
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

            const cache = new InMemoryCache({
                typePolicies: {
                    chat_Pin: {
                        keyFields: ["chatId", "attendeeId"],
                    },
                    chat_Subscription: {
                        keyFields: ["chatId", "attendeeId"],
                    },
                    chat_Typer: {
                        keyFields: ["chatId", "attendeeId"],
                    },
                    chat_ReadUpToIndex: {
                        keyFields: ["chatId"],
                    },
                    presence_Page: {
                        keyFields: ["path", "conferenceId"],
                    },
                },
            });
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
    }, [conferenceSlug, getAccessTokenSilently, isAuthenticated]);

    if (client === undefined) {
        return <AppLoadingScreen />;
    }

    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
