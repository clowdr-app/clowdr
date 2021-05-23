import { Flex } from "@chakra-ui/react";
import React from "react";
import { useMainMenu } from "./MainMenu/MainMenuState";
import Sections from "./RightSidebarConferenceSections";

export default function RightSidebar({ confSlug }: { confSlug: string }): JSX.Element {
    const { onRightBarClose } = useMainMenu();

    return (
        <Flex id="right-bar" w="100%" h="100%" overflow="hidden" role="region" aria-label="Chat sidebar">
            <Sections confSlug={confSlug} onClose={onRightBarClose} />
        </Flex>
    );
}
