import { Heading, Link, Text, VStack } from "@chakra-ui/react";
import React from "react";
import LinkButton from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";

export default function PageNotFound(): JSX.Element {
    return (
        <VStack spacing={5}>
            <FAIcon iconStyle="s" icon="cat" fontSize="6xl" />
            <Heading as="h1" fontSize="4xl" lineHeight="revert">
                Sorry, we couldn&apos;t find that page.
            </Heading>
            <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                Please double check the URL, and if this error persists, please
                either contact your conference organiser or{" "}
                <Link isExternal href="https://github.com/clowdr-app/">
                    our technical team
                </Link>
                .
            </Text>
            <LinkButton to="/">Go to home page</LinkButton>
        </VStack>
    );
}
