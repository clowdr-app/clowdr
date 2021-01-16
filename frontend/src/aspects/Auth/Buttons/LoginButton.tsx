import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React from "react";
import { useLocation } from "react-router-dom";

export default function LoginButton({
    asMenuItem,
    redirectTo,
    size,
}: {
    size?: string;
    asMenuItem?: boolean;
    redirectTo?: string;
}): JSX.Element {
    const { loginWithRedirect } = useAuth0();
    const location = useLocation();

    const redirectUri = import.meta.env.SNOWPACK_PUBLIC_AUTH_CALLBACK_URL + "/logged-in";
    const opts = {
        redirectUri,
        appState: {
            returnTo: redirectTo ?? location.pathname,
        },
    };

    return asMenuItem ? (
        <MenuItem size={size ?? "sm"} onClick={() => loginWithRedirect(opts)} colorScheme="green">
            Log In
        </MenuItem>
    ) : (
        <Button size={size ?? "sm"} onClick={() => loginWithRedirect(opts)} colorScheme="green" role="menuitem">
            Log In
        </Button>
    );
}
