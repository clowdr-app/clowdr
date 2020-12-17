import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Spinner } from "@chakra-ui/react";
import React, { ComponentType } from "react";
import { Redirect, Route, RouteComponentProps, RouteProps } from "react-router-dom";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

export default function ProtectedRoute({
    component,
    altIfNotAuthed,
    ...args
}: {
    altIfNotAuthed?: JSX.Element;
    component: RouteComponentProps<any> | ComponentType<any>;
} & RouteProps): JSX.Element {
    const { isAuthenticated, error } = useAuth0();
    const user = useMaybeCurrentUser();

    if (error) {
        return <Route {...args} component={() => <Redirect to="/" />} />;
    }

    if (altIfNotAuthed && !isAuthenticated) {
        return altIfNotAuthed;
    }

    if (isAuthenticated && !user.user) {
        return <Spinner />;
    }

    return (
        <Route
            component={withAuthenticationRequired(component, {
                onRedirecting: function waitRedirecting() {
                    return <Spinner />;
                },
            })}
            {...args}
        />
    );
}
