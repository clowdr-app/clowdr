import { Flex, Heading } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import React from "react";
import { useConference } from "../useConference";
import { Breadcrumbs } from "./Breadcrumbs";

export function DashboardPage({ title, children }: PropsWithChildren<{ title: string }>): JSX.Element {
    const conference = useConference();
    return (
        <Flex flexDir="column" mt={4} w={{ base: "100%", xl: "80%" }}>
            <Breadcrumbs />
            <Heading id="page-heading" as="h1" size="xl" textAlign="left" mt={4} mb={4}>
                {title}
            </Heading>
            {children}
        </Flex>
    );
}
