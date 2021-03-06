import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React from "react";
import { useLocation } from "react-router-dom";
import MenuButton from "../../Menu/V2/MenuButton";

export default function LoginButton({
    asMenuItem,
    asMenuButtonV2,
    redirectTo,
    size,
    emailHint,
    isLoading,
}: {
    size?: string;
    asMenuItem?: boolean;
    asMenuButtonV2?: boolean;
    redirectTo?: string;
    emailHint?: string;
    isLoading?: boolean;
}): JSX.Element {
    const { loginWithRedirect } = useAuth0();
    const location = useLocation();

    const redirectUri = import.meta.env.SNOWPACK_PUBLIC_AUTH_CALLBACK_URL + "/logged-in";
    const opts = {
        redirectUri,
        login_hint: emailHint,
        appState: {
            returnTo: redirectTo ?? location.pathname.startsWith("/logged-out") ? "/user" : location.pathname,
        },
    };

    return asMenuButtonV2 ? (
        <MenuButton
            label="Login"
            iconStyle="s"
            icon="sign-in-alt"
            borderRadius={0}
            colorScheme="green"
            side="right"
            onClick={() => loginWithRedirect(opts)}
        />
    ) : asMenuItem ? (
        <MenuItem size={size ?? "sm"} onClick={() => loginWithRedirect(opts)} colorScheme="purple">
            Log In
        </MenuItem>
    ) : (
        <Button
            isLoading={isLoading}
            size={size ?? "sm"}
            onClick={() => loginWithRedirect(opts)}
            colorScheme="purple"
            role="menuitem"
        >
            Log In
        </Button>
    );
}
