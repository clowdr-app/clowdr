import { Heading, Link, Text } from "@chakra-ui/react";
import React from "react";
import LinkButton from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";
import { useNoPrimaryMenuButtons } from "../Menu/usePrimaryMenuButtons";

export default function LoggedOutPage(): JSX.Element {
    useNoPrimaryMenuButtons();

    return (
        <>
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
