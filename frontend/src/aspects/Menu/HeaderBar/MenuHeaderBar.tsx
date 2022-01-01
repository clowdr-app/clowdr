import {
    Box,
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
    useToken,
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
import useIsNarrowView from "../../Hooks/useIsNarrowView";
import useIsVeryNarrowView from "../../Hooks/useIsVeryNarrowView";
import useMaybeCurrentUser from "../../Users/CurrentUser/useMaybeCurrentUser";
import { useNavigationState } from "../NavigationState";
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

    const leftMenu_BgColorVal = useToken("colors", leftMenu_BgColor);

    const narrowView = useIsNarrowView();
    const veryNarrowView = useIsVeryNarrowView();
    const navState = useNavigationState();

    return (
        <Flex
            bgColor={bgColor}
            color={textColor}
            w="100%"
            alignItems="center"
            zIndex={4}
            minH="calc(6ex + 6px)"
            overflow="hidden"
            flexWrap="nowrap"
        >
            {maybeConference ? (
                <Button
                    onClick={toggleIsExpanded}
                    variant="ghost"
                    p={0}
                    fontSize="2xl"
                    w="3rem"
                    minW={0}
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
                    isDisabled={narrowView && navState.disabled}
                >
                    <FAIcon iconStyle="s" icon="bars" />
                    {!narrowView ? (
                        <Box pos="absolute" bottom={0} left={0} w="100%">
                            <svg height="9" width="100%">
                                <polygon points="25,0 17,10 33,10" fill={leftMenu_BgColorVal} />
                            </svg>
                        </Box>
                    ) : undefined}
                </Button>
            ) : undefined}
            <LinkButton
                to={conferencePath ?? "/"}
                fontSize={narrowView ? "lg" : "xl"}
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
                whiteSpace="normal"
                isDisabled={navState.disabled}
                mr={navState.disabled ? "auto" : undefined}
            >
                {maybeConference?.shortName ?? "Midspace"}
            </LinkButton>
            {maybeConference ? (
                <>
                    {!veryNarrowView ? (
                        <HeaderBarButton label="Search" iconStyle="s" icon="search" isDisabled={navState.disabled} />
                    ) : undefined}
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
                                    {!narrowView ? <FAIcon iconStyle="s" icon="chevron-down" w={6} /> : undefined}
                                </HStack>
                            </MenuButton>
                            <Portal>
                                <MenuList color={menuTextColor} py={0} borderRadius="2xl" overflow="hidden" zIndex={6}>
                                    <VStack
                                        bgColor={bgColor}
                                        color={textColor}
                                        justifyContent="flex-start"
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
                                    <MenuItem
                                        as={ReactLink}
                                        to={`${conferencePath}/profile`}
                                        p={3}
                                        isDisabled={navState.disabled}
                                    >
                                        <FAIcon iconStyle="s" icon="user" mr={2} aria-hidden={true} w="1.2em" />
                                        Profile
                                    </MenuItem>
                                    <MenuItem
                                        as={ReactLink}
                                        to={`${conferencePath}/recordings`}
                                        p={3}
                                        isDisabled={navState.disabled}
                                    >
                                        <FAIcon iconStyle="s" icon="play" mr={2} aria-hidden={true} w="1.2em" />
                                        Recordings
                                    </MenuItem>
                                    <MenuItem as={ReactLink} to="/" p={3} isDisabled={navState.disabled}>
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
                            fontSize="sm"
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
