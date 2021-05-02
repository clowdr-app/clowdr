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
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Link as ReactLink, Route, Switch } from "react-router-dom";
import { Permission_Enum } from "../../generated/graphql";
import AuthenticationButton from "../Auth/Buttons/AuthenticationButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import ColorModeButton from "../Chakra/ColorModeButton";
import { LinkButton } from "../Chakra/LinkButton";
import RequireAtLeastOnePermissionWrapper from "../Conference/RequireAtLeastOnePermissionWrapper";
import { useMaybeConference } from "../Conference/useConference";
import { useConferenceCurrentUserActivePermissions } from "../Conference/useConferenceCurrentUserActivePermissions";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import FAIcon from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { MenuState, MenuStateContext, useMainMenu } from "./MainMenuState";
import { ToggleChatsButton } from "./ToggleChatsButton";
import { ToggleNavButton } from "./ToggleNavButton";

interface Props {
    children: React.ReactNode | React.ReactNodeArray;
    state: MenuState;
}

export function MenuBar(): JSX.Element {
    const { user } = useMaybeCurrentUser();
    const conference = useMaybeConference();
    const registrant = useMaybeCurrentRegistrant();
    const permissions = useConferenceCurrentUserActivePermissions();
    const isPermittedAccess = registrant && permissions.has(Permission_Enum.ConferenceViewAttendees);
    const mainMenu = useMainMenu();

    const navButton = useMemo(() => (isPermittedAccess && !mainMenu.isLeftBarOpen ? <ToggleNavButton /> : undefined), [
        isPermittedAccess,
        mainMenu.isLeftBarOpen,
    ]);

    const chatButton = useMemo(
        () => (isPermittedAccess && !mainMenu.isRightBarOpen ? <ToggleChatsButton /> : undefined),
        [isPermittedAccess, mainMenu.isRightBarOpen]
    );

    const homeButton = useMemo(
        () =>
            conference ? (
                <LinkButton
                    to={`/conference/${conference.slug}`}
                    size="sm"
                    aria-label="Conference home"
                    variant="solid"
                >
                    {conference.shortName}
                </LinkButton>
            ) : (
                <LinkButton to="/" size="sm" w="3ex" aria-label="Clowdr home" p={0}>
                    <Image src="/android-chrome-192x192.png" objectFit="contain" />
                </LinkButton>
            ),
        [conference]
    );

    const backToDashboardButton = useMemo(
        () =>
            conference ? (
                <Switch>
                    <Route path={`/conference/${conference.slug}/manage`} exact></Route>
                    <Route path={`/conference/${conference.slug}/manage/`}>
                        <LinkButton to={`/conference/${conference.slug}/manage`} size="sm">
                            Back to dashboard
                        </LinkButton>
                    </Route>
                </Switch>
            ) : undefined,
        [conference]
    );

    const primaryMenuButtons = useMemo(
        () => (
            <>
                <Spacer />
                <Menu>
                    <MenuButton as={Button} display="inline-block" size="sm" p={0}>
                        {registrant && registrant.profile && registrant.profile.photoURL_50x50 ? (
                            <Image
                                borderRadius={5}
                                w="100%"
                                h="100%"
                                objectFit="scale-down"
                                objectPosition="center"
                                src={registrant.profile.photoURL_50x50}
                                aria-hidden={true}
                                overflow="hidden"
                            />
                        ) : (
                            <FAIcon iconStyle="s" icon="cat" fontSize="23px" aria-hidden={true} />
                        )}
                    </MenuButton>
                    <MenuList>
                        <Switch>
                            <Route path="/invitation/accept/">
                                <Box marginRight="auto" display="block" />
                            </Route>
                            <Route exact path="/user">
                                {user ? (
                                    <MenuItem as={ReactLink} to="/user/pushNotifications">
                                        <FAIcon
                                            display="inline"
                                            verticalAlign="middle"
                                            iconStyle="s"
                                            icon="envelope-open-text"
                                            mr={2}
                                            aria-hidden={true}
                                        />
                                        <chakra.span display="inline" verticalAlign="middle">
                                            Push notifications
                                        </chakra.span>
                                    </MenuItem>
                                ) : undefined}
                                <AuthenticationButton asMenuItem />
                                <SignupButton asMenuItem />
                            </Route>
                            <Route path="/">
                                {conference && registrant ? (
                                    <MenuItem
                                        as={ReactLink}
                                        to={`/conference/${conference.slug}/profile`}
                                        display="block"
                                    >
                                        {registrant && registrant.profile && registrant.profile.photoURL_50x50 ? (
                                            <Image
                                                borderRadius={5}
                                                w="35px"
                                                h="35px"
                                                objectFit="contain"
                                                objectPosition="center"
                                                src={registrant.profile.photoURL_50x50}
                                                aria-hidden={true}
                                                overflow="hidden"
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
                                                fontSize="20px"
                                                mr={2}
                                                aria-hidden={true}
                                            />
                                        )}
                                        <chakra.span display="inline" verticalAlign="middle">
                                            Profile
                                        </chakra.span>
                                    </MenuItem>
                                ) : undefined}
                                {conference ? (
                                    <RequireAtLeastOnePermissionWrapper
                                        permissions={[
                                            Permission_Enum.ConferenceManageAttendees,
                                            Permission_Enum.ConferenceManageContent,
                                            Permission_Enum.ConferenceManageGroups,
                                            Permission_Enum.ConferenceManageName,
                                            Permission_Enum.ConferenceManageRoles,
                                            Permission_Enum.ConferenceManageSchedule,
                                            Permission_Enum.ConferenceManageShuffle,
                                            Permission_Enum.ConferenceModerateAttendees,
                                        ]}
                                    >
                                        <MenuItem as={ReactLink} to={`/conference/${conference.slug}/manage`}>
                                            <FAIcon
                                                display="inline"
                                                verticalAlign="middle"
                                                iconStyle="s"
                                                icon="cog"
                                                mr={2}
                                                aria-hidden={true}
                                            />
                                            Manage conference
                                        </MenuItem>
                                    </RequireAtLeastOnePermissionWrapper>
                                ) : undefined}
                                {user ? (
                                    <MenuItem as={ReactLink} to="/user/pushNotifications">
                                        <FAIcon
                                            display="inline"
                                            verticalAlign="middle"
                                            iconStyle="s"
                                            icon="envelope-open-text"
                                            mr={2}
                                            aria-hidden={true}
                                        />
                                        <chakra.span display="inline" verticalAlign="middle">
                                            Push notifications
                                        </chakra.span>
                                    </MenuItem>
                                ) : undefined}
                                {user && user.registrants.length > 0 ? (
                                    <MenuItem as={ReactLink} to="/user">
                                        <FAIcon
                                            display="inline"
                                            verticalAlign="middle"
                                            iconStyle="s"
                                            icon="list"
                                            mr={2}
                                            aria-hidden={true}
                                        />
                                        <chakra.span display="inline" verticalAlign="middle">
                                            My conferences
                                        </chakra.span>
                                    </MenuItem>
                                ) : undefined}
                                <AuthenticationButton asMenuItem />
                                <SignupButton asMenuItem />
                            </Route>
                        </Switch>
                    </MenuList>
                </Menu>
            </>
        ),
        [registrant, conference, user]
    );

    const borderColour = useColorModeValue("gray.200", "gray.600");
    return (
        <Stack
            direction="row"
            spacing={2}
            justify="flex-start"
            align={["flex-start", "center"]}
            wrap="wrap"
            width="100%"
            gridRowGap={[0, 2]}
            flex="0 0 auto"
            mb={0}
            px="0.4em"
            py="0.4em"
            borderBottom="1px solid"
            borderBottomColor={borderColour}
        >
            {navButton}
            {homeButton}
            {backToDashboardButton}
            {primaryMenuButtons}

            <ColorModeButton />
            {chatButton}
        </Stack>
    );
}

export default function MainMenu({ children, state }: Props): JSX.Element {
    return <MenuStateContext.Provider value={state}>{children}</MenuStateContext.Provider>;
}
