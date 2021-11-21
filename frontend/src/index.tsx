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
import ApolloCustomProvider from "./aspects/GQL/ApolloCustomProvider";
import { UXChoiceProvider } from "./aspects/UXChoice/UXChoice";
import UXChoiceDialog from "./aspects/UXChoice/UXChoiceDialog";
import "./index.css";
import messages_pt from "./lang-compiled/pt.json";
import messages_en from "./lang-compiled/en.json";

function loadLocaleData(locale: string) {
  switch (locale) {
    case 'pt':
    case 'pt-br':
    case 'pt-BR':
      return messages_pt;
    default:
      return messages_en;
  }
}

async function bootstrapApplication() {
    const locale = navigator.language || 'en';
    const messages = await loadLocaleData(locale);
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
                                                <App locale={locale} messages={messages} />
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
