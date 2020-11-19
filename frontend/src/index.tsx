import "./index.css";

import {
    ApolloClient,
    ApolloProvider,
    HttpLink,
    InMemoryCache,
    split,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

const httpLink = new HttpLink({
    uri: `http${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API}/v1/graphql`,
    // headers: {
    //     "x-hasura-admin-secret": "XXXXX"
    // }
});

// Create a WebSocket link:
const wsLink = new WebSocketLink({
    uri: `ws${import.meta.env.SNOWPACK_PUBLIC_GRAPHQL_API}/v1/graphql`, // use wss for a secure endpoint
    options: {
        reconnect: true,
    },
});

const link = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
        );
    },
    wsLink,
    httpLink
);

const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
});

ReactDOM.render(
    <React.StrictMode>
        <ApolloProvider client={client}>
            <App />
        </ApolloProvider>
    </React.StrictMode>,
    document.getElementById("root")
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
