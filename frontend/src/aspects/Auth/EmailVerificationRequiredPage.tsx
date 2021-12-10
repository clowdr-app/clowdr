import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";
import { getCachedInviteCode } from "../Users/NewUser/InviteCodeLocalStorage";
import { useTitle } from "../Utils/useTitle";
import LoginButton from "./Buttons/LoginButton";
import { FormattedMessage, useIntl } from 'react-intl'

export default function EmailVerificationRequiredPage({
    message,
    success
}: {
    success: boolean;
    message: string | null;
}): JSX.Element {
    const intl = useIntl();
    const title = useTitle(intl.formatMessage({ id: 'auth.emailverificationrequiredpage.title', defaultMessage: "Email verification required" }));

    const cachedInviteCode = getCachedInviteCode();
    let continuationPath: string | undefined;
    if (cachedInviteCode) {
        continuationPath = `/invitation/accept/${cachedInviteCode}`;
    }

    const alreadyUsed = message?.toLowerCase().includes("url can only be used once");

    return (
        <>
            {title}
            <FAIcon iconStyle="s" icon="envelope" fontSize="6xl" />
            <Heading as="h1" id="page-heading" fontSize="3xl" lineHeight="revert">
                {success || alreadyUsed
                    ? intl.formatMessage({ id: 'auth.emailverificationrequiredpage.emailverified', defaultMessage: "Your email was verified. You can now log in." })
                    : message ?? intl.formatMessage({ id: 'auth.emailverificationrequiredpage.pleaseverify', defaultMessage: "Please verify your email address" })}
            </Heading>
            {!message && !alreadyUsed ? (
                <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                    <FormattedMessage
                        id="auth.emailverificationrequiredpage.pleaseverify"
                        defaultMessage="
                            Before you can login you must verify your email address<br>
                            <b>You should have received an email from our domain</b>
                            &nbsp;with your verification link. After verifying your email, please log in to continue.
                        "
                    />
                </Text>
            ) : undefined}
            <Text>
                {success || alreadyUsed ? (
                    <LoginButton size="lg" redirectTo={continuationPath ?? "/"} />
                ) : (
                    <i>
                        <FormattedMessage
                            id="auth.emailverificationrequiredpage.youcanclose"
                            defaultMessage="You can now close this page while you wait for your verification email."
                        />
                    </i>
                )}
            </Text>
        </>
    );
}
