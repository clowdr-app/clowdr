import { Button, Spacer, Stack } from "@chakra-ui/react";
import React from "react";
import { Route, Switch } from "react-router-dom";
import AuthenticationButton from "../Auth/Buttons/AuthenticationButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import ColorModeButton from "../Chakra/ColorModeButton";
import LinkButton from "../Chakra/LinkButton";
import MenuDrawer from "./MenuDrawer";
import usePrimaryMenuButtons from "./usePrimaryMenuButtons";

interface Props {}

export default function MainMenu(_props: Props): JSX.Element {
    const primaryButtons = usePrimaryMenuButtons();
    return (
        <>
            <Stack
                direction="row"
                spacing="2"
                justify="start"
                align="center"
                wrap="wrap"
                role="menu"
                width="100%"
            >
                {primaryButtons.map((button) =>
                    typeof button.action === "string" ? (
                        <LinkButton
                            key={button.key}
                            to={button.action}
                            aria-label={button.label}
                            colorScheme={button.colorScheme}
                        >
                            {button.text}
                        </LinkButton>
                    ) : (
                        <Button
                            key={button.key}
                            onClick={button.action}
                            aria-label={button.label}
                            colorScheme={button.colorScheme}
                        >
                            {button.text}
                        </Button>
                    )
                )}
                {/* <Button
                    colorScheme="green"
                    onClick={onOpen}
                    title="Open main menu"
                >
                    Menu
                </Button>
                <Heading as="h1" fontSize="140%" height="auto">
                    Clowdr Chat Demo
                </Heading>*/}
                <Spacer />
                <Switch>
                    <Route exact path="/"></Route>
                    <Route path="/">
                        <AuthenticationButton />
                        <SignupButton />
                    </Route>
                </Switch>
                <ColorModeButton />
            </Stack>
            <MenuDrawer />
        </>
    );
}
