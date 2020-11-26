import {
    ButtonGroup,
    Divider,
    FormControl,
    Heading,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import LoginButton from "../../Auth/Buttons/LoginButton";
import SignupButton from "../../Auth/Buttons/SignUpButton";
import InviteCodeInput from "./InviteCodeInput";

export default function NewUserLandingPage(): JSX.Element {
    return (
        <VStack spacing={0} overflow="auto" margin="auto">
            <Heading
                as="h1"
                fontSize="4.25rem"
                lineHeight="4.25rem"
                fontWeight="thin"
                marginBottom="4rem"
            >
                Clowdr
            </Heading>
            <InviteCodeInput marginBottom="1.5rem" />
            <Divider marginBottom="1rem" />
            <FormControl textAlign="center">
                <Heading
                    as="h2"
                    fontSize="100%"
                    fontWeight="normal"
                    margin={0}
                    lineHeight="revert"
                    mb={3}
                >
                    To create a conference or to access an existing account,
                    please sign up or log in.
                </Heading>
                <ButtonGroup>
                    <SignupButton />
                    <LoginButton />
                </ButtonGroup>
            </FormControl>
        </VStack>
    );
}
