import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Box, Spinner } from "@chakra-ui/react";
import React from "react";
import { Redirect, Route, RouteComponentProps, RouteProps } from "react-router-dom";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

export default function ProtectedRoute({
    component,
    altIfNotAuthed,
    ...args
}: {
    altIfNotAuthed?: JSX.Element;
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
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    return (
        <Route
            component={withAuthenticationRequired(component, {
                onRedirecting: function waitRedirecting() {
                    return (
                        <Box>
                            <Spinner />
                        </Box>
                    );
                },
            })}
            {...args}
        />
    );
}
