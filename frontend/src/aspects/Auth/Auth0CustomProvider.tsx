import type { AppState as Auth0State} from "@auth0/auth0-react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import assert from "assert";
import React, { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { useHistory } from "react-router-dom";

export default function Auth0CustomProvider({ children }: { children: JSX.Element | Array<JSX.Element> }): JSX.Element {
    const domain = import.meta.env.SNOWPACK_PUBLIC_AUTH_DOMAIN;
    const clientId = import.meta.env.SNOWPACK_PUBLIC_AUTH_CLIENT_ID;
    const redirectUri = useMemo(() => `${window.location.origin}/auth0`, []);

    assert(domain, "Auth0 Domain not provided - remember to set the environment variable.");
    assert(clientId, "Auth0 Client ID not provided - remember to set the environment variable.");
    assert(redirectUri, "Auth0 Callback URL not provided - remember to set the environment variable.");

    const history = useHistory();

    const onRedirectCallback = (appState: Auth0State) => {
        if (appState?.returnTo) {
            window.location.replace(appState?.returnTo);
        } else {
            history.replace(window.location.pathname);
        }
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
        return <>
            <FormattedMessage
                id="auth.auth0customprovider.loading"
                defaultMessage="Loading..."
            />
        </>;
    }

    return <>{children}</>;
}
