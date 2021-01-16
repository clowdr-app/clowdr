import { AppState as Auth0State, Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import assert from "assert";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import AppLoadingScreen from "../../AppLoadingScreen";

export default function Auth0CustomProvider({ children }: { children: JSX.Element | Array<JSX.Element> }): JSX.Element {
    const domain = import.meta.env.SNOWPACK_PUBLIC_AUTH_DOMAIN;
    const clientId = import.meta.env.SNOWPACK_PUBLIC_AUTH_CLIENT_ID;
    const redirectUri = import.meta.env.SNOWPACK_PUBLIC_AUTH_CALLBACK_URL;

    assert(domain, "Auth0 Domain not provided - remember to set the environment variable.");
    assert(clientId, "Auth0 Client ID not provided - remember to set the environment variable.");
    assert(redirectUri, "Auth0 Callback URL not provided - remember to set the environment variable.");

    const history = useHistory();

    const onRedirectCallback = (appState: Auth0State) => {
        history.replace(appState?.returnTo || window.location.pathname);
    };

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            redirectUri={redirectUri + "/logged-in"}
            onRedirectCallback={onRedirectCallback}
            useRefreshTokens={true}
            cacheLocation={"localstorage"}
            audience={"hasura"}
            scope={"user"}
        >
            <WaitForAuth0>{children}</WaitForAuth0>
        </Auth0Provider>
    );
}

function WaitForAuth0({ children }: { children: JSX.Element | Array<JSX.Element> }): JSX.Element {
    const { isLoading } = useAuth0();

    if (isLoading) {
        return <AppLoadingScreen />;
    }

    return <>{children}</>;
}
