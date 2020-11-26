import { Spacer, Stack } from "@chakra-ui/react";
import React from "react";
import { Route, Switch } from "react-router-dom";
import AuthenticationButton from "../Auth/Buttons/AuthenticationButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import ColorModeButton from "../Chakra/ColorModeButton";
import MenuDrawer from "./MenuDrawer";

interface Props {}

export default function MainMenu(_props: Props): JSX.Element {
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
