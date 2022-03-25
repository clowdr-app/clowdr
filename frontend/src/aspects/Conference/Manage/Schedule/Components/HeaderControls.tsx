import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, ButtonGroup, IconButton, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import React from "react";
import { useHistory } from "react-router-dom";
import { useAuthParameters } from "../../../../GQL/AuthParameters";

export default function HeaderControls(onCreateSession: () => void): React.ReactChild[] {
    const history = useHistory();
    const { conferencePath } = useAuthParameters();

    return [
        <ButtonGroup key="add" isAttached>
            <Button
                colorScheme="SecondaryActionButton"
                borderRadius="xl"
                borderRightRadius={0}
                onClick={onCreateSession}
            >
                Add a session
            </Button>
            <Menu placement="bottom-end">
                <MenuButton
                    as={IconButton}
                    ml="1px"
                    borderRadius="xl"
                    borderLeftRadius={0}
                    colorScheme="SecondaryActionButton"
                    aria-label="More"
                    icon={<ChevronDownIcon fontSize="130%" fontWeight="900" />}
                />
                <MenuList minWidth="auto">
                    {/* <MenuItem>Add an event</MenuItem> */}
                    <MenuItem
                        onClick={() => {
                            history.push(`${conferencePath}/manage/import/program`);
                        }}
                    >
                        Import
                    </MenuItem>
                </MenuList>
            </Menu>
        </ButtonGroup>,
    ];
}
