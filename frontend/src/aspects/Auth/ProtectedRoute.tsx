import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Center, Spinner } from "@chakra-ui/react";
import React from "react";
import { Redirect, Route, RouteComponentProps, RouteProps } from "react-router-dom";
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
        return (
            <Center w="100%" h="100%">
                <div>
                    <Spinner />
                </div>
            </Center>
        );
    }

    return (
        <Route
            component={withAuthenticationRequired(component, {
                onRedirecting: function waitRedirecting() {
                    return (
                        <Center w="100%" h="100%">
                            <div>
                                <Spinner />
                            </div>
                        </Center>
                    );
                },
                returnTo: () => {
                    return redirectTo ?? window.location.href;
                },
            })}
            {...args}
        />
    );
}
