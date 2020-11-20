import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Spinner } from "@chakra-ui/react";
import React, { ComponentType } from "react";
import { Redirect, Route, RouteProps } from "react-router-dom";

export default function ProtectedRoute<P extends object>({
    component,
    ...args
}: {
    component: ComponentType<P>;
} & RouteProps) {
    const { error } = useAuth0();

    if (error) {
        return <Redirect to="/" />;
    }

    return (
        <Route
            component={withAuthenticationRequired(component, {
                onRedirecting: () => <Spinner />,
            })}
            {...args}
        />
    );
}
