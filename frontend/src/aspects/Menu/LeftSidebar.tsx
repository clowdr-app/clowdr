import { VStack } from "@chakra-ui/react";
import React from "react";
import Sections from "./LeftSidebarConferenceSections";
import { useMainMenu } from "./MainMenuState";

export default function LeftSidebar({ rootUrl, confSlug }: { rootUrl: string; confSlug: string }): JSX.Element {
    const { onLeftBarClose } = useMainMenu();

    return (
        <VStack id="left-bar" align="stretch" spacing={0} w="100%" h="100%" overflowX="hidden" overflowY="auto">
            <Sections rootUrl={rootUrl} confSlug={confSlug} onClose={onLeftBarClose} />
        </VStack>
    );
}
