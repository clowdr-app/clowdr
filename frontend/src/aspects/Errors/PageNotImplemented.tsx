import { Heading, Link, Text, VStack } from "@chakra-ui/react";
import React from "react";
import LinkButton from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";

export default function PageNotImplemented(): JSX.Element {
    return (
        <VStack spacing={5}>
            <FAIcon iconStyle="s" icon="cat" fontSize="6xl" />
            <Heading as="h1" fontSize="4xl" lineHeight="revert">
                This page is coming soon!
            </Heading>
            <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                <Link isExternal href="https://github.com/clowdr-app/">
                    Our team
                </Link>{" "}
                is working as hard as they can to deliver features on a
                continuous rolling basis. Please check back soon!
            </Text>
            <LinkButton to="/">Go to home page</LinkButton>
        </VStack>
    );
}
