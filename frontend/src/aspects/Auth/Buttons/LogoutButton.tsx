import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem, Tooltip, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import FAIcon from "../../Chakra/FAIcon";
import { defaultOutline_AsBoxShadow } from "../../Chakra/Outline";

export default function LogoutButton({
    asMenuItem,
    asMenuButton,
}: {
    asMenuItem?: boolean;
    asMenuButton?: boolean;
}): JSX.Element {
    const { logout } = useAuth0();
    const returnTo = useMemo(() => `${window.location.origin}/auth0/logged-out`, []);

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
            onClick={() => logout({ returnTo })}
        >
            <FAIcon iconStyle="s" icon="sign-out-alt" mr={2} aria-hidden={true} />
            Logout
        </Button>
    ) : asMenuItem ? (
        <MenuItem
            onClick={() => logout({ returnTo })}
            w="auto"
            p={3}
            overflow="hidden"
            flex="0 0 50%"
            justifyContent="flex-end"
            textAlign="right"
        >
            <FAIcon iconStyle="s" icon="sign-out-alt" mr={2} aria-hidden={true} /> Log Out
        </MenuItem>
    ) : (
        <Tooltip label="Log out">
            <Button
                size="sm"
                onClick={() => logout({ returnTo })}
                colorScheme="LogoutButtonWithinPage"
                role="menuitem"
                aria-label="Log out"
            >
                <FAIcon iconStyle="s" icon="sign-out-alt" aria-hidden={true} />
            </Button>
        </Tooltip>
    );
}
