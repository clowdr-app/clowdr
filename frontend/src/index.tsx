import React from "react";
import ReactDOM from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Auth0CustomProvider from "./aspects/Auth/Auth0CustomProvider";
import ChakraCustomProvider from "./aspects/Chakra/ChakraCustomProvider";
import { VonageGlobalStateProvider } from "./aspects/Conference/Attend/Room/Vonage/VonageGlobalStateProvider";
import ApolloCustomProvider from "./aspects/GQL/ApolloCustomProvider";
import { UXChoiceProvider } from "./aspects/UXChoice/UXChoice";
import UXChoiceDialog from "./aspects/UXChoice/UXChoiceDialog";
import "./index.css";

ReactDOM.render(
    <React.StrictMode>
        <VonageGlobalStateProvider>
            <HelmetProvider>
                <BrowserRouter>
                    <Auth0CustomProvider>
                        <ApolloCustomProvider>
                            <ChakraCustomProvider>
                                <UXChoiceProvider>
                                    <UXChoiceDialog />
                                    <App />
                                </UXChoiceProvider>
                            </ChakraCustomProvider>
                        </ApolloCustomProvider>
                    </Auth0CustomProvider>
                </BrowserRouter>
            </HelmetProvider>
        </VonageGlobalStateProvider>
    </React.StrictMode>,
    document.getElementById("root")
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
