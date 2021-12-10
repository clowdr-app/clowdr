import React from "react";
import ReactDOM from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppError } from "./AppError";
import Auth0CustomProvider from "./aspects/Auth/Auth0CustomProvider";
import ChakraCustomProvider from "./aspects/Chakra/ChakraCustomProvider";
import { VonageGlobalStateProvider } from "./aspects/Conference/Attend/Room/Vonage/VonageGlobalStateProvider";
import "./aspects/DataDog/DataDog";
import { useRestorableState } from "./aspects/Generic/useRestorableState";
import ApolloCustomProvider from "./aspects/GQL/ApolloCustomProvider";
import { UXChoiceProvider } from "./aspects/UXChoice/UXChoice";
import UXChoiceDialog from "./aspects/UXChoice/UXChoiceDialog";
import "./index.css";

async function bootstrapApplication() {
    const [locale, setLocale] = useRestorableState<string>(
        "clowdr-language",
        'en',
        (x) => JSON.stringify(x),
        (x) => JSON.parse(x)
    );
    ReactDOM.render(
        <React.StrictMode>
            <ErrorBoundary FallbackComponent={AppError}>
                    <VonageGlobalStateProvider>
                        <HelmetProvider>
                            <BrowserRouter>
                                <Auth0CustomProvider>
                                    <ApolloCustomProvider>
                                        <ChakraCustomProvider>
                                            <UXChoiceProvider>
                                                <UXChoiceDialog />
                                                <App locale={locale} />
                                            </UXChoiceProvider>
                                        </ChakraCustomProvider>
                                    </ApolloCustomProvider>
                                </Auth0CustomProvider>
                            </BrowserRouter>
                        </HelmetProvider>
                    </VonageGlobalStateProvider>
            </ErrorBoundary>
        </React.StrictMode>,
        document.getElementById("root"));
}

bootstrapApplication();

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
