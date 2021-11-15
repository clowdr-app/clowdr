import { Box, Flex, Heading, useColorModeValue } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import React from "react";
import { Breadcrumbs } from "./Breadcrumbs";

export function DashboardPage({ title, children }: PropsWithChildren<{ title: string }>): JSX.Element {
    const grayBg = useColorModeValue("gray.50", "gray.900");
    const grayBorder = useColorModeValue("gray.300", "gray.600");
    return (
        <Flex flexDir="column" w={{ base: "100%", xl: "80%" }}>
            <Box
                position="sticky"
                top={0}
                left={0}
                zIndex={100000}
                bgColor={grayBg}
                pt={4}
                borderBottom="1px solid"
                borderBottomColor={grayBorder}
            >
                <Breadcrumbs />
                <Heading id="page-heading" as="h1" size="xl" textAlign="left" mt={4} mb={4}>
                    {title}
                </Heading>
            </Box>
            <Flex flexDir="column" mt={4} w="100%" overflow="auto">
                {children}
            </Flex>
        </Flex>
    );
}
