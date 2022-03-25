import { Box, Flex, Heading, HStack, Spacer, useColorModeValue } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import React from "react";
import { useTitle } from "../../Hooks/useTitle";
import { useConference } from "../useConference";
import { Breadcrumbs } from "./Breadcrumbs";
import { DashboardHeaderControls } from "./DashboardHeaderControls";
import { SubconferenceSelector } from "./Subconferences/SubconferenceSelector";

export function DashboardPage({
    title,
    children,
    controls,
    stickyHeader = true,
    autoOverflow = true,
}: PropsWithChildren<{
    title: string;
    stickyHeader?: boolean;
    autoOverflow?: boolean;
    controls?: React.ReactChild[];
}>): JSX.Element {
    const conference = useConference();
    const grayBg = useColorModeValue("gray.50", "gray.900");
    const grayBorder = useColorModeValue("gray.300", "gray.600");
    const titleEl = useTitle(title.includes(conference.shortName) ? title : `${title} - ${conference.shortName}`);
    return (
        <Flex flexDir="column" w={{ base: "100%", xl: "80%" }} px={[2, 2, 4]}>
            {titleEl}
            <Box
                position={stickyHeader ? "sticky" : undefined}
                top={0}
                left={0}
                zIndex={100000}
                bgColor={grayBg}
                pt={4}
                borderBottom="1px solid"
                borderBottomColor={grayBorder}
            >
                <Breadcrumbs />
                <HStack>
                    <Heading id="page-heading" as="h1" size="xl" textAlign="left" mt={4} mb={4}>
                        {title}
                    </Heading>
                    <Spacer />
                    <SubconferenceSelector />
                </HStack>
                <DashboardHeaderControls>{controls}</DashboardHeaderControls>
            </Box>
            <Flex flexDir="column" mt={4} w="100%" overflow={autoOverflow ? "auto" : undefined}>
                {children}
            </Flex>
        </Flex>
    );
}
