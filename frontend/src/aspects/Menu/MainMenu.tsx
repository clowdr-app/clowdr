import { Box, Button, Stack } from "@chakra-ui/react";
import React from "react";
import { Route, Switch } from "react-router-dom";
import AuthenticationButton from "../Auth/Buttons/AuthenticationButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import ColorModeButton from "../Chakra/ColorModeButton";
import { LinkButton } from "../Chakra/LinkButton";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import MenuDrawer from "./MenuDrawer";
import usePrimaryMenuButtons from "./usePrimaryMenuButtons";

interface Props {}

export default function MainMenu(_props: Props): JSX.Element {
    const { buttons: primaryButtons } = usePrimaryMenuButtons();
    const { user } = useMaybeCurrentUser();
    return (
        <>
            <Stack
                direction="row"
                spacing={2}
                justify="flex-start"
                align={["flex-start", "center"]}
                wrap="wrap"
                role="menu"
                width="100%"
                gridRowGap={[0, 2]}
                flex="0 0 auto"
                mb="auto"
            >
                {primaryButtons.map((button) =>
                    typeof button.action === "string" ? (
                        <LinkButton
                            key={button.key}
                            to={button.action}
                            aria-label={button.label}
                            colorScheme={button.colorScheme}
                            textAlign="center"
                            size="sm"
                            role="menuitem"
                        >
                            {button.text}
                        </LinkButton>
                    ) : (
                        <Button
                            key={button.key}
                            onClick={button.action}
                            aria-label={button.label}
                            colorScheme={button.colorScheme}
                            textAlign="center"
                            size="sm"
                            role="menuitem"
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
                <Switch>
                    <Route exact path="/">
                        <Box marginRight="auto" display="block" />
                    </Route>
                    <Route exact path="/user">
                        <Box marginRight="auto" display="block" />
                        <AuthenticationButton />
                        <SignupButton />
                    </Route>
                    <Route path="/">
                        <Box marginRight="auto" display="block" />
                        {user && user.attendees.length > 0 ? (
                            <LinkButton to="/user" size="sm" role="menuitem">
                                My Conferences
                            </LinkButton>
                        ) : undefined}
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
