import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React from "react";

export default function LogoutButton({ asMenuItem }: { asMenuItem?: boolean }): JSX.Element {
    const { logout } = useAuth0();
    const returnTo = import.meta.env.SNOWPACK_PUBLIC_AUTH_LOGOUT_CALLBACK_URL;

    return asMenuItem ? (
        <MenuItem size="sm" onClick={() => logout({ returnTo })} colorScheme="red">
            Log Out
        </MenuItem>
    ) : (
        <Button size="sm" onClick={() => logout({ returnTo })} colorScheme="red" role="menuitem">
            Log Out
        </Button>
    );
}
