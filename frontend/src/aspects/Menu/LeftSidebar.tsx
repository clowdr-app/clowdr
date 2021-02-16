import { useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import Sections from "./LeftSidebarConferenceSections";
import { useMainMenu } from "./MainMenuState";

export default function LeftSidebar({ rootUrl, confSlug }: { rootUrl: string; confSlug: string }): JSX.Element {
    const { onLeftBarClose } = useMainMenu();

    const backgroundColour = useColorModeValue("blue.100", "blue.900");

    return (
        <VStack
            id="left-bar"
            align="stretch"
            spacing={0}
            backgroundColor={backgroundColour}
            w="100%"
            h="100%"
            overflowX="hidden"
            overflowY="auto"
        >
            <Sections rootUrl={rootUrl} confSlug={confSlug} onClose={onLeftBarClose} />
        </VStack>
    );
}
