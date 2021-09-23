import { Box } from "@chakra-ui/react";
import React from "react";

export default function ActivityOverlay({ talking }: { talking: boolean }): JSX.Element {
    return (
        <Box
            position="absolute"
            zIndex={300}
            left="0"
            top="0"
            height="100%"
            width="100%"
            pointerEvents="none"
            border={talking ? "3px solid green" : "0 none"}
        />
    );
}
