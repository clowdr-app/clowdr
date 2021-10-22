import { useAuth0 } from "@auth0/auth0-react";
import type { CombinedError, Operation } from "@urql/core";
import { makeOperation } from "@urql/core";
import type { AuthConfig } from "@urql/exchange-auth";
import { authExchange } from "@urql/exchange-auth";
import { offlineExchange } from "@urql/exchange-graphcache";
import { requestPolicyExchange } from "@urql/exchange-request-policy";
import { retryExchange } from "@urql/exchange-retry";
import { Mutex } from "async-mutex";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Client as UrqlClient } from "urql";
import { createClient, dedupExchange, fetchExchange, Provider } from "urql";
import schema from "../../generated/graphql.schema.json";
import { PresenceStateProvider } from "../Realtime/PresenceStateProvider";
import { RealtimeServiceProvider } from "../Realtime/RealtimeServiceProvider";
import type { AuthParameters } from "./AuthParameters";
import { useAuthParameters } from "./AuthParameters";

const useSecureProtocols = import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_SECURE_PROTOCOLS !== "false";
const httpProtocol = useSecureProtocols ? "https" : "http";
export const GraphQLHTTPUrl = `${httpProtocol}://${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN}/v1/graphql`;

interface UrqlContext {
    reconnect: (cb?: () => void) => Promise<void>;
}

const UrqlContext = React.createContext<UrqlContext | null>(null);

export function useUrqlContext(): UrqlContext {
    const ctx = React.useContext(UrqlContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider? (useUrqlContext)");
    }
    return ctx;
}

function UrqlProviderInner({
    children,
    isAuthenticated,
    getAccessTokenSilently,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    isAuthenticated: boolean;
    getAccessTokenSilently: (options?: any) => Promise<string>;
}): JSX.Element {
    const [client, setClient] = useState<UrqlClient | null>(null);
    const [realtimeToken, setPresenceToken] = useState<string | null>(null);

    const mutex = useRef(new Mutex());
    const isReconnecting = useRef(false);

    const authParams = useAuthParameters();
    const authCtxRef = useRef<AuthParameters>(authParams);
    // We deliberately cut the React auto-update chain here so that the urql
    // client doesn't get recreated. It doesn't need to since the values are
    // used imperatively within the operation formation function.
    useEffect(() => {
        authCtxRef.current = authParams;
    }, [authParams]);

    const connect = useCallback(
        async (cb?: () => void) => {
            if (!isReconnecting.current) {
                const release = await mutex.current.acquire();
                isReconnecting.current = true;
                try {
                    const authOptions: AuthConfig<{ token?: string | null }> = {
                        getAuth: async ({ authState }) => {
                            if (!authState && isAuthenticated) {
                                const token = await getAccessTokenSilently();
                                if (token) {
                                    return { token };
                                }
                                return null;
                            }

                            return null;
                        },
                        addAuthToOperation: ({ authState, operation }) => {
                            if (!authState || !authState.token) {
                                return operation;
                            }

                            const fetchOptions =
                                typeof operation.context.fetchOptions === "function"
                                    ? operation.context.fetchOptions()
                                    : operation.context.fetchOptions || {};

                            const headers: Record<string, string> = {
                                "X-Auth-Role": "attendee",
                                ...(authCtxRef.current.conferenceId && {
                                    "X-Auth-Conference-Id": authCtxRef.current.conferenceId,
                                }),
                                ...(authCtxRef.current.subconferenceId && {
                                    "X-Auth-Subconference-Id": authCtxRef.current.subconferenceId,
                                }),
                                ...(fetchOptions.headers as Record<string, string>),
                                Authorization: "Bearer " + authState.token,
                            };

                            return makeOperation(operation.kind, operation, {
                                ...operation.context,
                                fetchOptions: {
                                    ...fetchOptions,
                                    headers,
                                },
                            });
                        },
                    };

                    const retryOptions = {
                        initialDelayMs: 1000,
                        maxDelayMs: 15000,
                        randomDelay: true,
                        maxNumberAttempts: 3,
                        retryIf: (err: CombinedError, _operation: Operation) => !!err && !!err.networkError,
                    };

                    const newClient = createClient({
                        url: GraphQLHTTPUrl,
                        exchanges: [
                            dedupExchange,
                            requestPolicyExchange({
                                ttl: 30 * 60 * 1000,
                            }),
                            offlineExchange({
                                keys: {
                                    analytics_ElementTotalViews: (data) => data.elementId as string,
                                    analytics_ItemTotalViews: (data) => data.itemId as string,
                                    chat_Pin: (data) => data.chatId + ":" + data.registrantId,
                                    chat_Reaction: (data) => data.sId as string,
                                    chat_ReadUpToIndex: (data) => data.chatId + ":" + data.registrantId,
                                    chat_Subscription: (data) => data.chatId + ":" + data.registrantId,
                                    conference_Configuration: (data) => data.key + ":" + data.conferenceId,
                                    PushNotificationSubscription: (data) => data.userId + ":" + data.endpoint,
                                    registrant_Profile: (data) => data.registrantId as string,
                                    registrant_ProfileBadges: (data) => data.registrantId + ":" + data.name,
                                    room_LivestreamDurations: (data) => data.roomId as string,
                                    schedule_OverlappingEvents: (data) => data.xId + ":" + data.yId,
                                    system_Configuration: (data) => data.key as string,
                                },
                                schema: schema as any,
                                // TODO: resolvers (for queries) -- not sure if these are needed since we supply the schema
                                // TODO: updates (for mutations) -- not sure if these are needed since we supply the schema
                                // TODO: optimistic (for optimistic and offline-first updates)
                            }),
                            authExchange(authOptions),
                            retryExchange(retryOptions),
                            fetchExchange,
                        ],
                    });
                    setClient(newClient);

                    if (isAuthenticated) {
                        const newPresenceToken = await getAccessTokenSilently();
                        setPresenceToken(newPresenceToken);
                    } else {
                        setPresenceToken(null);
                    }

                    cb?.();
                } catch (e) {
                    console.error("Failed to set up Urql client.", e);
                } finally {
                    isReconnecting.current = false;
                    release();
                }
            }
        },
        [getAccessTokenSilently, isAuthenticated]
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
    const ctx: UrqlContext = useMemo(
        () => ({
            reconnect,
        }),
        [reconnect]
    );

    if (!client) {
        return <>Loading...</>;
    }

    return (
        <UrqlContext.Provider value={ctx}>
            {realtimeToken ? (
                <RealtimeServiceProvider token={realtimeToken}>
                    <PresenceStateProvider>
                        <Provider value={client}>{children}</Provider>
                    </PresenceStateProvider>
                </RealtimeServiceProvider>
            ) : (
                <Provider value={client}>{children}</Provider>
            )}
        </UrqlContext.Provider>
    );
}

export default function UrqlProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();

    if (isLoading) {
        return <>Loading...</>;
    }

    return (
        <UrqlProviderInner isAuthenticated={isAuthenticated} getAccessTokenSilently={getAccessTokenSilently}>
            {children}
        </UrqlProviderInner>
    );
}
