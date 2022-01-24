import { Box, Flex, HStack, MenuItem, useBreakpointValue, useColorMode, useColorModeValue } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import { Link as ReactLink, Route, useRouteMatch } from "react-router-dom";
import type { Schedule_EventProgramPersonRole_Enum } from "../../../generated/graphql";
import LoginButton from "../../Auth/Buttons/LoginButton";
import LogoutButton from "../../Auth/Buttons/LogoutButton";
import { useMaybeConference } from "../../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import { useRestorableState } from "../../Generic/useRestorableState";
import FAIcon from "../../Icons/FAIcon";
import { useRaiseHandState } from "../../RaiseHand/RaiseHandProvider";
import PageCountText from "../../Realtime/PageCountText";
import useMaybeCurrentUser from "../../Users/CurrentUser/useMaybeCurrentUser";
import { useMainMenu } from "../V1/MainMenu/MainMenuState";
import MenuButton from "./MenuButton";
import MoreOptionsMenuButton from "./MoreOptionsMenuButton";
import { RightSidebarTabs, useRightSidebarCurrentTab } from "./RightSidebar/RightSidebarCurrentTab";
import RightSidebarSections from "./RightSidebar/RightSidebarSections";

export default function RightMenu({ isVisible }: { isVisible: boolean }): JSX.Element {
    const intl = useIntl();
    const { isRightBarOpen, onRightBarOpen, onRightBarClose } = useMainMenu();
    const maybeConference = useMaybeConference();
    const maybeRegistrant = useMaybeCurrentRegistrant();
    const { path } = useRouteMatch();
    const colorScheme = "RightMenu";
    const selectedColorScheme = "gray";
    // const { onOpen: onOpenUXChoice } = useUXChoice();

    const colorMode = useColorMode();
    const maybeUser = useMaybeCurrentUser()?.user;

    const { currentTab, setCurrentTab } = useRightSidebarCurrentTab();

    const [pageChatUnreadCount, setPageChatUnreadCount] = useState<string>("");
    const [chatsUnreadCount, setChatsUnreadCount] = useState<string>("");
    const [pageChatAvailable, setPageChatAvailable] = useState<boolean>(false);

    const rightSections = useMemo(
        () =>
            maybeConference?.slug && maybeRegistrant ? (
                <RightSidebarSections
                    confSlug={maybeConference.slug}
                    onClose={onRightBarClose}
                    externalSetPageChatUnreadCount={setPageChatUnreadCount}
                    externalSetChatsUnreadCount={setChatsUnreadCount}
                    externalSetPageChatAvailable={setPageChatAvailable}
                    isVisible={isVisible}
                />
            ) : undefined,
        [maybeConference?.slug, maybeRegistrant, onRightBarClose, isVisible]
    );
    const sidebarBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
    const [_isExpanded, setIsExpanded] = useRestorableState<boolean>(
        "RightMenu_IsExpanded",
        true,
        (x) => x.toString(),
        (x) => x === "true"
    );
    const isExpanded = !!useBreakpointValue({ base: _isExpanded && !isRightBarOpen, "2xl": _isExpanded });
    const isExpandedEnabled = useBreakpointValue({ base: !isRightBarOpen, "2xl": true });

    useEffect(() => {
        if (!_isExpanded) {
            if (currentTab === RightSidebarTabs.PageChat && isRightBarOpen && !pageChatAvailable) {
                setCurrentTab(RightSidebarTabs.Presence);
            } else if (pageChatAvailable) {
                onRightBarOpen();
                setCurrentTab(RightSidebarTabs.PageChat);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageChatAvailable]);

    const raiseHand = useRaiseHandState();
    const [currentEventId, setCurrentEventId] = useState<{
        eventId: string;
        userRole: Schedule_EventProgramPersonRole_Enum;
    } | null>(null);
    const [isBackstage, setIsBackstage] = useState<boolean>(false);
    const [raisedHandUserIds, setRaisedHandUserIds] = useState<string[] | null>(null);
    useEffect(() => {
        const unsubscribe = raiseHand.CurrentEventId.subscribe(setCurrentEventId);
        return () => {
            unsubscribe();
        };
    }, [raiseHand.CurrentEventId]);

    useEffect(() => {
        const unsubscribe = raiseHand.IsBackstage.subscribe(setIsBackstage);
        return () => {
            unsubscribe();
        };
    }, [raiseHand.IsBackstage]);

    useEffect(() => {
        const unobserve = currentEventId
            ? raiseHand.observe(currentEventId.eventId, (update) => {
                  if ("userIds" in update) {
                      setRaisedHandUserIds(update.userIds);
                  }
              })
            : () => {
                  // Intentionally empty
              };

        return () => {
            unobserve();
        };
    }, [currentEventId, raiseHand]);

    useEffect(() => {
        setRaisedHandUserIds(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path]);

    return (
        <HStack h="100%" w="100%" justifyContent="stretch" spacing={0} overflow="hidden">
            <Box
                display={isRightBarOpen && maybeRegistrant ? "block" : "none"}
                w="auto"
                h="100%"
                zIndex={0}
                bgColor={sidebarBg}
                overflow="hidden"
                flex="0 1 100%"
            >
                {rightSections}
            </Box>
            <Flex
                flexDir="column"
                justifyContent="flex-start"
                alignItems="flex-end"
                zIndex={1}
                h="100%"
                bgColor={`${colorScheme}.700`}
            >
                <MenuButton
                    label={isExpanded ? intl.formatMessage({ id: 'menu.v2.rightmenu.collapse', defaultMessage: "Collapse menu" }) : intl.formatMessage({ id: 'menu.v2.rightmenu.expand', defaultMessage: "Expand menu" })}
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
                {!maybeUser ? (
                    <LoginButton asMenuButtonV2 showLabel={isExpanded} />
                ) : maybeConference ? undefined : (
                    <LogoutButton asMenuButtonV2 showLabel={isExpanded} />
                )}
                {maybeConference?.slug && maybeRegistrant ? (
                    <>
                        {pageChatAvailable ? (
                            <MenuButton
                                label={
                                    (currentTab === RightSidebarTabs.PageChat && isRightBarOpen ? intl.formatMessage({ id: 'menu.v2.rightmenu.close', defaultMessage: "Close" }) + " " : "") +
                                    intl.formatMessage({ id: 'menu.v2.rightmenu.chathere', defaultMessage: "Chat here" })
                                }
                                iconStyle="s"
                                icon={
                                    currentTab === RightSidebarTabs.PageChat && isRightBarOpen
                                        ? "chevron-right"
                                        : "comment"
                                }
                                borderRadius={0}
                                colorScheme={
                                    currentTab === RightSidebarTabs.PageChat && isRightBarOpen
                                        ? selectedColorScheme
                                        : colorScheme
                                }
                                side="right"
                                onClick={() => {
                                    if (currentTab === RightSidebarTabs.PageChat && isRightBarOpen) {
                                        onRightBarClose();
                                    } else {
                                        setCurrentTab(RightSidebarTabs.PageChat);
                                        onRightBarOpen();
                                    }
                                }}
                                mb={1}
                                showLabel={isExpanded}
                            >
                                <Box pos="absolute" top={1} right={1} fontSize="xs">
                                    {pageChatUnreadCount}
                                </Box>
                            </MenuButton>
                        ) : undefined}
                        <Route path={`${path}/room/`}>
                            {isBackstage || currentEventId ? (
                                <MenuButton
                                    label={
                                        (currentTab === RightSidebarTabs.RaiseHand && isRightBarOpen ? intl.formatMessage({ id: 'menu.v2.rightmenu.close', defaultMessage: "Close" }) + " " : "") +
                                        intl.formatMessage({ id: 'menu.v2.rightmenu.raisehand', defaultMessage: "Raise hand" })
                                    }
                                    iconStyle="s"
                                    icon={
                                        currentTab === RightSidebarTabs.RaiseHand && isRightBarOpen
                                            ? "chevron-right"
                                            : "hand-paper"
                                    }
                                    borderRadius={0}
                                    colorScheme={
                                        currentTab === RightSidebarTabs.RaiseHand && isRightBarOpen
                                            ? selectedColorScheme
                                            : colorScheme
                                    }
                                    side="right"
                                    onClick={() => {
                                        if (currentTab === RightSidebarTabs.RaiseHand && isRightBarOpen) {
                                            onRightBarClose();
                                        } else {
                                            setCurrentTab(RightSidebarTabs.RaiseHand);
                                            onRightBarOpen();
                                        }
                                    }}
                                    mb={1}
                                    showLabel={isExpanded}
                                >
                                    <Box pos="absolute" top={1} right={1} fontSize="xs">
                                        {raisedHandUserIds?.length ?? 0}
                                    </Box>
                                </MenuButton>
                            ) : undefined}
                        </Route>
                        <MenuButton
                            label={
                                (currentTab === RightSidebarTabs.Chats && isRightBarOpen ? intl.formatMessage({ id: 'menu.v2.rightmenu.close', defaultMessage: "Close" }) + " " : "") + "My chats"
                            }
                            iconStyle="s"
                            icon={
                                currentTab === RightSidebarTabs.Chats && isRightBarOpen ? "chevron-right" : "comments"
                            }
                            borderRadius={0}
                            colorScheme={
                                currentTab === RightSidebarTabs.Chats && isRightBarOpen
                                    ? selectedColorScheme
                                    : colorScheme
                            }
                            side="right"
                            onClick={() => {
                                if (currentTab === RightSidebarTabs.Chats && isRightBarOpen) {
                                    onRightBarClose();
                                } else {
                                    setCurrentTab(RightSidebarTabs.Chats);
                                    onRightBarOpen();
                                }
                            }}
                            mb={1}
                            showLabel={isExpanded}
                        >
                            <Box pos="absolute" top={1} right={1} fontSize="xs">
                                {chatsUnreadCount}
                            </Box>
                        </MenuButton>
                        <MenuButton
                            label={
                                (currentTab === RightSidebarTabs.Presence && isRightBarOpen ? intl.formatMessage({ id: 'menu.v2.rightmenu.close', defaultMessage: "Close" }) + " " : "") +
                                intl.formatMessage({ id: 'menu.v2.rightmenu.whoshere', defaultMessage: "Who's here" })
                            }
                            iconStyle="s"
                            icon={
                                currentTab === RightSidebarTabs.Presence && isRightBarOpen ? "chevron-right" : "users"
                            }
                            borderRadius={0}
                            colorScheme={
                                currentTab === RightSidebarTabs.Presence && isRightBarOpen
                                    ? selectedColorScheme
                                    : colorScheme
                            }
                            side="right"
                            onClick={() => {
                                if (currentTab === RightSidebarTabs.Presence && isRightBarOpen) {
                                    onRightBarClose();
                                } else {
                                    setCurrentTab(RightSidebarTabs.Presence);
                                    onRightBarOpen();
                                }
                            }}
                            mb="auto"
                            showLabel={isExpanded}
                            minW={isExpanded ? "9em" : undefined}
                        >
                            <Box pos="absolute" top={1} right={1} fontSize="xs">
                                <PageCountText
                                    fontSize="inherit"
                                    lineHeight="inherit"
                                    path={location.pathname}
                                    noIcon
                                    noBrackets
                                    noTooltip
                                />
                            </Box>
                        </MenuButton>
                    </>
                ) : undefined}
                {maybeUser ? (
                    <>
                        <MoreOptionsMenuButton
                            label={intl.formatMessage({ id: 'menu.v2.rightmenu.options', defaultMessage: "Options" })}
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
                                &nbsp;&nbsp;
                                <FormattedMessage
                                    id="menu.v2.rightmenu.toggledarkmode"
                                    defaultMessage="Toggle dark mode"
                                />
                            </MenuItem>
                            <MenuItem as={ReactLink} to="/user/pushNotifications">
                                <FAIcon iconStyle="s" icon="envelope-open-text" />
                                &nbsp;&nbsp;
                                <FormattedMessage
                                    id="menu.v2.rightmenu.pushnotifications"
                                    defaultMessage="Push notifications"
                                />
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
