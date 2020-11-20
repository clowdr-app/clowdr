import { AppState as Auth0State, Auth0Provider } from "@auth0/auth0-react";
import assert from "assert";
import React from "react";
import { useHistory } from "react-router-dom";

export default function Auth0CustomProvider({
    children,
}: {
    children: JSX.Element | Array<JSX.Element>;
}) {
    const domain = import.meta.env.SNOWPACK_PUBLIC_AUTH_DOMAIN;
    const clientId = import.meta.env.SNOWPACK_PUBLIC_AUTH_CLIENT_ID;
    const redirectUri = import.meta.env.SNOWPACK_PUBLIC_AUTH_LOGIN_CALLBACK_URL;

    assert(
        domain,
        "Auth0 Domain not provided - remember to set the environment variable."
    );
    assert(
        clientId,
        "Auth0 Client ID not provided - remember to set the environment variable."
    );
    assert(
        redirectUri,
        "Auth0 Callback URL not provided - remember to set the environment variable."
    );

    const history = useHistory();

    const onRedirectCallback = (appState: Auth0State) => {
        history.push(appState?.returnTo || window.location.pathname);
    };

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            redirectUri={redirectUri}
            onRedirectCallback={onRedirectCallback}
            useRefreshTokens={true}
            cacheLocation={"localstorage"}
            audience={"hasura"}
            scope={"user"}
        >
            {children}
        </Auth0Provider>
    );
}
