import { Heading, Link, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router-dom";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import FAIcon from "../Chakra/FAIcon";
import { LinkButton } from "../Chakra/LinkButton";
import { useTitle } from "../Hooks/useTitle";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

export default function LoggedOutPage(): JSX.Element {
    const title = useTitle("Logged Out");
    const mUser = useMaybeCurrentUser();

    if (mUser.loading) {
        return <CenteredSpinner spinnerProps={{ label: "Loading user info" }} caller="LoggedOutPage:15" />;
    }

    if (mUser.user) {
        return <Redirect to="/user" />;
    } else {
        return (
            <>
                {title}
                <FAIcon iconStyle="s" icon="door-open" fontSize="6xl" />
                <Heading as="h1" id="page-heading" fontSize="4xl" lineHeight="revert">
                    You have been logged out.
                </Heading>
                <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                    We hope you enjoyed using Midspace&apos;s{" "}
                    <Link isExternal href="https://github.com/clowdr-app/">
                        open-source
                    </Link>{" "}
                    virtual conference software.
                </Text>
                <LinkButton to="/">Go to home page</LinkButton>
            </>
        );
    }
}
