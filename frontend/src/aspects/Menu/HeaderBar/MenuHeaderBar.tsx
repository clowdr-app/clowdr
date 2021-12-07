import {
    Button,
    Circle,
    Flex,
    HStack,
    Image,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal,
    Text,
    useColorMode,
    useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import LoginButton from "../../Auth/Buttons/LoginButton";
import LogoutButton from "../../Auth/Buttons/LogoutButton";
import { LinkButton } from "../../Chakra/LinkButton";
import { defaultOutline_AsBoxShadow } from "../../Chakra/Outline";
import { useMaybeConference } from "../../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import { useAuthParameters } from "../../GQL/AuthParameters";
import FAIcon from "../../Icons/FAIcon";
import useMaybeCurrentUser from "../../Users/CurrentUser/useMaybeCurrentUser";
import HeaderBarButton from "./HeaderBarButton";

/* TODO: Alerts box - button for push notifications
 <MenuItem as={ReactLink} to="/user/pushNotifications">
    <FAIcon iconStyle="s" icon="envelope-open-text" />
    &nbsp;&nbsp;Push notifications
</MenuItem> */

export default function MenuHeaderBar({
    setRightMenuOpen,
}: {
    setRightMenuOpen: (value: boolean | ((old: boolean) => boolean)) => void;
}): JSX.Element {
    const maybeConference = useMaybeConference();
    const maybeUser = useMaybeCurrentUser()?.user;
    const maybeRegistrant = useMaybeCurrentRegistrant();

    const { conferencePath } = useAuthParameters();
    const bgColor = useColorModeValue(
        "MainMenuHeaderBar.backgroundColor-light",
        "MainMenuHeaderBar.backgroundColor-dark"
    );
    const titleHoverBgColor = useColorModeValue(
        "MainMenuHeaderBar.titleHoverBackgroundColor-light",
        "MainMenuHeaderBar.titleHoverBackgroundColor-dark"
    );
    const titleFocusBgColor = useColorModeValue(
        "MainMenuHeaderBar.titleFocusBackgroundColor-light",
        "MainMenuHeaderBar.titleFocusBackgroundColor-dark"
    );
    const buttonHoverBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonHoverBackgroundColor-light",
        "MainMenuHeaderBar.buttonHoverBackgroundColor-dark"
    );
    const buttonFocusBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonFocusBackgroundColor-light",
        "MainMenuHeaderBar.buttonFocusBackgroundColor-dark"
    );
    const textColor = useColorModeValue("MainMenuHeaderBar.textColor-light", "MainMenuHeaderBar.textColor-dark");
    const menuTextColor = useColorModeValue("black", "white");

    const { toggleColorMode } = useColorMode();

    return (
        <Flex bgColor={bgColor} color={textColor} w="100%" alignItems="center">
            <LinkButton
                to={conferencePath ?? "/"}
                fontSize="xl"
                variant="ghost"
                linkProps={{
                    m: "3px",
                    mr: "auto",
                    p: 0,
                    borderRadius: 0,
                    h: "calc(100% - 3px)",
                    _hover: {
                        bgColor: titleHoverBgColor,
                    },
                    _focus: {
                        bgColor: titleFocusBgColor,
                        boxShadow: defaultOutline_AsBoxShadow,
                    },
                    _active: {
                        bgColor: titleFocusBgColor,
                        boxShadow: defaultOutline_AsBoxShadow,
                    },
                }}
                m={0}
                p={4}
                h="auto"
                minH="0"
                _hover={{}}
                _focus={{}}
                _active={{}}
            >
                {maybeConference?.shortName ?? "Midspace"}
            </LinkButton>
            {maybeConference ? (
                <>
                    <HeaderBarButton label="Search" iconStyle="s" icon="search" />
                    <HeaderBarButton label="Notifications" iconStyle="s" icon="bell" />
                    <HeaderBarButton
                        label="Chat"
                        iconStyle="s"
                        icon="comment"
                        onClick={() => {
                            setRightMenuOpen((old) => !old);
                        }}
                    />
                    {maybeRegistrant ? (
                        <Menu>
                            <MenuButton
                                as={Button}
                                aria-label="My profile"
                                variant="ghost"
                                size="lg"
                                w="auto"
                                h="calc(100% - 3px)"
                                py={0}
                                px={2}
                                m="3px"
                                borderRadius={0}
                                _hover={{
                                    bgColor: buttonHoverBgColor,
                                }}
                                _focus={{
                                    bgColor: buttonFocusBgColor,
                                    boxShadow: defaultOutline_AsBoxShadow,
                                }}
                                _active={{
                                    bgColor: buttonFocusBgColor,
                                    boxShadow: defaultOutline_AsBoxShadow,
                                }}
                            >
                                <HStack spacing={1}>
                                    {maybeRegistrant.profile.photoURL_50x50 ? (
                                        <Image
                                            display="inline-block"
                                            title="Your profile photo"
                                            src={maybeRegistrant?.profile.photoURL_50x50}
                                            w={6}
                                            mr={1}
                                            borderRadius="100%"
                                        />
                                    ) : (
                                        <Circle size="40px" bg="pink.400" color="white" m={0}>
                                            {maybeRegistrant.displayName[0] ?? "A"}
                                        </Circle>
                                    )}
                                    <FAIcon iconStyle="s" icon="chevron-down" w={6} />
                                </HStack>
                            </MenuButton>
                            <Portal>
                                <MenuList color={menuTextColor}>
                                    <Text px={2} fontSize="sm" fontWeight="bold">
                                        {maybeRegistrant.displayName}
                                    </Text>
                                    {maybeUser ? (
                                        <Text py={1} px={2} fontSize="sm" fontFamily="monospace">
                                            {maybeUser?.email}
                                        </Text>
                                    ) : undefined}
                                    <MenuItem as={ReactLink} to={`${conferencePath}/profile`}>
                                        <FAIcon iconStyle="s" icon="user" mr={2} aria-hidden={true} w="1.2em" />
                                        Profile
                                    </MenuItem>
                                    <MenuItem as={ReactLink} to={`${conferencePath}/recordings`}>
                                        <FAIcon iconStyle="s" icon="play" mr={2} aria-hidden={true} w="1.2em" />
                                        Recordings
                                    </MenuItem>
                                    <MenuItem as={ReactLink} to="/">
                                        <FAIcon iconStyle="s" icon="ticket-alt" mr={2} aria-hidden={true} w="1.2em" />
                                        Conferences
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            toggleColorMode();
                                        }}
                                    >
                                        <FAIcon iconStyle="s" icon="moon" />
                                        &nbsp;&nbsp;Toggle dark mode
                                    </MenuItem>
                                    <LogoutButton asMenuItem />
                                </MenuList>
                            </Portal>
                        </Menu>
                    ) : !maybeUser ? (
                        <LoginButton asMenuButton={true} />
                    ) : (
                        <LinkButton
                            to="/join"
                            fontSize="xl"
                            variant="ghost"
                            linkProps={{
                                m: "3px",
                                mr: "auto",
                                p: 0,
                                borderRadius: 0,
                                h: "calc(100% - 3px)",
                                _hover: {
                                    bgColor: titleHoverBgColor,
                                },
                                _focus: {
                                    bgColor: titleFocusBgColor,
                                    boxShadow: defaultOutline_AsBoxShadow,
                                },
                                _active: {
                                    bgColor: titleFocusBgColor,
                                    boxShadow: defaultOutline_AsBoxShadow,
                                },
                            }}
                            m={0}
                            p={4}
                            h="auto"
                            minH="0"
                            _hover={{}}
                            _focus={{}}
                            _active={{}}
                        >
                            Use invite
                        </LinkButton>
                    )}
                </>
            ) : !maybeUser ? (
                <LoginButton asMenuButton={true} />
            ) : (
                <LogoutButton asMenuButton={true} />
            )}
        </Flex>
    );
}
