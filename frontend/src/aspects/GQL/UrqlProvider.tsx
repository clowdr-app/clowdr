import { useAuth0 } from "@auth0/auth0-react";
import { augSchema } from "@midspace/graphql/graphql-aug-schema";
import { schema } from "@midspace/graphql/graphql-schema";
import { genericResolvers } from "@midspace/urql-hasura-cache-generic-resolver/genericResolver";
import { genericUpdaters } from "@midspace/urql-hasura-cache-generic-resolver/genericUpdater";
import type { CombinedError, Operation } from "@urql/core";
import { makeOperation } from "@urql/core";
import type { AuthConfig } from "@urql/exchange-auth";
import { authExchange } from "@urql/exchange-auth";
import { cacheExchange } from "@urql/exchange-graphcache";
import { requestPolicyExchange } from "@urql/exchange-request-policy";
import { retryExchange } from "@urql/exchange-retry";
import { Mutex } from "async-mutex";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Client as UrqlClient } from "urql";
import { createClient, dedupExchange, fetchExchange, Provider } from "urql";
import type { GraphCacheConfig } from "../../generated/graphql";
import { PresenceStateProvider } from "../Realtime/PresenceStateProvider";
import { RealtimeServiceProvider } from "../Realtime/RealtimeServiceProvider";
import type { AuthParameters } from "./AuthParameters";
import { useAuthParameters } from "./AuthParameters";
import { requestTracingExchange } from "./request-tracing-exchange";

const useSecureProtocols = import.meta.env.VITE_GRAPHQL_API_SECURE_PROTOCOLS !== "false";
const httpProtocol = useSecureProtocols ? "https" : "http";
export const GraphQLHTTPUrl = `${httpProtocol}://${import.meta.env.VITE_GRAPHQL_API_DOMAIN}/v1/graphql`;

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

// const storage = makeDefaultStorage({
//     idbName: "graphcache-v3", // The name of the IndexedDB database
//     maxAge: 2, // The maximum age of the persisted data in days
// });

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
    const [realtimeToken, setRealtimeToken] = useState<string | null>(null);

    const mutex = useRef(new Mutex());
    const isReconnecting = useRef(false);

    const authParams = useAuthParameters();
    const authCtxRef = useRef<AuthParameters>(authParams);
    // We deliberately cut the React auto-update chain here so that the urql
    // client doesn't get recreated. It doesn't need to since the values are
    // used imperatively within the operation formation function.
    authCtxRef.current = authParams;

    const loadedAt = useMemo(() => Date.now(), []);

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

                            const fetchOptions: any =
                                typeof operation.context.fetchOptions === "function"
                                    ? operation.context.fetchOptions()
                                    : operation.context.fetchOptions || {};

                            const headers: Record<string, string> = {
                                "x-auth-role": authCtxRef.current.conferenceId
                                    ? "attendee"
                                    : fetchOptions?.headers?.["x-auth-magic-token"]
                                    ? "unauthenticated"
                                    : "user",
                            };
                            if (!fetchOptions?.headers?.NoConferenceId) {
                                if (authCtxRef.current.conferenceId) {
                                    headers["x-auth-conference-id"] = authCtxRef.current.conferenceId;
                                }
                                if (authCtxRef.current.subconferenceId) {
                                    headers["x-auth-subconference-id"] = authCtxRef.current.subconferenceId;
                                }
                            } else {
                                delete fetchOptions.headers.NoConferenceId;
                            }
                            if (fetchOptions?.headers) {
                                for (const key in fetchOptions.headers) {
                                    headers[key.toLowerCase()] = fetchOptions.headers[key];
                                }
                            }
                            headers.authorization = "Bearer " + authState.token;

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

                    const cache = cacheExchange<GraphCacheConfig>({
                        keys: {
                            analytics_ElementTotalViews: (data) => data.elementId as string,
                            analytics_ItemTotalViews: (data) => data.itemId as string,
                            chat_Pin: (data) => data.chatId + "-" + data.registrantId,
                            chat_Reaction: (data) => data.sId as string,
                            chat_ReadUpToIndex: (data) => data.chatId + "-" + data.registrantId,
                            chat_Subscription: (data) => data.chatId + "-" + data.registrantId,
                            conference_Configuration: (data) => data.key + "-" + data.conferenceId,
                            PushNotificationSubscription: (data) => data.userId + "-" + data.endpoint,
                            registrant_Profile: (data) => data.registrantId as string,
                            registrant_ProfileBadges: (data) => data.registrantId + "-" + data.name,
                            room_LivestreamDurations: (data) => data.roomId as string,
                            schedule_OverlappingEvents: (data) => data.xId + "-" + data.yId,
                            system_Configuration: (data) => data.key as string,
                            GetSlugOutput: (data) => data.url as string,
                            TranscribeGeneratePresignedUrlOutput: () => null,
                        },
                        schema: schema as any,
                        // storage,
                        resolvers: genericResolvers(
                            {
                                schedule_Event: {
                                    endTime: (data) =>
                                        data.endTime ??
                                        (data.startTime &&
                                        data.durationSeconds !== null &&
                                        data.durationSeconds !== undefined
                                            ? new Date(
                                                  Date.parse(data.startTime as string) +
                                                      (data.durationSeconds as number) * 1000
                                              ).toISOString()
                                            : null),
                                },
                            },
                            schema as any,
                            augSchema as any
                        ),
                        updates: genericUpdaters({}, schema as any, augSchema as any),
                    });

                    const newClient = createClient({
                        url: GraphQLHTTPUrl,
                        exchanges: [
                            // devtoolsExchange,
                            dedupExchange,
                            requestTracingExchange,
                            requestPolicyExchange({
                                ttl: 30 * 60 * 1000,
                                shouldUpgrade: () =>
                                    authCtxRef.current.isOnManagementPage || Date.now() - loadedAt > 30 * 1000,
                            }),
                            cache,
                            authExchange(authOptions),
                            retryExchange(retryOptions),
                            fetchExchange,
                        ],
                        requestPolicy: "cache-and-network",
                    });
                    setClient(newClient);

                    if (isAuthenticated) {
                        const newPresenceToken = await getAccessTokenSilently();
                        setRealtimeToken(newPresenceToken);
                    } else {
                        setRealtimeToken(null);
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
        [getAccessTokenSilently, isAuthenticated, loadedAt]
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
    const reconnectRealtime = useCallback(async () => {
        const newToken = await getAccessTokenSilently();
        setRealtimeToken(newToken);
    }, [getAccessTokenSilently]);

    if (!client) {
        return <>Loading...</>;
    }

    return (
        <UrqlContext.Provider value={ctx}>
            <RealtimeServiceProvider token={realtimeToken} reconnect={reconnectRealtime}>
                <PresenceStateProvider>
                    <Provider value={client}>{children}</Provider>
                </PresenceStateProvider>
            </RealtimeServiceProvider>
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
        return <>Loading... y</>;
    }

    return (
        <UrqlProviderInner isAuthenticated={isAuthenticated} getAccessTokenSilently={getAccessTokenSilently}>
            {children}
        </UrqlProviderInner>
    );
}
