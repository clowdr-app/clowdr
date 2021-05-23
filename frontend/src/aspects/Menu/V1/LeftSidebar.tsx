import { VStack } from "@chakra-ui/react";
import React from "react";
import Sections from "./LeftSidebarConferenceSections";
import { useMainMenu } from "./MainMenu/MainMenuState";

export default function LeftSidebar({ confSlug }: { confSlug: string }): JSX.Element {
    const { onLeftBarClose } = useMainMenu();

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
            <Sections confSlug={confSlug} onClose={onLeftBarClose} />
        </VStack>
    );
}
