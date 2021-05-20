import { Flex } from "@chakra-ui/react";
import React from "react";
import { useMainMenu } from "./MainMenuState";
import Sections from "./RightSidebarConferenceSections";

export default function RightSidebar({ rootUrl, confSlug }: { rootUrl: string; confSlug: string }): JSX.Element {
    const { onRightBarClose } = useMainMenu();

    return (
        <Flex id="right-bar" w="100%" h="100%" overflow="hidden" role="region" aria-label="Chat sidebar">
            <Sections rootUrl={rootUrl} confSlug={confSlug} onClose={onRightBarClose} />
        </Flex>
    );
}
