import { useAuth0 } from "@auth0/auth0-react";
import { Heading, Text } from "@chakra-ui/react";
import React, { useEffect } from "react";
import LinkButton from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";
import { useNoPrimaryMenuButtons } from "../Menu/usePrimaryMenuButtons";
import { useTitle } from "../Utils/useTitle";

export default function EmailVerificationRequiredPage({ noRedirect }: { noRedirect: boolean }): JSX.Element {
    const { logout } = useAuth0();

    useNoPrimaryMenuButtons();
    const title = useTitle("Email verification required");

    useEffect(() => {
        if (!noRedirect) {
            let returnTo = import.meta.env.SNOWPACK_PUBLIC_AUTH_LOGOUT_CALLBACK_URL;
            returnTo =
                returnTo.substr(0, returnTo.length - "logged-out".length) + "email-verification-required/no-redirect";
            logout({
                returnTo,
            });
        }
    }, [logout, noRedirect]);

    return (
        <>
            {title}
            <FAIcon iconStyle="s" icon="envelope" fontSize="6xl" />
            <Heading as="h1" fontSize="4xl" lineHeight="revert">
                Please verify your email
            </Heading>
            <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                Before you can login you must verify your email address.{" "}
                <b>
                    You should have received an email from&nbsp;
                    <i>no-reply@auth0user.net</i>
                </b>
                &nbsp;with your verification link. After verifying your email, please log in again.
            </Text>
            <LinkButton to="/">Go to home page</LinkButton>
        </>
    );
}
