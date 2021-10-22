import { Flex } from "@chakra-ui/react";
import React from "react";
import Sections from "./RightSidebarConferenceSections";

export default function RightSidebar(): JSX.Element {
    return (
        <Flex id="right-bar" w="100%" h="100%" overflow="hidden" role="region" aria-label="Chat sidebar">
            <Sections />
        </Flex>
    );
}
