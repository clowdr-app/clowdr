import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React from "react";
import { useLocation } from "react-router-dom";

export default function SignupButton({
    asMenuItem,
    redirectTo,
    size,
}: {
    size?: string;
    asMenuItem?: boolean;
    redirectTo?: string;
}): JSX.Element {
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    const location = useLocation();
    const redirectUri = import.meta.env.SNOWPACK_PUBLIC_AUTH_CALLBACK_URL + "/email-verification/result";

    const opts = {
        screen_hint: "signup",
        redirectUri,
        appState: {
            returnTo: redirectTo ?? location.pathname.startsWith("/logged-out") ? "/user" : location.pathname,
        },
    };

    return isAuthenticated ? (
        <></>
    ) : asMenuItem ? (
        <MenuItem size={size ?? "sm"} onClick={() => loginWithRedirect(opts)} colorScheme="blue">
            Sign Up
        </MenuItem>
    ) : (
        <Button size={size ?? "sm"} onClick={() => loginWithRedirect(opts)} colorScheme="blue" role="menuitem">
            Sign Up
        </Button>
    );
}
