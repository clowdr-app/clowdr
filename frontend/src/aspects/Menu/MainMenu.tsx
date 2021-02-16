import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    chakra,
    Image,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Spacer,
    Stack,
    useBreakpointValue,
    useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { Route, RouteComponentProps, Switch, useHistory } from "react-router-dom";
import AuthenticationButton from "../Auth/Buttons/AuthenticationButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import ColorModeButton from "../Chakra/ColorModeButton";
import { LinkButton } from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { MenuState, MenuStateContext, useMainMenu } from "./MainMenuState";
import usePrimaryMenuButtons, { PrimaryMenuButtonsProvider } from "./usePrimaryMenuButtons";

interface Props {
    children: React.ReactNode | React.ReactNodeArray;
    isLeftBarOpen: boolean;
    onLeftBarOpen: () => void;
    onLeftBarClose: () => void;
}

function MenuBar(): JSX.Element {
    const { buttons: primaryButtons } = usePrimaryMenuButtons();
    const { user } = useMaybeCurrentUser();
    const mainMenu = useMainMenu();

    const mergeItems = useBreakpointValue({ base: true, md: false });
    const history = useHistory();

    const leftColorScheme = "blue";
    const leftBackgroundColour = useColorModeValue(`${leftColorScheme}.200`, `${leftColorScheme}.600`);
    const leftForegroundColour = useColorModeValue("black", "white");

    const rightColorScheme = "purple";
    const rightBackgroundColour = useColorModeValue(`${rightColorScheme}.200`, `${rightColorScheme}.600`);
    const rightForegroundColour = useColorModeValue("black", "white");

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
            mb={0}
            px="0.4em"
            py="0.4em"
            backgroundColor={"gray.900"}
        >
            <Route path="/conference">
                <Button
                    onClick={mainMenu.isLeftBarOpen ? mainMenu.onLeftBarClose : mainMenu.onLeftBarOpen}
                    size="sm"
                    aria-label={mainMenu.isLeftBarOpen ? "Close main menu" : "Open main menu"}
                    aria-haspopup="menu"
                    aria-expanded={mainMenu.isLeftBarOpen ? true : undefined}
                    aria-controls="left-bar"
                    colorScheme={leftColorScheme}
                    backgroundColor={leftBackgroundColour}
                    color={leftForegroundColour}
                >
                    {mainMenu.isLeftBarOpen ? (
                        <FAIcon iconStyle="s" icon="times" aria-hidden />
                    ) : (
                        <FAIcon iconStyle="s" icon="bars" aria-hidden />
                    )}
                </Button>
            </Route>
            <Switch>
                <Route
                    path="/conference/:confSlug"
                    component={(
                        props: RouteComponentProps<{
                            confSlug: string;
                        }>
                    ) => (
                        <LinkButton
                            to={`/conference/${props.match.params.confSlug}`}
                            size="sm"
                            w="3ex"
                            aria-label="Conference home"
                            p={0}
                        >
                            <Image src="/android-chrome-192x192.png" objectFit="contain" />
                        </LinkButton>
                    )}
                />
                <Route path="/">
                    <LinkButton to="/" size="sm" w="3ex" aria-label="Clowdr home" p={0}>
                        <Image src="/android-chrome-192x192.png" objectFit="contain" />
                    </LinkButton>
                </Route>
            </Switch>

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
                                <Route path="/invitation/accept/">
                                    <Box marginRight="auto" display="block" />
                                </Route>
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
                                        <Route
                                            path="/conference/:confSlug"
                                            component={(
                                                props: RouteComponentProps<{
                                                    confSlug: string;
                                                }>
                                            ) => {
                                                const attendee = user.attendees.find(
                                                    (x) => x.conference.slug === props.match.params.confSlug
                                                );
                                                return (
                                                    <MenuItem
                                                        onClick={() => {
                                                            history.push(
                                                                `/conference/${props.match.params.confSlug}/profile`
                                                            );
                                                        }}
                                                        display="block"
                                                    >
                                                        {attendee &&
                                                        attendee.profile &&
                                                        attendee.profile.photoURL_50x50 ? (
                                                            <Image
                                                                borderRadius={5}
                                                                w="100%"
                                                                h="auto"
                                                                objectFit="cover"
                                                                objectPosition="center"
                                                                src={attendee.profile.photoURL_50x50}
                                                                aria-hidden={true}
                                                                overflow="hidden"
                                                                maxW="3ex"
                                                                mr={2}
                                                                my={0}
                                                                verticalAlign="middle"
                                                                display="inline"
                                                            />
                                                        ) : (
                                                            <FAIcon
                                                                display="inline"
                                                                verticalAlign="middle"
                                                                iconStyle="s"
                                                                icon="cat"
                                                                fontSize="25px"
                                                                mr={2}
                                                                aria-hidden={true}
                                                            />
                                                        )}
                                                        <chakra.span display="inline" verticalAlign="middle">
                                                            Profile
                                                        </chakra.span>
                                                    </MenuItem>
                                                );
                                            }}
                                        />
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
                        <Route path="/invitation/accept/">
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
                                <Route
                                    path="/conference/:confSlug"
                                    component={(
                                        props: RouteComponentProps<{
                                            confSlug: string;
                                        }>
                                    ) => {
                                        const attendee = user.attendees.find(
                                            (x) => x.conference.slug === props.match.params.confSlug
                                        );
                                        return (
                                            <LinkButton
                                                to={`/conference/${props.match.params.confSlug}/profile`}
                                                size="sm"
                                                role="menuitem"
                                                w="3ex"
                                                p={0}
                                                aria-label="My profile"
                                            >
                                                {attendee && attendee.profile && attendee.profile.photoURL_50x50 ? (
                                                    <Image
                                                        borderRadius={5}
                                                        w="100%"
                                                        h="auto"
                                                        objectFit="cover"
                                                        objectPosition="center"
                                                        src={attendee.profile.photoURL_50x50}
                                                        aria-hidden={true}
                                                        overflow="hidden"
                                                    />
                                                ) : (
                                                    <FAIcon
                                                        iconStyle="s"
                                                        icon="cat"
                                                        fontSize="23px"
                                                        aria-hidden={true}
                                                    />
                                                )}
                                            </LinkButton>
                                        );
                                    }}
                                />
                            ) : undefined}
                            <AuthenticationButton />
                            <SignupButton />
                        </Route>
                    </Switch>
                </>
            )}
            <ColorModeButton />
            <Route path="/conference">
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
                >
                    {mainMenu.isRightBarOpen ? (
                        <FAIcon iconStyle="s" icon="comment-slash" aria-hidden />
                    ) : (
                        <FAIcon iconStyle="s" icon="comment" aria-hidden />
                    )}
                </Button>
            </Route>
        </Stack>
    );
}

export default function MainMenu({ children, ...props }: Props & MenuState): JSX.Element {
    return (
        <MenuStateContext.Provider value={props}>
            <PrimaryMenuButtonsProvider>
                {children}
                <MenuBar />
            </PrimaryMenuButtonsProvider>
        </MenuStateContext.Provider>
    );
}
