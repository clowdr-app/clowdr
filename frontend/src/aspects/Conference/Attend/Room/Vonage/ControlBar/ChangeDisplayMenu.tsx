import { IconButton, Menu, MenuButton, MenuItem, MenuList, Portal, Tooltip } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../../../../Chakra/FAIcon";
import { DisplayType } from "../State/useVonageDisplay";
import { useVonageLayout } from "../State/VonageLayoutProvider";

export function ChangeDisplayMenu(): JSX.Element {
    const { display } = useVonageLayout();

    return (
        <Menu>
            <Tooltip label="Change view">
                <MenuButton
                    as={IconButton}
                    size="sm"
                    colorScheme="RoomControlBarButton"
                    icon={<FAIcon iconStyle="s" icon="eye" />}
                    aria-label="Change view"
                />
            </Tooltip>
            <Portal>
                <MenuList zIndex="1000000" overflow="auto" maxH="50vh" maxW="50vh">
                    <MenuItem
                        icon={<FAIcon icon="circle" iconStyle="s" />}
                        onClick={() =>
                            display.setChosenDisplay({
                                type: DisplayType.Auto,
                            })
                        }
                    >
                        Auto{display.chosenDisplay.type === DisplayType.Auto ? " (current)" : undefined}
                    </MenuItem>
                    <MenuItem
                        icon={<FAIcon icon="border-all" iconStyle="s" />}
                        onClick={() =>
                            display.setChosenDisplay({
                                type: DisplayType.Gallery,
                            })
                        }
                    >
                        Gallery{display.chosenDisplay.type === DisplayType.Gallery ? " (current)" : undefined}
                    </MenuItem>
                    <MenuItem
                        icon={<FAIcon icon="tv" iconStyle="s" />}
                        onClick={() =>
                            display.setChosenDisplay({
                                type: DisplayType.BroadcastLayout,
                            })
                        }
                    >
                        TV{display.chosenDisplay.type === DisplayType.BroadcastLayout ? " (current)" : undefined}
                    </MenuItem>
                </MenuList>
            </Portal>
        </Menu>
    );
}
