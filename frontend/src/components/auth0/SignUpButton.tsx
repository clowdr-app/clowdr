import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@chakra-ui/react";
import React from "react";

export default function SignupButton() {
    const { isAuthenticated, loginWithRedirect } = useAuth0();
    return isAuthenticated ? (
        <></>
    ) : (
        <Button
            onClick={() => loginWithRedirect({ screen_hint: "signup" })}
            colorScheme="purple"
        >
            Sign Up
        </Button>
    );
}
