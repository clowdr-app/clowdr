import { ButtonGroup, FormControl, Heading } from "@chakra-ui/react";
import React from "react";
import LoginButton from "../../Auth/Buttons/LoginButton";
import SignupButton from "../../Auth/Buttons/SignUpButton";
import { useTitle } from "../../Utils/useTitle";

export default function NewUserLandingPage({ conferenceName }: { conferenceName?: string }): JSX.Element {
    const title = useTitle(conferenceName ?? "");

    return (
        <>
            {title}
            <Heading as="h1" fontSize="4.25rem" lineHeight="4.25rem" fontWeight="thin">
                Clowdr
            </Heading>
            <FormControl textAlign="center">
                <Heading as="h2" fontSize="lg" fontWeight="normal" margin={0} lineHeight="revert" mb={3}>
                    Please sign up or log in to use Clowdr.
                </Heading>
                <ButtonGroup>
                    <SignupButton size="lg" />
                    <LoginButton size="lg" />
                </ButtonGroup>
            </FormControl>
        </>
    );
}
