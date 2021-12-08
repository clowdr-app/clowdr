import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import FAIcon from "../../Chakra/FAIcon";
import { defaultOutline_AsBoxShadow } from "../../Chakra/Outline";

export default function LoginButton({
    asMenuItem,
    asMenuButton,
    redirectTo,
    size,
    emailHint,
    isLoading,
    colorScheme,
}: {
    size?: string;
    asMenuItem?: boolean;
    asMenuButton?: boolean;
    redirectTo?: string;
    emailHint?: string;
    isLoading?: boolean;
    colorScheme?: string;
}): JSX.Element {
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

    const buttonHoverBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonHoverBackgroundColor-light",
        "MainMenuHeaderBar.buttonHoverBackgroundColor-dark"
    );
    const buttonFocusBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonFocusBackgroundColor-light",
        "MainMenuHeaderBar.buttonFocusBackgroundColor-dark"
    );

    return asMenuButton ? (
        <Button
            aria-label="Login"
            variant="ghost"
            size="md"
            w="auto"
            h="calc(100% - 3px)"
            py={0}
            px={2}
            m="3px"
            borderRadius={0}
            _hover={{
                bgColor: buttonHoverBgColor,
            }}
            _focus={{
                bgColor: buttonFocusBgColor,
                boxShadow: defaultOutline_AsBoxShadow,
            }}
            _active={{
                bgColor: buttonFocusBgColor,
                boxShadow: defaultOutline_AsBoxShadow,
            }}
            onClick={() => loginWithRedirect(opts)}
        >
            <FAIcon iconStyle="s" icon="sign-in-alt" mr={2} aria-hidden={true} /> Login
        </Button>
    ) : asMenuItem ? (
        <MenuItem
            size={size ?? "sm"}
            onClick={() => loginWithRedirect(opts)}
            colorScheme={colorScheme ?? "RightMenuButton"}
        >
            Login
        </MenuItem>
    ) : (
        <Button
            isLoading={isLoading}
            size={size ?? "sm"}
            onClick={() => loginWithRedirect(opts)}
            colorScheme={colorScheme ?? "LoginButtonWithinPage"}
        >
            Login
        </Button>
    );
}
