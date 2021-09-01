import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

export default function SignupButton({
    asMenuItem,
    redirectTo,
    size,
    emailHint,
    isLoading,
    colorScheme,
}: {
    size?: string;
    asMenuItem?: boolean;
    redirectTo?: string;
    emailHint?: string;
    isLoading?: boolean;
    colorScheme?: string;
}): JSX.Element {
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    const location = useLocation();
    const redirectUri = useMemo(() => `${window.location.origin}/auth0/email-verification/result`, []);

    const opts = {
        screen_hint: "signup",
        login_hint: emailHint,
        redirectUri,
        appState: {
            returnTo: redirectTo ?? location.pathname.endsWith("/logged-out") ? "/user" : location.pathname,
        },
    };

    return isAuthenticated ? (
        <></>
    ) : asMenuItem ? (
        <MenuItem size={size ?? "sm"} onClick={() => loginWithRedirect(opts)} colorScheme={colorScheme ?? "purple"}>
            Sign Up
        </MenuItem>
    ) : (
        <Button
            isLoading={isLoading}
            size={size ?? "sm"}
            onClick={() => loginWithRedirect(opts)}
            colorScheme={colorScheme ?? "purple"}
        >
            Sign Up
        </Button>
    );
}
