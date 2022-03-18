import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useConference } from "../../useConference";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";

export function SubconferenceSelector(_: Record<string, never>): JSX.Element {
    const conference = useConference();
    const mCurrentRegistrant = useMaybeCurrentRegistrant();

    const subconferences = useMemo(() => {
        return conference.subconferences.map(subconference => ({
            subconference,
            membership: mCurrentRegistrant?.
        }))
    }, [])

    return conference.subconferences.length ? (
        <Menu>
            <MenuButton transition="all 0.2s">
                File <ChevronDownIcon />
            </MenuButton>
            <MenuList>
                <MenuGroup title="Profile">
                    <MenuItem>New File</MenuItem>
                </MenuGroup>
                <MenuItem>New Window</MenuItem>
                <MenuDivider />
                <MenuItem>Open...</MenuItem>
                <MenuItem>Save File</MenuItem>
            </MenuList>
        </Menu>
    ) : (
        <Button></Button>
    );
}
