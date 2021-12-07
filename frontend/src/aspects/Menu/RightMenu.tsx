import { Box, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import RightSidebarSections from "./RightSidebar/RightSidebarSections";

export default function RightMenu({ isOpen }: { isOpen: boolean }): JSX.Element {
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const colorScheme = "RightMenu";

    const rightSections = useMemo(
        () =>
            maybeRegistrant ? (
                <RightSidebarSections
                    isVisible={isOpen}
                    onClose={() => {
                        /* Nothing */
                    }}
                />
            ) : undefined,
        [maybeRegistrant, isOpen]
    );
    const sidebarBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);

    return (
        <Box
            display={isOpen && maybeRegistrant ? "block" : "none"}
            flex="1 0 300px"
            h="100%"
            zIndex={0}
            bgColor={sidebarBg}
        >
            {rightSections}
        </Box>
    );
}
