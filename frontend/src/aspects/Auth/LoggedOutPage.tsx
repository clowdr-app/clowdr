import { Heading, Link, Spinner, Text } from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router-dom";
import { LinkButton } from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";
import { useNoPrimaryMenuButtons } from "../Menu/usePrimaryMenuButtons";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useTitle } from "../Utils/useTitle";

export default function LoggedOutPage(): JSX.Element {
    const title = useTitle("Logged Out");
    const mUser = useMaybeCurrentUser();

    useNoPrimaryMenuButtons();

    if (mUser.loading) {
        return <Spinner label="Loading user info" />;
    }

    if (mUser.user) {
        return <Redirect to="/user" />;
    }
    else {
        return (
            <>
                {title}
                <FAIcon iconStyle="s" icon="door-open" fontSize="6xl" />
                <Heading as="h1" fontSize="4xl" lineHeight="revert">
                    You have been logged out.
            </Heading>
                <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                    We hope you enjoyed using Clowdr&apos;s{" "}
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
