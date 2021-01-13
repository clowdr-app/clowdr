import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React from "react";

export default function LoginButton({ asMenuItem }: { asMenuItem?: boolean }): JSX.Element {
    const { loginWithRedirect } = useAuth0();

    return asMenuItem ? (
        <MenuItem size="sm" onClick={() => loginWithRedirect()} colorScheme="green">
            Log In
        </MenuItem>
    ) : (
        <Button size="sm" onClick={() => loginWithRedirect()} colorScheme="green" role="menuitem">
            Log In
        </Button>
    );
}
