import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";

export default function GenericErrorPage({
    heading,
    children,
}: {
    heading: string;
    children: JSX.Element | string;
}): JSX.Element {
    return (
        <>
            <FAIcon iconStyle="s" icon="cat" fontSize="6xl" />
            <Heading as="h1" id="page-heading" fontSize="4xl" lineHeight="revert">
                {heading}
            </Heading>
            {typeof children === "string" ? (
                <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                    {children}
                </Text>
            ) : (
                children
            )}
        </>
    );
}
