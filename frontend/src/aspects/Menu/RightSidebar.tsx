import { useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import { useMainMenu } from "./MainMenuState";
import Sections from "./RightSidebarConferenceSections";

export default function RightSidebar({ rootUrl, confSlug }: { rootUrl: string; confSlug: string }): JSX.Element {
    const { onRightBarClose } = useMainMenu();

    const backgroundColour = useColorModeValue("purple.100", "purple.900");

    return (
        <VStack align="stretch" spacing={0} backgroundColor={backgroundColour} w="100%" id="right-bar">
            <Sections rootUrl={rootUrl} confSlug={confSlug} onClose={onRightBarClose} />
        </VStack>
    );
}
