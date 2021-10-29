import type { ButtonProps } from "@chakra-ui/react";
import { Button, Tooltip, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { FAIcon } from "../../../Icons/FAIcon";
import { useMainMenu } from "../../V1/MainMenu/MainMenuState";

export function ToggleChatsButton(props: ButtonProps): JSX.Element {
    const mainMenu = useMainMenu();
    const rightColorScheme = "RightMenu";
    const rightBackgroundColour = useColorModeValue(`${rightColorScheme}.200`, `${rightColorScheme}.600`);
    const rightForegroundColour = useColorModeValue("black", "white");

    return (
        <Tooltip label={mainMenu.isRightBarOpen ? "Close chats" : "Open chats"}>
            <Button
                onClick={mainMenu.isRightBarOpen ? mainMenu.onRightBarClose : mainMenu.onRightBarOpen}
                size="sm"
                aria-label={mainMenu.isRightBarOpen ? "Close chats" : "Open chats"}
                aria-haspopup="menu"
                aria-expanded={mainMenu.isRightBarOpen ? true : undefined}
                aria-controls="right-bar"
                colorScheme={rightColorScheme}
                backgroundColor={rightBackgroundColour}
                color={rightForegroundColour}
                {...props}
            >
                {mainMenu.isRightBarOpen ? (
                    <FAIcon iconStyle="s" icon="times" aria-hidden />
                ) : (
                    <FAIcon iconStyle="s" icon="comment" aria-hidden />
                )}
            </Button>
        </Tooltip>
    );
}
