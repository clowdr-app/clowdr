import { useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import { useMainMenu } from "./MainMenuState";
import Sections from "./RightSidebarConferenceSections";

export default function RightSidebar({ rootUrl, confSlug }: { rootUrl: string; confSlug: string }): JSX.Element {
    const { onRightBarClose } = useMainMenu();

    const backgroundColour = useColorModeValue("purple.100", "purple.900");

    return (
        <VStack
            id="right-bar"
            align="stretch"
            spacing={0}
            backgroundColor={backgroundColour}
            w="100%"
            h="100%"
            overflowX="hidden"
            overflowY="auto"
        >
            <Sections rootUrl={rootUrl} confSlug={confSlug} onClose={onRightBarClose} />
        </VStack>
    );
}
