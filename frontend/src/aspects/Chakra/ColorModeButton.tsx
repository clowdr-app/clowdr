import { Button, Tooltip, useColorMode } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";

export default function ColorModeButton(): JSX.Element {
    const { toggleColorMode } = useColorMode();

    return (
        <Tooltip label="Toggle dark mode">
            <Button size="sm" margin={0} onClick={toggleColorMode} aria-label="Toggle dark mode">
                <FAIcon iconStyle="s" icon="moon" />
            </Button>
        </Tooltip>
    );
}
