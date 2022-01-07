import React, { useState } from "react";
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
import { IntlProvider } from 'react-intl';
import messages_en from "./lang-compiled/en.json";
// import messages_pt from "./lang-compiled/pt.json";
// import messages_de from "./lang-compiled/de.json";
// import messages_it from "./lang-compiled/it.json";

function loadLocaleData(locale: string) {
    switch (locale) {
        case 'pt':
        case 'pt-br':
        case 'pt-BR':
            // return messages_pt;
        case 'de':
        case 'de-DE':
            // return messages_de;
        case 'it':
        case 'it-IT':
            // return messages_it;
        default:
            return messages_en;
    }
}

async function bootstrapApplication() {
    // const [locale, setLocale] = useRestorableState<string>(
    //     "clowdr-language",
    //     'en',
    //     (x) => JSON.stringify(x),
    //     (x) => JSON.parse(x)
    // );
    // const [locale, setLocale] = useState('en');
    const locale = navigator.language || 'en';
    ReactDOM.render(
        <React.StrictMode>
            <IntlProvider
                locale={locale}
                defaultLocale='en'
                messages={loadLocaleData(locale)}
            >
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
            </IntlProvider>
        </React.StrictMode>,
        document.getElementById("root"));
}

bootstrapApplication();

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
    import.meta.hot.accept();
}
