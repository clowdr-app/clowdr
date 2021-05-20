import { Heading } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";
import LoginButton from "./Buttons/LoginButton";

export default function PasswordResetResultPage({
    message,
    success,
}: {
    message: string | null;
    success: boolean;
}): JSX.Element {
    return (
        <>
            <FAIcon iconStyle="s" icon={success ? "check" : "times"} fontSize="6xl" />
            <Heading as="h1" id="page-heading" fontSize="4xl" lineHeight="revert">
                {success ? "Your password was reset" : message ?? "Password reset - status unknown"}
            </Heading>
            <LoginButton size="lg" asMenuItem={false} />
        </>
    );
}
