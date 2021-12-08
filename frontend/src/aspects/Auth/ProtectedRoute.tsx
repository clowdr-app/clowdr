import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Button, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { RouteComponentProps, RouteProps } from "react-router-dom";
import { Redirect, Route } from "react-router-dom";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import FAIcon from "../Chakra/FAIcon";
import GenericErrorPage from "../Errors/GenericErrorPage";
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
    const { isAuthenticated, error, logout } = useAuth0();
    const { user } = useMaybeCurrentUser();
    const returnTo = useMemo(() => `${window.location.origin}/auth0/logged-out`, []);

    if (error) {
        return <Route {...args} component={() => <Redirect to="/" />} />;
    }

    if (altIfNotAuthed && !isAuthenticated) {
        return altIfNotAuthed;
    }

    if (user === false) {
        return (
            <GenericErrorPage heading="Sorry, an authentication error occurred…">
                <>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        User account was not found. Please contact tech support if this problem persists.
                    </Text>
                    <Button
                        onClick={() => logout({ returnTo })}
                        leftIcon={<FAIcon iconStyle="s" icon="sign-out-alt" aria-hidden={true} />}
                        colorScheme="ProtectedRoute"
                        role="menuitem"
                        aria-label="Log out"
                    >
                        Log out
                    </Button>
                </>
            </GenericErrorPage>
        );
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
