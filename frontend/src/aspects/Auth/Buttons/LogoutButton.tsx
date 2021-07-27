import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem, Tooltip } from "@chakra-ui/react";
import React, { useMemo } from "react";
import FAIcon from "../../Icons/FAIcon";

export default function LogoutButton({ asMenuItem }: { asMenuItem?: boolean }): JSX.Element {
    const { logout } = useAuth0();
    const returnTo = useMemo(() => `${window.location.origin}/auth0/logged-out`, []);

    return asMenuItem ? (
        <MenuItem size="sm" onClick={() => logout({ returnTo })}>
            <FAIcon iconStyle="s" icon="sign-out-alt" mr={2} aria-hidden={true} /> Log Out
        </MenuItem>
    ) : (
        <Tooltip label="Log out">
            <Button
                size="sm"
                onClick={() => logout({ returnTo })}
                colorScheme="red"
                role="menuitem"
                aria-label="Log out"
            >
                <FAIcon iconStyle="s" icon="sign-out-alt" aria-hidden={true} />
            </Button>
        </Tooltip>
    );
}
