import { useAuth0 } from "@auth0/auth0-react";
import { Button, MenuItem } from "@chakra-ui/react";
import React from "react";

export default function SignupButton({ asMenuItem }: { asMenuItem?: boolean }): JSX.Element {
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    return isAuthenticated ? (
        <></>
    ) : asMenuItem ? (
        <MenuItem size="sm" onClick={() => loginWithRedirect({ screen_hint: "signup" })} colorScheme="blue">
            Sign Up
        </MenuItem>
    ) : (
        <Button
            size="sm"
            onClick={() => loginWithRedirect({ screen_hint: "signup" })}
            colorScheme="blue"
            role="menuitem"
        >
            Sign Up
        </Button>
    );
}
