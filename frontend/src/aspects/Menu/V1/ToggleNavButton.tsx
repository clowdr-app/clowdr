import { Button, ButtonProps, Tooltip, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { FAIcon } from "../../Icons/FAIcon";
import { useMainMenu } from "./MainMenu/MainMenuState";

export function ToggleNavButton(props: ButtonProps): JSX.Element {
    const mainMenu = useMainMenu();
    const leftColorScheme = "blue";
    const leftBackgroundColour = useColorModeValue(`${leftColorScheme}.200`, `${leftColorScheme}.600`);
    const leftForegroundColour = useColorModeValue("black", "white");

    return (
        <Tooltip label={mainMenu.isLeftBarOpen ? "Close navigation" : "Open navigation"}>
            <Button
                onClick={mainMenu.isLeftBarOpen ? mainMenu.onLeftBarClose : mainMenu.onLeftBarOpen}
                size="sm"
                aria-label={mainMenu.isLeftBarOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-haspopup="menu"
                aria-expanded={mainMenu.isLeftBarOpen ? true : undefined}
                aria-controls="left-bar"
                colorScheme={leftColorScheme}
                backgroundColor={leftBackgroundColour}
                color={leftForegroundColour}
                {...props}
            >
                {mainMenu.isLeftBarOpen ? (
                    <FAIcon iconStyle="s" icon="times" aria-hidden />
                ) : (
                    <FAIcon iconStyle="s" icon="bars" aria-hidden />
                )}
            </Button>
        </Tooltip>
    );
}
