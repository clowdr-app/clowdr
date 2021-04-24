import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import React from "react";
import { Redirect, Route, RouteComponentProps, RouteProps } from "react-router-dom";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

export default function ProtectedRoute({
    component,
    altIfNotAuthed,
    redirectTo,
    ...args
}: {
    altIfNotAuthed?: JSX.Element;
    redirectTo?: string;
    component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
} & RouteProps): JSX.Element {
    const { isAuthenticated, error } = useAuth0();
    const { user } = useMaybeCurrentUser();

    if (error) {
        return <Route {...args} component={() => <Redirect to="/" />} />;
    }

    if (altIfNotAuthed && !isAuthenticated) {
        return altIfNotAuthed;
    }

    if (isAuthenticated && !user) {
        return <CenteredSpinner />;
    }

    return (
        <Route
            component={withAuthenticationRequired(component, {
                onRedirecting: function waitRedirecting() {
                    return <CenteredSpinner />;
                },
                returnTo: () => {
                    return redirectTo ?? window.location.href;
                },
            })}
            {...args}
        />
    );
}
