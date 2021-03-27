import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, NormalizedCacheObject, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/link-context";
import { useAuth0 } from "@auth0/auth0-react";
import { Mutex } from "async-mutex";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import AppLoadingScreen from "../../AppLoadingScreen";
import { PresenceStateProvider } from "../Presence/PresenceStateProvider";

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

interface TokenCacheEntry {
    token: string;
    expiresAt: number;
}

class AuthTokenCache {
    static readonly CacheVersion = "1.0";
    static readonly CacheKey = "CLOWDR_AUTH_CACHE";
    static readonly TokenExpiryTime = (36000 - 60) * 1000;

    mutex: Mutex;
    tokens: Map<string, TokenCacheEntry>;

    constructor() {
        this.tokens = new Map();
        this.mutex = new Mutex();

        try {
            if (this.validateCache()) {
                const tokenCacheStr = window.localStorage.getItem(AuthTokenCache.CacheKey);
                if (tokenCacheStr) {
                    const tokenCache = JSON.parse(tokenCacheStr);
                    this.tokens = new Map<string, TokenCacheEntry>(tokenCache);
                } else {
                    this.clearAllLocalStorage();
                }
            } else {
                console.log("Token cache version out of date. Clearing cache to upgrade...");
                this.clearAllLocalStorage();
            }
        } catch (e) {
            console.warn("Failed to initialise token cache!");
            this.clearAllLocalStorage();
        }

        // This is a dirty hack for now
        setTimeout(() => {
            window.location.reload();
        }, AuthTokenCache.TokenExpiryTime);
    }

    validateCache() {
        const version = window.localStorage.getItem(AuthTokenCache.CacheKey + "_VERSION");
        if (!version || version !== AuthTokenCache.CacheVersion) {
            return false;
        }
        return true;
    }

    clearAllLocalStorage() {
        window.localStorage.clear();
        this.tokens = new Map<string, TokenCacheEntry>();
        this.saveCache();
    }

    saveCache() {
        const serialisableCache = [...this.tokens.entries()];
        window.localStorage.setItem(AuthTokenCache.CacheKey, JSON.stringify(serialisableCache));
        window.localStorage.setItem(AuthTokenCache.CacheKey + "_VERSION", AuthTokenCache.CacheVersion);
    }

    async sha256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => ("00" + b.toString(16)).slice(-2)).join("");
        return hashHex;
    }

    public async getToken(
        userId: string | null,
        conferenceSlug: string | null | undefined,
        getAccessTokenSilently: (options?: any) => Promise<string>
    ) {
        const release = await this.mutex.acquire();

        try {
            const cacheKey = (await this.sha256(conferenceSlug ?? "<<NO-CONF>>")) + ">" + (userId ?? "<<NO-USER>>");
            let cacheEntry = this.tokens.get(cacheKey);
            if (cacheEntry) {
                if (cacheEntry.expiresAt < Date.now()) {
                    this.tokens.delete(cacheKey);
                    cacheEntry = undefined;
                }
            }

            if (!cacheEntry) {
                const token = await getAccessTokenSilently({
                    ignoreCache: true,
                    "conference-slug": conferenceSlug ?? "/NONE",
                });
                cacheEntry = {
                    token,
                    expiresAt: Date.now() + AuthTokenCache.TokenExpiryTime,
                };
            }

            this.tokens.set(cacheKey, cacheEntry);
            this.saveCache();

            return cacheEntry.token;
        } catch (e) {
            // Probably the Auth0 cookie got blocked

            console.error("Major error! Failed to get authentication token!", e);
            this.saveCache();

            // Nuke everything and hope Auth0 recovers the state
            localStorage.clear();
            sessionStorage.clear();

            throw e;
        } finally {
            release();
        }
    }
}

async function createApolloClient(
    isAuthenticated: boolean,
    conferenceSlug: string | undefined,
    userId: string | undefined,
    getAccessTokenSilently: (options?: any) => Promise<string>,
    tokenCache: AuthTokenCache
): Promise<ApolloClient<NormalizedCacheObject>> {
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

            let token: string;
            if (magicToken) {
                token = await getAccessTokenSilently({
                    ignoreCache: true,
                    "magic-token": magicToken,
                });
            } else {
                token = await tokenCache.getToken(userId ?? null, conferenceSlug, getAccessTokenSilently);
            }

            newHeaders.Authorization = `Bearer ${token}`;
        } else {
            const slugs = conferenceSlug ? [conferenceSlug] : [];
            newHeaders["X-Hasura-Conference-Slugs"] =
                "{" + slugs.reduce((acc, x) => `${acc},"${x}"`, "").substr(1) + "}";
            newHeaders["X-Hasura-Conference-Slug"] = conferenceSlug ?? "";
        }

        return {
            headers: newHeaders,
        };
    });

    const httpLink = new HttpLink({
        uri: `${httpProtocol}://${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN}/v1/graphql`,
    });

    const wsConnectionParams = await (async () => {
        if (isAuthenticated) {
            const token = await tokenCache.getToken(userId ?? null, conferenceSlug, getAccessTokenSilently);
            return {
                headers: {
                    Authorization: `Bearer ${token}`,
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
            chat_PinnedOrSubscribed: {
                keyFields: ["chatId", "attendeeId"],
            },
            AttendeeProfile: {
                keyFields: ["attendeeId"],
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
    tokenCache,
    conferenceSlug,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    isAuthenticated: boolean;
    getAccessTokenSilently: (options?: any) => Promise<string>;
    user: any;
    tokenCache: AuthTokenCache;
    conferenceSlug: string | undefined;
}): JSX.Element {
    const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);
    const [presenceToken, setPresenceToken] = useState<string | null>(null);

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
                        getAccessTokenSilently,
                        tokenCache
                    );
                    setClient(newClient);

                    if (isAuthenticated) {
                        const newPresenceToken = await tokenCache.getToken(
                            user?.sub,
                            conferenceSlug,
                            getAccessTokenSilently
                        );
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
        [conferenceSlug, getAccessTokenSilently, isAuthenticated, tokenCache, user?.sub]
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

    if (!client) {
        return <AppLoadingScreen />;
    }

    return (
        <ApolloCustomContext.Provider value={ctx}>
            {presenceToken ? (
                <PresenceStateProvider token={presenceToken}>
                    <ApolloProvider client={client}>{children}</ApolloProvider>
                </PresenceStateProvider>
            ) : (
                <ApolloProvider client={client}>{children}</ApolloProvider>
            )}
        </ApolloCustomContext.Provider>
    );
}

export default function ApolloCustomProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
    const tokenCache = useRef<AuthTokenCache>(new AuthTokenCache());
    const location = useLocation();
    const matches = location.pathname.match(/^\/conference\/([^/]+)/);
    const conferenceSlug = matches && matches.length > 1 ? matches[1] : undefined;

    if (isLoading) {
        return <AppLoadingScreen />;
    }

    return (
        <ApolloCustomProviderInner
            isAuthenticated={isAuthenticated}
            getAccessTokenSilently={getAccessTokenSilently}
            user={user}
            tokenCache={tokenCache.current}
            conferenceSlug={conferenceSlug}
        >
            {children}
        </ApolloCustomProviderInner>
    );
}
