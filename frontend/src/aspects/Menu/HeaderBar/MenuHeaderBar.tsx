import {
    Button,
    Circle,
    Flex,
    HStack,
    Image,
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuList,
    Portal,
    Text,
    useColorMode,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import { LoginButton, LogoutButton } from "../../Auth";
import FAIcon from "../../Chakra/FAIcon";
import { LinkButton } from "../../Chakra/LinkButton";
import { defaultOutline_AsBoxShadow } from "../../Chakra/Outline";
import { useMaybeConference } from "../../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import { useAuthParameters } from "../../GQL/AuthParameters";
import useMaybeCurrentUser from "../../Users/CurrentUser/useMaybeCurrentUser";
import HeaderBarButton from "./HeaderBarButton";

/* TODO: Alerts box - button for push notifications
 <MenuItem as={ReactLink} to="/user/pushNotifications">
    <FAIcon iconStyle="s" icon="envelope-open-text" />
    &nbsp;&nbsp;Push notifications
</MenuItem> */

export default function MenuHeaderBar({
    setRightMenuOpen,
    toggleIsExpanded,
}: {
    setRightMenuOpen: (value: boolean | ((old: boolean) => boolean)) => void;
    toggleIsExpanded: () => void;
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

    const leftMenu_BgColor = useColorModeValue("LeftMenu.500", "LeftMenu.200");

    return (
        <Flex bgColor={bgColor} color={textColor} w="100%" alignItems="center">
            {maybeConference ? (
                <Button
                    onClick={toggleIsExpanded}
                    variant="ghost"
                    p={0}
                    fontSize="2xl"
                    w="3rem"
                    minW={0}
                    minH={0}
                    h="100%"
                    borderTopRadius="2xl"
                    borderBottomRadius="none"
                    _hover={{
                        bgColor: leftMenu_BgColor,
                    }}
                    _focus={{
                        bgColor: leftMenu_BgColor,
                        shadow: defaultOutline_AsBoxShadow,
                    }}
                    _active={{
                        bgColor: leftMenu_BgColor,
                        shadow: defaultOutline_AsBoxShadow,
                    }}
                >
                    <FAIcon iconStyle="s" icon="bars" />
                </Button>
            ) : undefined}
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
                p={3}
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
                        <Menu placement="bottom-start" offset={[-10, 5]}>
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
                                <MenuList color={menuTextColor} py={0} borderRadius="2xl" overflow="hidden">
                                    <VStack
                                        bgColor={bgColor}
                                        color={textColor}
                                        jutsifyContent="flex-start"
                                        alignItems="flex-start"
                                        p={3}
                                        spacing={0}
                                        minW="min(90vw, 300px)"
                                        maxW="min(90vw, 100%)"
                                    >
                                        <Text fontSize="lg" fontWeight="bold">
                                            {maybeRegistrant.displayName}
                                        </Text>
                                        {maybeUser ? (
                                            <Text fontSize="md" whiteSpace="normal" w="100%">
                                                {maybeUser?.email}
                                            </Text>
                                        ) : undefined}
                                    </VStack>
                                    <MenuItem as={ReactLink} to={`${conferencePath}/profile`} p={3}>
                                        <FAIcon iconStyle="s" icon="user" mr={2} aria-hidden={true} w="1.2em" />
                                        Profile
                                    </MenuItem>
                                    <MenuItem as={ReactLink} to={`${conferencePath}/recordings`} p={3}>
                                        <FAIcon iconStyle="s" icon="play" mr={2} aria-hidden={true} w="1.2em" />
                                        Recordings
                                    </MenuItem>
                                    <MenuItem as={ReactLink} to="/" p={3}>
                                        <FAIcon iconStyle="s" icon="ticket-alt" mr={2} aria-hidden={true} w="1.2em" />
                                        Conferences
                                    </MenuItem>
                                    <MenuDivider m={0} />
                                    <HStack w="100%" spacing={0}>
                                        <MenuItem
                                            onClick={() => {
                                                toggleColorMode();
                                            }}
                                            flex="0 0 50%"
                                            whiteSpace="pre"
                                            p={3}
                                            overflow="hidden"
                                        >
                                            <FAIcon iconStyle="s" icon="moon" mr={2} />
                                            Dark mode
                                        </MenuItem>
                                        <LogoutButton asMenuItem />
                                    </HStack>
                                </MenuList>
                            </Portal>
                        </Menu>
                    ) : !maybeUser ? (
                        <LoginButton asMenuButton={true} />
                    ) : (
                        <LinkButton
                            to="/join"
                            fontSize="md"
                            variant="ghost"
                            linkProps={{
                                m: "3px",
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
                            p={3}
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
