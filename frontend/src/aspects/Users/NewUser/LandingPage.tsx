import { ButtonGroup, Divider, FormControl, Heading } from "@chakra-ui/react";
import React from "react";
import LoginButton from "../../Auth/Buttons/LoginButton";
import SignupButton from "../../Auth/Buttons/SignUpButton";
import { useNoPrimaryMenuButtons } from "../../Menu/usePrimaryMenuButtons";
import InviteCodeInput from "./InviteCodeInput";

export default function NewUserLandingPage({ conferenceName }: { conferenceName?: string }): JSX.Element {
    useNoPrimaryMenuButtons();

    return (
        <>
            <Heading as="h1" fontSize="4.25rem" lineHeight="4.25rem" fontWeight="thin" marginBottom="4rem">
                Clowdr
            </Heading>
            {conferenceName ? (
                <>
                    <Heading as="h2" fontSize="1.6rem" lineHeight="2.2rem" fontWeight="thin" marginBottom="2rem">
                        {conferenceName}
                    </Heading>
                </>
            ) : undefined}
            <InviteCodeInput
                message={conferenceName ? "Please enter the invite code you were sent by email." : undefined}
                marginBottom="1.5rem"
            />
            <Divider marginBottom="1rem" />
            <FormControl textAlign="center">
                <Heading as="h2" fontSize="100%" fontWeight="normal" margin={0} lineHeight="revert" mb={3}>
                    To create a conference or to access an existing account, please sign up or log in.
                </Heading>
                <ButtonGroup>
                    <SignupButton />
                    <LoginButton />
                </ButtonGroup>
            </FormControl>
        </>
    );
}
