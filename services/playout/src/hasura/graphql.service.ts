import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject, split } from "@apollo/client/core";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import fetch from "cross-fetch";
import WebSocket from "ws";
import { HASURA_MODULE_OPTIONS } from "../constants";
import { HasuraDataModuleOptions } from "./hasura-data.module";

@Injectable()
export class GraphQlService implements OnModuleInit {
    private readonly logger: Bunyan;
    private readonly config: HasuraDataModuleOptions;
    private _apolloClient: ApolloClient<NormalizedCacheObject>;

    get apolloClient(): ApolloClient<NormalizedCacheObject> {
        return this._apolloClient;
    }

    constructor(@RootLogger() logger: Bunyan, @Inject(HASURA_MODULE_OPTIONS) config: HasuraDataModuleOptions) {
        this.config = config;
        this.logger = logger.child({ component: this.constructor.name });
    }
    onModuleInit(): void {
        const httpProtocol = this.config.useSecureProtocols ? "https" : "http";
        const wsProtocol = this.config.useSecureProtocols ? "wss" : "ws";

        const httpLink = new HttpLink({
            uri: `${httpProtocol}://${this.config.graphQlApiDomain}/v1/graphql`,
            headers: {
                "x-hasura-admin-secret": this.config.hasuraAdminSecret,
            },
            fetch,
        });

        const wsLink = new WebSocketLink({
            uri: `${wsProtocol}://${this.config.graphQlApiDomain}/v1/graphql`, // use wss for a secure endpoint
            options: {
                reconnect: true,
                connectionParams: async () => {
                    return {
                        headers: {
                            "x-hasura-admin-secret": this.config.hasuraAdminSecret,
                        },
                    };
                },
            },
            webSocketImpl: WebSocket,
        });

        const link = split(
            ({ query }) => {
                const definition = getMainDefinition(query);
                return definition.kind === "OperationDefinition" && definition.operation === "subscription";
            },
            wsLink,
            httpLink
        );

        const cache = new InMemoryCache();

        this._apolloClient = new ApolloClient({
            link,
            cache,
            defaultOptions: {
                query: {
                    fetchPolicy: "network-only",
                    partialRefetch: true,
                },
            },
        });
    }
}
