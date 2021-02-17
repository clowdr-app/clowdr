import { Flex, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { useMainMenu } from "./MainMenuState";
import Sections from "./RightSidebarConferenceSections";

export default function RightSidebar({ rootUrl, confSlug }: { rootUrl: string; confSlug: string }): JSX.Element {
    const { onRightBarClose } = useMainMenu();

    const backgroundColour = useColorModeValue("purple.100", "purple.900");

    return (
        <Flex id="right-bar" backgroundColor={backgroundColour} w="100%" h="100%" overflow="hidden">
            <Sections rootUrl={rootUrl} confSlug={confSlug} onClose={onRightBarClose} />
        </Flex>
    );
}
