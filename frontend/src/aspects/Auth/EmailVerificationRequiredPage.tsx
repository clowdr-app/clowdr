import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";
import { getCachedInviteCode } from "../Users/NewUser/InviteCodeLocalStorage";
import { useTitle } from "../Utils/useTitle";
import LoginButton from "./Buttons/LoginButton";

export default function EmailVerificationRequiredPage({
    message,
    success,
}: {
    success: boolean;
    message: string | null;
}): JSX.Element {
    const title = useTitle("Email verification required");

    const cachedInviteCode = getCachedInviteCode();
    let continuationPath: string | undefined;
    if (cachedInviteCode) {
        continuationPath = `/invitation/accept/${cachedInviteCode}`;
    }

    return (
        <>
            {title}
            <FAIcon iconStyle="s" icon="envelope" fontSize="6xl" />
            <Heading as="h1" id="page-heading" fontSize="3xl" lineHeight="revert">
                {success
                    ? "Your email was verified. You can now log in."
                    : message ?? "Please verify your email address"}
            </Heading>
            {!message ? (
                <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                    Before you can login you must verify your email address.{" "}
                    <b>
                        You should have received an email from&nbsp;
                        <i>welcome@clowdr.org</i>
                    </b>
                    &nbsp;with your verification link. After verifying your email, please log in to continue.
                </Text>
            ) : undefined}
            <Text>
                {success ? (
                    <LoginButton size="lg" redirectTo={continuationPath ?? "/"} />
                ) : (
                    <i>You can now close this page while you wait for your verification email.</i>
                )}
            </Text>
        </>
    );
}
