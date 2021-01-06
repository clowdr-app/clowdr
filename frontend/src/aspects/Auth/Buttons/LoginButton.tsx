import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@chakra-ui/react";
import React from "react";

export default function LoginButton(): JSX.Element {
    const { loginWithRedirect } = useAuth0();

    return (
        <Button size="sm" onClick={() => loginWithRedirect()} colorScheme="green" role="menuitem">
            Log In
        </Button>
    );
}
