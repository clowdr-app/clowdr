import { useAuth0 } from "@auth0/auth0-react";
import { offlineExchange } from "@urql/exchange-graphcache";
import { Mutex } from "async-mutex";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Client as UrqlClient} from "urql";
import { createClient, dedupExchange, fetchExchange, Provider } from "urql";
import schema from "../../generated/graphql.schema.json";
import { PresenceStateProvider } from "../Realtime/PresenceStateProvider";
import { RealtimeServiceProvider } from "../Realtime/RealtimeServiceProvider";

const useSecureProtocols = import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_SECURE_PROTOCOLS !== "false";
const httpProtocol = useSecureProtocols ? "https" : "http";
// const wsProtocol = useSecureProtocols ? "wss" : "ws";
export const GraphQLHTTPUrl = `${httpProtocol}://${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN}/v1/graphql`;

async function createUrqlClient(
    isAuthenticated: boolean,
    conferenceSlug: string | undefined,
    userId: string | undefined,
    getAccessTokenSilently: (options?: any) => Promise<string>
): Promise<UrqlClient> {
    // const authLink = setContext(async (_, { headers }) => {
    //     const newHeaders: any = { ...headers };

    //     const sendRequestUnauthenticated = headers ? headers["SEND-WITHOUT-AUTH"] === true : false;
    //     delete newHeaders["SEND-WITHOUT-AUTH"];

    //     if (isAuthenticated && !sendRequestUnauthenticated) {
    //         const token = await getAccessTokenSilently();
    //         newHeaders.Authorization = `Bearer ${token}`;
    //     }

    //     newHeaders["x-hasura-conference-slug"] = conferenceSlug;

    //     return {
    //         headers: newHeaders,
    //     };
    // });

    const client = createClient({
        url: GraphQLHTTPUrl,
        exchanges: [
            dedupExchange,
            // TODO: requestPolicyExchange: @urql/exchange-request-policy
            offlineExchange({
                keys: {
                    analytics_ElementTotalViews: (data) => data.elementId as string,
                    analytics_ItemTotalViews: (data) => data.itemId as string,
                    chat_Pin: (data) => data.chatId + ":" + data.registrantId,
                    chat_Reaction: (data) => data.sId as string,
                    chat_ReadUpToIndex: (data) => data.chatId + ":" + data.registrantId,
                    chat_Subscription: (data) => data.chatId + ":" + data.registrantId,
                    conference_Configuration: (data) => data.key + ":" + data.conferenceId,
                    FlatUnuathPermission: (data) => data.slug + ":" + data.permission_name,
                    FlatUserPermission: (data) => data.slug + ":" + data.permission_name + ":" + data.user_id,
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
            // TODO: authExchange: https://formidable.com/open-source/urql/docs/advanced/authentication/
            // TODO: retryExchange: https://formidable.com/open-source/urql/docs/advanced/retry-operations/
            fetchExchange,
        ],
    });

    return client;
}

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
        client: UrqlClient;
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
                    const newClient = await createUrqlClient(
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
                    console.error("Failed to set up Urql client.", e);
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
    const ctx: UrqlContext = useMemo(
        () => ({
            reconnect,
        }),
        [reconnect]
    );

    if (!client || client.slug !== conferenceSlug) {
        return <>Loading...</>;
    }

    return (
        <UrqlContext.Provider value={ctx}>
            {realtimeToken ? (
                <RealtimeServiceProvider token={realtimeToken}>
                    <PresenceStateProvider>
                        <Provider value={client.client}>{children}</Provider>
                    </PresenceStateProvider>
                </RealtimeServiceProvider>
            ) : (
                <Provider value={client.client}>{children}</Provider>
            )}
        </UrqlContext.Provider>
    );
}

export default function UrqlProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
    const location = useLocation();
    const matches = location.pathname.match(/^\/conference\/([^/]+)/);
    const conferenceSlug = matches && matches.length > 1 ? matches[1] : undefined;

    if (isLoading) {
        return <>Loading...</>;
    }

    return (
        <UrqlProviderInner
            isAuthenticated={isAuthenticated}
            getAccessTokenSilently={getAccessTokenSilently}
            user={user}
            conferenceSlug={conferenceSlug}
        >
            {children}
        </UrqlProviderInner>
    );
}
