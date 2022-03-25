import { HStack } from "@chakra-ui/react";
import React from "react";

export function DashboardHeaderControls({ children }: { children?: React.ReactChild[] }): JSX.Element {
    return children ? (
        <HStack spacing={4} mb={4}>
            {children}
        </HStack>
    ) : (
        <></>
    );
}
