import type { NormalizedCacheObject } from "@apollo/client";
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/link-context";
import { useAuth0 } from "@auth0/auth0-react";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { Mutex } from "async-mutex";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { PresenceStateProvider } from "../Realtime/PresenceStateProvider";
import { RealtimeServiceProvider } from "../Realtime/RealtimeServiceProvider";

const useSecureProtocols = import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_SECURE_PROTOCOLS !== "false";
const httpProtocol = useSecureProtocols ? "https" : "http";
const wsProtocol = useSecureProtocols ? "wss" : "ws";
export const GraphQLHTTPUrl = `${httpProtocol}://${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN}/v1/graphql`;

async function createApolloClient(
    isAuthenticated: boolean,
    conferenceSlug: string | undefined,
    userId: string | undefined,
    getAccessTokenSilently: (options?: any) => Promise<string>
): Promise<ApolloClient<NormalizedCacheObject>> {
    const authLink = setContext(async (_, { headers }) => {
        const newHeaders: any = { ...headers };

        const sendRequestUnauthenticated = headers ? headers["SEND-WITHOUT-AUTH"] === true : false;
        delete newHeaders["SEND-WITHOUT-AUTH"];

        if (isAuthenticated && !sendRequestUnauthenticated) {
            const token = await getAccessTokenSilently();
            newHeaders.Authorization = `Bearer ${token}`;
        }

        newHeaders["x-hasura-conference-slug"] = conferenceSlug;

        return {
            headers: newHeaders,
        };
    });

    const httpLink = new HttpLink({
        uri: GraphQLHTTPUrl,
    });

    const wsConnectionParams = await (async () => {
        if (isAuthenticated) {
            const token = await getAccessTokenSilently();
            return {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "x-hasura-conference-slug": conferenceSlug,
                },
            };
        } else {
            return {};
        }
    })();

    const wsLink = conferenceSlug
        ? new WebSocketLink({
              uri: `${wsProtocol}://${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN}/v1/graphql`,
              options: {
                  reconnect: true,
                  connectionParams: wsConnectionParams,
              },
          })
        : undefined;

    const link = wsLink
        ? authLink.concat(
              split(
                  ({ query }) => {
                      const definition = getMainDefinition(query);
                      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
                  },
                  wsLink,
                  httpLink
              )
          )
        : authLink.concat(httpLink);

    const cache = new InMemoryCache({
        typePolicies: {
            chat_Pin: {
                keyFields: ["chatId", "registrantId"],
            },
            chat_Subscription: {
                keyFields: ["chatId", "registrantId"],
            },
            chat_Typer: {
                keyFields: ["chatId", "registrantId"],
            },
            chat_ReadUpToIndex: {
                keyFields: ["chatId"],
            },
            chat_PinnedOrSubscribed: {
                keyFields: ["chatId", "registrantId"],
            },
            registrant_Profile: {
                keyFields: ["registrantId"],
            },
            conference_Configuration: {
                keyFields: ["key", "conferenceId"],
            },
        },
    });

    // Apollo's local storage cache is a totally broken PoS...
    //  if you hit the memory limit, it crashes your whole website
    //  with a quoto-exceeded error. It also doesn't handle switching
    //  accounts (i.e. auth tokens).

    // if (import.meta.env.MODE !== "development") {
    // await persistCache({
    //     cache,
    //     storage: window.localStorage,
    //     maxSize: 1048576 * 3, // 3 MiB
    // });
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

    return client;
}

interface ApolloCustomCtx {
    reconnect: (cb?: () => void) => Promise<void>;
}

const ApolloCustomContext = React.createContext<ApolloCustomCtx | null>(null);

export function useApolloCustomContext(): ApolloCustomCtx {
    const ctx = React.useContext(ApolloCustomContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider? (useApolloCustomContext)");
    }
    return ctx;
}

function ApolloCustomProviderInner({
    children,
    isAuthenticated,
    getAccessTokenSilently,
    user,
    conferenceSlug,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    isAuthenticated: boolean;
    getAccessTokenSilently: (options?: any) => Promise<string>;
    user: any;
    conferenceSlug: string | undefined;
}): JSX.Element {
    const [client, setClient] = useState<{
        slug: string | undefined;
        client: ApolloClient<NormalizedCacheObject>;
    } | null>(null);
    const [realtimeToken, setPresenceToken] = useState<string | null>(null);

    const mutex = useRef(new Mutex());
    const isReconnecting = useRef(false);

    const connect = useCallback(
        async (cb?: () => void) => {
            if (!isReconnecting.current) {
                const release = await mutex.current.acquire();
                isReconnecting.current = true;
                try {
                    const newClient = await createApolloClient(
                        isAuthenticated,
                        conferenceSlug,
                        user?.sub,
                        getAccessTokenSilently
                    );
                    setClient({ slug: conferenceSlug, client: newClient });

                    if (isAuthenticated) {
                        const newPresenceToken = await getAccessTokenSilently();
                        setPresenceToken(newPresenceToken);
                    } else {
                        setPresenceToken(null);
                    }

                    cb?.();
                } catch (e) {
                    console.error("Failed to set up Apollo client.", e);
                } finally {
                    isReconnecting.current = false;
                    release();
                }
            }
        },
        [conferenceSlug, getAccessTokenSilently, isAuthenticated, user?.sub]
    );

    useEffect(() => {
        connect();
    }, [connect]);

    const reconnect = useCallback(
        async (cb?: () => void) => {
            connect(cb);
        },
        [connect]
    );
    const ctx: ApolloCustomCtx = useMemo(
        () => ({
            reconnect,
        }),
        [reconnect]
    );

    const reconnectRealtime = useCallback(async () => {
        if (isAuthenticated) {
            setPresenceToken(null);
            const newPresenceToken = await getAccessTokenSilently();
            setPresenceToken(newPresenceToken);
        } else {
            setPresenceToken(null);
        }
    }, [getAccessTokenSilently, isAuthenticated]);

    useEffect(() => {
        const tId = setInterval(() => {
            reconnectRealtime();
        }, 10000);
        return () => {
            clearInterval(tId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!client || client.slug !== conferenceSlug) {
        return <>Loading...</>;
    }

    return (
        <ApolloCustomContext.Provider value={ctx}>
            <RealtimeServiceProvider token={realtimeToken} reconnect={reconnectRealtime}>
                <PresenceStateProvider>
                    <ApolloProvider client={client.client}>{children}</ApolloProvider>
                </PresenceStateProvider>
            </RealtimeServiceProvider>
        </ApolloCustomContext.Provider>
    );
}

export default function ApolloCustomProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
    const location = useLocation();
    const matches = location.pathname.match(/^\/conference\/([^/]+)/);
    const conferenceSlug = matches && matches.length > 1 ? matches[1] : undefined;

    useEffect(() => {
        datadogLogs.removeLoggerGlobalContext("user");
        datadogLogs.addLoggerGlobalContext("user", {
            isAuthenticated,
            userId: user?.sub,
        });

        datadogRum.removeRumGlobalContext("user");
        datadogRum.addRumGlobalContext("user", {
            isAuthenticated,
            userId: user?.sub,
        });
    }, [isAuthenticated, user?.sub]);

    if (isLoading) {
        return <>Loading...</>;
    }

    return (
        <ApolloCustomProviderInner
            isAuthenticated={isAuthenticated}
            getAccessTokenSilently={getAccessTokenSilently}
            user={user}
            conferenceSlug={conferenceSlug}
        >
            {children}
        </ApolloCustomProviderInner>
    );
}
