import { MenuItem } from "@chakra-ui/react";
import React from "react";
import { FAIcon } from "../Icons/FAIcon";
import { useUXChoice } from "./UXChoice";

export default function SwitchUXChoiceButton(): JSX.Element {
    const { onOpen } = useUXChoice();

    return (
        <MenuItem size={"sm"} onClick={onOpen}>
            <FAIcon
                display="inline"
                verticalAlign="middle"
                iconStyle="s"
                icon="exchange-alt"
                mr={2}
                aria-hidden={true}
            />
            Change UI experience
        </MenuItem>
    );
}
