import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Spacer,
    Stack,
    useBreakpointValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { createHtmlPortalNode, InPortal } from "react-reverse-portal";
import { Route, RouteComponentProps, Switch, useHistory } from "react-router-dom";
import AuthenticationButton from "../Auth/Buttons/AuthenticationButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import ColorModeButton from "../Chakra/ColorModeButton";
import { LinkButton } from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import MainMenuConferenceSections from "./MainMenuConferenceSections";
import MainMenuDrawer from "./MainMenuDrawer";
import { MenuStateContext, useMainMenu } from "./MainMenuState";
import usePrimaryMenuButtons, { PrimaryMenuButtonsProvider } from "./usePrimaryMenuButtons";

interface Props {
    children: React.ReactNode | React.ReactNodeArray;
}

function MenuBar({ isOpen }: { isOpen?: boolean }): JSX.Element {
    const { buttons: primaryButtons } = usePrimaryMenuButtons();
    const { user } = useMaybeCurrentUser();
    const mainMenu = useMainMenu();

    const mergeItems = useBreakpointValue({ base: true, md: false });
    const history = useHistory();

    return (
        <Stack
            direction="row"
            spacing={2}
            justify="flex-start"
            align={["flex-start", "center"]}
            wrap="wrap"
            role={mergeItems ? undefined : "menu"}
            width="100%"
            gridRowGap={[0, 2]}
            flex="0 0 auto"
            mb="auto"
        >
            <Button
                onClick={mainMenu.onOpen}
                size="sm"
                aria-label="Open main menu"
                aria-haspopup="menu"
                aria-expanded={isOpen ? true : undefined}
                aria-controls="main-menu"
            >
                <FAIcon iconStyle="s" icon="bars" aria-hidden />
            </Button>
            {mergeItems ? (
                <>
                    <Spacer />
                    <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                            Go to
                        </MenuButton>
                        <MenuList>
                            {primaryButtons.map((button) => (
                                <MenuItem
                                    key={button.key}
                                    colorScheme={button.colorScheme}
                                    aria-label={button.label}
                                    onClick={() => {
                                        if (typeof button.action === "string") {
                                            history.push(button.action);
                                        } else {
                                            button.action();
                                        }
                                    }}
                                >
                                    {button.text}
                                </MenuItem>
                            ))}
                            <Switch>
                                <Route exact path="/user">
                                    <AuthenticationButton asMenuItem />
                                    <SignupButton asMenuItem />
                                </Route>
                                <Route path="/">
                                    {user && user.attendees.length > 0 ? (
                                        <MenuItem
                                            onClick={() => {
                                                history.push("/user");
                                            }}
                                        >
                                            My Conferences
                                        </MenuItem>
                                    ) : undefined}
                                    {user && user.attendees.length > 0 ? (
                                        <MenuItem
                                            onClick={() => {
                                                history.push(
                                                    `/conference/${user.attendees[0].conference.slug}/profile`
                                                );
                                            }}
                                        >
                                            My Profile
                                        </MenuItem>
                                    ) : undefined}
                                    <AuthenticationButton asMenuItem />
                                    <SignupButton asMenuItem />
                                </Route>
                            </Switch>
                        </MenuList>
                    </Menu>
                </>
            ) : (
                <>
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
                            {user && user.attendees.length > 0 ? (
                                <LinkButton
                                    to={`/conference/${user.attendees[0].conference.slug}/profile`}
                                    size="sm"
                                    role="menuitem"
                                >
                                    My Profile
                                </LinkButton>
                            ) : undefined}
                            <AuthenticationButton />
                            <SignupButton />
                        </Route>
                    </Switch>
                </>
            )}
            <ColorModeButton />
        </Stack>
    );
}

export default function MainMenu({ children }: Props): JSX.Element {
    const { isOpen, onOpen, onClose, onToggle } = useDisclosure();

    const sidebarContentsPortal = useMemo(() => createHtmlPortalNode(), []);

    const sidebarContents = useMemo(
        () => (
            <VStack align="stretch" spacing={0}>
                <Route
                    path="/conference/:confSlug"
                    component={(
                        props: RouteComponentProps<{
                            confSlug: string;
                        }>
                    ) => (
                        <MainMenuConferenceSections rootUrl={props.match.url} confSlug={props.match.params.confSlug} />
                    )}
                />
            </VStack>
        ),
        []
    );

    return (
        <MenuStateContext.Provider
            value={{
                onOpen,
                onClose,
                onToggle,
            }}
        >
            <PrimaryMenuButtonsProvider>
                {children}
                <MenuBar isOpen={isOpen} />
            </PrimaryMenuButtonsProvider>
            <MainMenuDrawer isOpen={isOpen} portalNode={sidebarContentsPortal} />
            <InPortal node={sidebarContentsPortal}>{sidebarContents}</InPortal>
        </MenuStateContext.Provider>
    );
}
