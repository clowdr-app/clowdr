import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useLocation } from "react-router-dom";
import MenuButton from "../../Menu/V2/MenuButton";

export default function LoginButton({
    asMenuItem,
    asMenuButtonV2,
    redirectTo,
    size,
    emailHint,
    isLoading,
    showLabel,
    colorScheme,
}: {
    size?: string;
    asMenuItem?: boolean;
    asMenuButtonV2?: boolean;
    redirectTo?: string;
    emailHint?: string;
    isLoading?: boolean;
    showLabel?: boolean;
    colorScheme?: string;
}): JSX.Element {
    const intl = useIntl();
    const { loginWithRedirect } = useAuth0();
    const location = useLocation();

    const redirectUri = useMemo(() => `${window.location.origin}/auth0/logged-in`, []);
    const opts = {
        redirectUri,
        login_hint: emailHint,
        appState: {
            returnTo: redirectTo ?? location.pathname.endsWith("/logged-out") ? "/user" : location.pathname,
        },
    };

    return asMenuButtonV2 ? (
        <MenuButton
            label={intl.formatMessage({ id: 'auth.buttons.loginbutton.login', defaultMessage: "Log In" })}
            iconStyle="s"
            icon="sign-in-alt"
            borderRadius={0}
            colorScheme="RightMenuButton"
            side="right"
            onClick={() => loginWithRedirect(opts)}
            mb={1}
            showLabel={showLabel}
        />
    ) : asMenuItem ? (
        <MenuItem
            size={size ?? "sm"}
            onClick={() => loginWithRedirect(opts)}
            colorScheme={colorScheme ?? "RightMenuButton"}
        >
            <FormattedMessage
                id="auth.buttons.loginbutton.login"
                defaultMessage="Log In"
            />
        </MenuItem>
    ) : (
        <Button
            isLoading={isLoading}
            size={size ?? "sm"}
            onClick={() => loginWithRedirect(opts)}
            colorScheme={colorScheme ?? "LoginButtonWithinPage"}
        >
            <FormattedMessage
                id="auth.buttons.loginbutton.login"
                defaultMessage="Log In"
            />
        </Button>
    );
}
