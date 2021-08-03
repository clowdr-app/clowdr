import { Box, Flex, HStack, MenuItem, useColorMode, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { Link as ReactLink, Route, useRouteMatch } from "react-router-dom";
import LoginButton from "../../Auth/Buttons/LoginButton";
import LogoutButton from "../../Auth/Buttons/LogoutButton";
import { useMaybeConference } from "../../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import FAIcon from "../../Icons/FAIcon";
import useMaybeCurrentUser from "../../Users/CurrentUser/useMaybeCurrentUser";
import { useMainMenu } from "../V1/MainMenu/MainMenuState";
import MenuButton from "./MenuButton";
import MoreOptionsMenuButton from "./MoreOptionsMenuButton";
import { RightSidebarTabs, useRightSidebarCurrentTab } from "./RightSidebar/RightSidebarCurrentTab";
import RightSidebarSections from "./RightSidebar/RightSidebarSections";

const colorScheme = "purple";
export default function RightMenu({ isVisible }: { isVisible: boolean }): JSX.Element {
    const { isRightBarOpen, onRightBarOpen, onRightBarClose } = useMainMenu();
    const maybeConference = useMaybeConference();
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const { path } = useRouteMatch();
    // const { onOpen: onOpenUXChoice } = useUXChoice();

    const colorMode = useColorMode();
    const maybeUser = useMaybeCurrentUser()?.user;

    const { setCurrentTab } = useRightSidebarCurrentTab();

    const [pageChatUnreadCount, setPageChatUnreadCount] = useState<string>("");
    const [chatsUnreadCount, setChatsUnreadCount] = useState<string>("");

    const rightSections = useMemo(
        () =>
            maybeConference?.slug && maybeRegistrant ? (
                <RightSidebarSections
                    confSlug={maybeConference.slug}
                    onClose={onRightBarClose}
                    externalSetPageChatUnreadCount={setPageChatUnreadCount}
                    externalSetChatsUnreadCount={setChatsUnreadCount}
                    isVisible={isVisible}
                />
            ) : undefined,
        [maybeConference?.slug, maybeRegistrant, onRightBarClose, isVisible]
    );
    const purpleBg = useColorModeValue("purple.50", "purple.900");
    return (
        <HStack h="100%" w="100%" justifyContent="stretch" spacing={0}>
            <Box
                display={isRightBarOpen && maybeRegistrant ? "block" : "none"}
                w="100%"
                h="100%"
                zIndex={0}
                bgColor={purpleBg}
            >
                {rightSections}
            </Box>
            <Flex
                flexDir="column"
                justifyContent="flex-start"
                alignItems="flex-end"
                zIndex={1}
                h="100%"
                bgColor="purple.700"
            >
                {maybeUser ? (
                    <>
                        <LogoutButton asMenuButtonV2 />
                        <MoreOptionsMenuButton
                            label="Options"
                            iconStyle="s"
                            icon="ellipsis-h"
                            borderTopRadius={0}
                            colorScheme={colorScheme}
                            side="right"
                            mb="auto"
                        >
                            <MenuItem
                                onClick={() => {
                                    colorMode.toggleColorMode();
                                }}
                            >
                                <FAIcon iconStyle="s" icon="moon" />
                                &nbsp;&nbsp;Toggle dark mode
                            </MenuItem>
                            <MenuItem as={ReactLink} to="/user/pushNotifications">
                                <FAIcon iconStyle="s" icon="envelope-open-text" />
                                &nbsp;&nbsp;Push notifications
                            </MenuItem>
                            {/* <MenuItem onClick={onOpenUXChoice}>
                        <FAIcon iconStyle="s" icon="exchange-alt" />
                        &nbsp;&nbsp;Change UI experience
                    </MenuItem> */}
                        </MoreOptionsMenuButton>
                    </>
                ) : (
                    <LoginButton asMenuButtonV2 />
                )}
                {maybeConference?.slug && maybeRegistrant ? (
                    <>
                        <Route path={`${path}/item/`}>
                            <MenuButton
                                label="Chat here"
                                iconStyle="s"
                                icon="comment"
                                borderRadius={0}
                                colorScheme={colorScheme}
                                side="right"
                                onClick={() => {
                                    setCurrentTab(RightSidebarTabs.PageChat);
                                    onRightBarOpen();
                                }}
                                mb={1}
                            >
                                <Box pos="absolute" top={1} right={1} fontSize="xs">
                                    {pageChatUnreadCount}
                                </Box>
                            </MenuButton>
                        </Route>
                        <Route path={`${path}/room/`}>
                            <MenuButton
                                label="Chat here"
                                iconStyle="s"
                                icon="comment"
                                borderRadius={0}
                                colorScheme={colorScheme}
                                side="right"
                                onClick={() => {
                                    setCurrentTab(RightSidebarTabs.PageChat);
                                    onRightBarOpen();
                                }}
                                mb={1}
                            >
                                <Box pos="absolute" top={1} right={1} fontSize="xs">
                                    {pageChatUnreadCount}
                                </Box>
                            </MenuButton>
                            <MenuButton
                                label="Raise hand"
                                iconStyle="s"
                                icon="hand-paper"
                                borderRadius={0}
                                colorScheme={colorScheme}
                                side="right"
                                onClick={() => {
                                    setCurrentTab(RightSidebarTabs.RaiseHand);
                                    onRightBarOpen();
                                }}
                                mb={1}
                            />
                        </Route>
                        <MenuButton
                            label="Your chats"
                            iconStyle="s"
                            icon="comments"
                            borderRadius={0}
                            colorScheme={colorScheme}
                            side="right"
                            onClick={() => {
                                setCurrentTab(RightSidebarTabs.Chats);
                                onRightBarOpen();
                            }}
                            mb={1}
                        >
                            <Box pos="absolute" top={1} right={1} fontSize="xs">
                                {chatsUnreadCount}
                            </Box>
                        </MenuButton>
                        <MenuButton
                            label="Who's here"
                            iconStyle="s"
                            icon="users"
                            borderRadius={0}
                            colorScheme={colorScheme}
                            side="right"
                            onClick={() => {
                                setCurrentTab(RightSidebarTabs.Presence);
                                onRightBarOpen();
                            }}
                            mb="auto"
                        />
                    </>
                ) : undefined}
            </Flex>
        </HStack>
    );
}
