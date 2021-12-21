import { Button, Tooltip, useColorMode } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Icons/FAIcon";
import { useIntl } from "react-intl";


export default function ColorModeButton(): JSX.Element {
    const intl = useIntl();
    const { toggleColorMode } = useColorMode();

    return (
        <Tooltip label={intl.formatMessage({ id: 'chakra.colormodebutton.toggle', defaultMessage: "Toggle dark mode" })}>
            <Button size="sm" margin={0} onClick={toggleColorMode} aria-label={intl.formatMessage({ id: 'chakra.colormodebutton.toggle', defaultMessage: "Toggle dark mode" })}>
                <FAIcon iconStyle="s" icon="moon" />
            </Button>
        </Tooltip>
    );
}
