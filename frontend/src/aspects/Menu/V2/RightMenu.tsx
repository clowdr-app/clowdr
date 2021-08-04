import { Box, Flex, HStack, MenuItem, useBreakpointValue, useColorMode, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import { Link as ReactLink, Route, useRouteMatch } from "react-router-dom";
import LoginButton from "../../Auth/Buttons/LoginButton";
import { useMaybeConference } from "../../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import { useRestorableState } from "../../Generic/useRestorableState";
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
    const [_isExpanded, setIsExpanded] = useRestorableState<boolean>(
        "RightMenu_IsExpanded",
        true,
        (x) => x.toString(),
        (x) => x === "true"
    );
    const isExpanded = !!useBreakpointValue({ base: _isExpanded && !isRightBarOpen, "2xl": _isExpanded });
    const isExpandedEnabled = useBreakpointValue({ base: !isRightBarOpen, "2xl": true });
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
                <MenuButton
                    label={isExpanded ? "Collapse menu" : "Expand menu"}
                    iconStyle="s"
                    icon={isExpanded ? ["grip-lines-vertical", "arrow-right"] : ["arrow-left", "grip-lines-vertical"]}
                    borderTopRadius={0}
                    colorScheme={colorScheme}
                    side="right"
                    mb={1}
                    showLabel={false}
                    onClick={() => setIsExpanded(!isExpanded)}
                    fontSize="xs"
                    justifyContent="center"
                    w="auto"
                    minW="auto"
                    alignSelf="flex-start"
                    minH={0}
                    h="auto"
                    lineHeight={0}
                    m={1.5}
                    isDisabled={!isExpandedEnabled}
                />
                {!maybeUser ? <LoginButton asMenuButtonV2 showLabel={isExpanded} /> : undefined}
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
                                showLabel={isExpanded}
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
                                showLabel={isExpanded}
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
                                showLabel={isExpanded}
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
                            showLabel={isExpanded}
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
                            showLabel={isExpanded}
                        />
                    </>
                ) : undefined}
                {maybeUser ? (
                    <>
                        <MoreOptionsMenuButton
                            label="Options"
                            iconStyle="s"
                            icon="ellipsis-h"
                            borderTopRadius={0}
                            colorScheme={colorScheme}
                            side="right"
                            showLabel={isExpanded}
                            h="auto"
                            pt={1.5}
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
                ) : undefined}
            </Flex>
        </HStack>
    );
}
