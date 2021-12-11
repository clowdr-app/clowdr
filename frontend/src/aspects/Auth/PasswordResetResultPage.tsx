import { Heading } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";
import LoginButton from "./Buttons/LoginButton";
import { useIntl } from 'react-intl';


export default function PasswordResetResultPage({
    message,
    success,
}: {
    message: string | null;
    success: boolean;
}): JSX.Element {
    const intl = useIntl();
    return (
        <>
            <FAIcon iconStyle="s" icon={success ? "check" : "times"} fontSize="6xl" />
            <Heading as="h1" id="page-heading" fontSize="4xl" lineHeight="revert">
                {success ? intl.formatMessage({ id: 'auth.passwordresetresultpage.passwordreset', defaultMessage: "Your password was reset" }) : message ?? intl.formatMessage({ id: 'auth.passwordresetresultpage.statusunknown', defaultMessage: "Password reset - status unknown" })}
            </Heading>
            <LoginButton size="lg" asMenuItem={false} />
        </>
    );
}
