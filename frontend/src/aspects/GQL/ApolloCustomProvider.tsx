import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, NormalizedCacheObject, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/link-context";
import { useAuth0 } from "@auth0/auth0-react";
import { Mutex } from "async-mutex";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

interface TokenCacheEntry {
    token: string;
    expiresAt: number;
}

class AuthTokenCache {
    static readonly CacheKey = "CLOWDR_AUTH_CACHE";
    static readonly TokenExpiryTime = (36000 - 60) * 1000;

    mutex: Mutex;
    tokens: Map<string, TokenCacheEntry>;

    constructor() {
        this.tokens = new Map();
        this.mutex = new Mutex();

        try {
            const tokenCacheStr = window.localStorage.getItem(AuthTokenCache.CacheKey);
            if (tokenCacheStr) {
                const tokenCache = JSON.parse(tokenCacheStr);
                this.tokens = new Map<string, TokenCacheEntry>(tokenCache);
            } else {
                this.clearAllLocalStorage();
            }
        } catch (e) {
            console.log("Failed to initialise token cache!");
            this.clearAllLocalStorage();
        }

        // This is a dirty hack for now
        setTimeout(() => {
            window.location.reload();
        }, AuthTokenCache.TokenExpiryTime);
    }

    clearAllLocalStorage() {
        window.localStorage.clear();
        this.tokens = new Map<string, TokenCacheEntry>();
        this.saveCache();
    }

    saveCache() {
        const serialisableCache = [...this.tokens.entries()];
        window.localStorage.setItem(AuthTokenCache.CacheKey, JSON.stringify(serialisableCache));
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
                    "conference-slug": conferenceSlug ?? undefined,
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
            console.error("Major error! Failed to get authentication token!", e);
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
    tokenCache: AuthTokenCache,
    existingClient?: ApolloClient<NormalizedCacheObject>
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
            presence_Page: {
                keyFields: ["path", "conferenceId"],
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
    reconnect: () => Promise<void>;
}

const ApolloCustomContext = React.createContext<ApolloCustomCtx | null>(null);

export function useApolloCustomContext(): ApolloCustomCtx {
    const ctx = React.useContext(ApolloCustomContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider? (useApolloCustomContext)");
    }
    return ctx;
}

export default function ApolloCustomProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
    const tokenCache = useRef<AuthTokenCache>(new AuthTokenCache());

    const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>();
    const location = useLocation();
    const conferenceSlug = useMemo(() => {
        const matches = location.pathname.match(/^\/conference\/([^/]+)/);
        if (matches && matches.length > 1) {
            return matches[1];
        }
        return undefined;
    }, [location.pathname]);

    const _reconnect = useCallback(
        async (websocketOnly?: boolean) => {
            if (!isLoading) {
                const newClient = await createApolloClient(
                    isAuthenticated,
                    conferenceSlug,
                    user?.sub,
                    getAccessTokenSilently,
                    tokenCache.current,
                    websocketOnly ? client : undefined
                );
                setClient(newClient);
            }
        },
        [client, conferenceSlug, getAccessTokenSilently, isAuthenticated, isLoading, user?.sub]
    );

    const reconnect = useCallback(async () => {
        _reconnect(true);
    }, [_reconnect]);

    if (client === undefined) {
        _reconnect();
        return <AppLoadingScreen />;
    }

    // TODO: ApolloCustomContext
    return (
        <ApolloCustomContext.Provider value={{ reconnect }}>
            <ApolloProvider client={client}>{children}</ApolloProvider>
        </ApolloCustomContext.Provider>
    );
}
