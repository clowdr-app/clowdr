import {
    Button,
    Circle,
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
import { LogoutButton } from "../Auth";
import FAIcon from "../Chakra/FAIcon";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";
import useCurrentRegistrant from "../Conference/useCurrentRegistrant";
import { useAuthParameters } from "../GQL/AuthParameters";
import useIsNarrowView from "../Hooks/useIsNarrowView";
import { useNavigationState } from "../Menu/NavigationState";
import useCurrentUser from "../Users/CurrentUser/useCurrentUser";

export default function ProfileMenu(): JSX.Element {
    const user = useCurrentUser()?.user;
    const registrant = useCurrentRegistrant();

    const { conferencePath } = useAuthParameters();

    const bgColor = useColorModeValue(
        "MainMenuHeaderBar.backgroundColor-light",
        "MainMenuHeaderBar.backgroundColor-dark"
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
    const placeholderBgColor = useColorModeValue(
        "MainMenuHeaderBar.profilePlaceholderBackgroundColor-light",
        "MainMenuHeaderBar.profilePlaceholderBackgroundColor-dark"
    );
    const placeholderTextColor = useColorModeValue(
        "MainMenuHeaderBar.profilePlaceholderTextColor-light",
        "MainMenuHeaderBar.profilePlaceholderTextColor-dark"
    );

    const { toggleColorMode } = useColorMode();

    const narrowView = useIsNarrowView();
    const navState = useNavigationState();

    return (
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
                flex="0 0 auto"
            >
                <HStack spacing={1}>
                    {registrant.profile.photoURL_50x50 ? (
                        <Image
                            display="inline-block"
                            title="Your profile photo"
                            src={registrant.profile.photoURL_50x50}
                            w="40px"
                            mr={!narrowView ? 1 : 0}
                            borderRadius="2xl"
                        />
                    ) : (
                        <Circle size="40px" bg={placeholderBgColor} color={placeholderTextColor} m={0}>
                            {registrant.displayName[0] ?? "A"}
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
                            {registrant.displayName}
                        </Text>
                        {user ? (
                            <Text fontSize="md" whiteSpace="normal" w="100%">
                                {user?.email}
                            </Text>
                        ) : undefined}
                    </VStack>
                    <MenuItem as={ReactLink} to={`${conferencePath}/profile`} p={3} isDisabled={navState.disabled}>
                        <FAIcon iconStyle="s" icon="user" mr={2} aria-hidden={true} w="1.2em" />
                        Profile
                    </MenuItem>
                    <MenuItem as={ReactLink} to={`${conferencePath}/recordings`} p={3} isDisabled={navState.disabled}>
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
    );
}
