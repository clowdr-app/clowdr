import { VStack } from "@chakra-ui/react";
import React from "react";
import Sections from "./LeftSidebarConferenceSections";

export default function LeftSidebar(): JSX.Element {
    return (
        <VStack
            id="left-bar"
            align="stretch"
            spacing={0}
            w="100%"
            h="100%"
            overflowX="hidden"
            overflowY="auto"
            role="navigation"
            aria-label="Main navigation"
        >
            <Sections />
        </VStack>
    );
}
