import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Auth0CustomProvider from "./components/auth0/Auth0CustomProvider";
import ChakraCustomProvider from "./components/chakra/ChakraCustomProvider";
import ApolloCustomProvider from "./components/gql/ApolloCustomProvider";
import "./index.css";

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <ChakraCustomProvider>
                <Auth0CustomProvider>
                    <ApolloCustomProvider>
                        <App />
                    </ApolloCustomProvider>
                </Auth0CustomProvider>
            </ChakraCustomProvider>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById("root")
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
