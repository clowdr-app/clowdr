import { Tab, TabList, TabPanel, TabPanels, Tabs, Tooltip, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRouteMatch } from "react-router-dom";
import { useGlobalChatState } from "../../../Chat/GlobalChatStateProvider";
import { MyBackstagesModal } from "../../../Conference/Attend/Profile/MyBackstages";
import { FAIcon } from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";
import useMaybeCurrentUser from "../../../Users/CurrentUser/useMaybeCurrentUser";
import { ChatsPanel } from "./Panels/ChatsPanel";
import { ItemChatPanel } from "./Panels/ItemChatPanel";
import { PresencePanel } from "./Panels/PresencePanel";
import { RaiseHandPanel } from "./Panels/RaiseHandPanel";
import { RoomChatPanel } from "./Panels/RoomChatPanel";
import { RightSidebarTabs, useRightSidebarCurrentTab } from "./RightSidebarCurrentTab";
import { ToggleChatsButton } from "./ToggleChatsButton";

function RightSidebarSections_Inner({ confSlug }: { confSlug: string }): JSX.Element {
    const { path } = useRouteMatch();
    const roomMatch = useRouteMatch<{ roomId: string }>(`${path}/room/:roomId`);
    const itemMatch = useRouteMatch<{ itemId: string }>(`${path}/item/:itemId`);
    const roomId = roomMatch?.params?.roomId;
    const itemId = itemMatch?.params?.itemId;
    const [pageChatId, setPageChatId] = useState<string | null>(null);

    const chatState = useGlobalChatState();
    const { currentTab, setCurrentTab } = useRightSidebarCurrentTab();

    useEffect(() => {
        if (roomId || itemId) {
            setCurrentTab(RightSidebarTabs.PageChat);
        } else {
            setPageChatId(null);

            setCurrentTab((ct) =>
                ct === RightSidebarTabs.PageChat || ct === RightSidebarTabs.RaiseHand ? RightSidebarTabs.Presence : ct
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId, roomId]);

    const tabIndex = currentTab - 1;

    const openChatCb = useRef<((chatId: string) => void) | null>(null);
    chatState.openChatInSidebar = useCallback(
        (chatId: string) => {
            setCurrentTab(RightSidebarTabs.Chats);
            openChatCb.current?.(chatId);
        },
        [setCurrentTab]
    );
    const closeChatCb = useRef<(() => void) | null>(null);

    const [pageChatUnread, setPageChatUnread] = useState<string>("");
    const [chatsUnread, setChatsUnread] = useState<string>("");

    const roomPanel = useMemo(
        () => roomId && <RoomChatPanel roomId={roomId} onChatIdLoaded={setPageChatId} setUnread={setPageChatUnread} />,
        [roomId]
    );
    const itemPanel = useMemo(
        () =>
            itemId && (
                <ItemChatPanel
                    itemId={itemId}
                    onChatIdLoaded={setPageChatId}
                    confSlug={confSlug}
                    setUnread={setPageChatUnread}
                />
            ),
        [confSlug, itemId]
    );
    const switchToPageChat = useCallback(() => {
        setCurrentTab(RightSidebarTabs.PageChat);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const chatsPanel = useMemo(
        () => (
            <ChatsPanel
                confSlug={confSlug}
                pageChatId={pageChatId}
                switchToPageChat={switchToPageChat}
                openChat={openChatCb}
                closeChat={closeChatCb}
                setUnread={setChatsUnread}
            />
        ),
        [confSlug, pageChatId, switchToPageChat]
    );
    const presencePanel = useMemo(
        () => <PresencePanel roomId={roomId} isOpen={currentTab === RightSidebarTabs.Presence} />,
        [currentTab, roomId]
    );
    const raiseHandPanel = useMemo(() => <RaiseHandPanel />, []);

    const onChangeTab = useCallback(
        (index) => {
            setCurrentTab(index + 1);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const location = useLocation();

    const { isOpen: myBackstages_IsOpen, onOpen: myBackstages_OnOpen, onClose: myBackstages_OnClose } = useDisclosure();
    const myBackstagesButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        myBackstages_OnClose();
    }, [location.pathname, myBackstages_OnClose]);

    return (
        <>
            <Tabs
                variant="solid-rounded"
                align="center"
                size="sm"
                colorScheme="purple"
                index={tabIndex}
                overflow="hidden"
                display="flex"
                flexFlow="column"
                width="100%"
                height="100%"
                onChange={onChangeTab}
            >
                <TabList py={2} flexWrap="wrap">
                    <ToggleChatsButton ml={2} size="xs" mr={2} />
                    <Tooltip label="Chat for this page">
                        <Tab
                            ml={"auto"}
                            px={2}
                            isDisabled={!roomId && !itemId}
                            _disabled={{
                                opacity: 0.5,
                            }}
                            aria-label="Chat for this page"
                            borderRadius="full"
                        >
                            <FAIcon iconStyle="s" icon="comment" />
                            {pageChatUnread !== "" ? <>&nbsp;({pageChatUnread})</> : ""}
                        </Tab>
                    </Tooltip>
                    <Tooltip label="Raise your hand to join a stream">
                        <Tab
                            ml={2}
                            px={2}
                            mr="auto"
                            isDisabled={!roomId}
                            _disabled={{
                                opacity: 0.5,
                            }}
                            fontSize="lg"
                            borderRadius="full"
                            aria-label="Raise your hand to join a stream"
                        >
                            <FAIcon iconStyle="s" icon="hand-paper" ml="-3px" />
                        </Tab>
                    </Tooltip>
                    <Tooltip label="All your chats">
                        <Tab ml={2} px={2} fontSize="lg" borderRadius="full" aria-label="All your chats">
                            <FAIcon iconStyle="s" icon="comments" />
                            {chatsUnread !== "" ? <>&nbsp;({chatsUnread})</> : ""}
                        </Tab>
                    </Tooltip>
                    <Tooltip label="Who is viewing this page">
                        <Tab
                            mx={2}
                            px={2}
                            fontSize="lg"
                            borderRadius="full"
                            aria-label="List of users viewing this page"
                        >
                            <FAIcon iconStyle="s" icon="users" />
                            <>
                                &nbsp;
                                <PageCountText
                                    fontSize="inherit"
                                    lineHeight="inherit"
                                    path={location.pathname}
                                    noIcon={true}
                                />
                            </>
                        </Tab>
                    </Tooltip>
                </TabList>

                <TabPanels textAlign="left" display="flex" flexDir="row" flex="1" overflow="hidden">
                    {roomPanel ? (
                        <TabPanel p={0} w="100%" h="100%">
                            {roomPanel}
                        </TabPanel>
                    ) : itemPanel ? (
                        <TabPanel p={0} w="100%" h="100%">
                            {itemPanel}
                        </TabPanel>
                    ) : (
                        <TabPanel p={0} w="100%" h="100%"></TabPanel>
                    )}
                    <TabPanel p={"3px"} overflowY="auto" w="100%" h="100%">
                        {raiseHandPanel}
                    </TabPanel>
                    <TabPanel p={0} pt="4px" overflowY="auto" w="100%" h="100%">
                        {chatsPanel}
                    </TabPanel>
                    <TabPanel p={"3px"} overflowY="auto" w="100%" h="100%">
                        {presencePanel}
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <MyBackstagesModal
                isOpen={myBackstages_IsOpen}
                onClose={myBackstages_OnClose}
                finalFocusRef={myBackstagesButtonRef}
            />
        </>
    );
}

export default function RightSidebarSections({ confSlug }: { confSlug: string; onClose: () => void }): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user && user.user.registrants.length > 0) {
        const registrant = user.user.registrants.find((x) => x.conference.slug === confSlug);
        if (registrant) {
            return <RightSidebarSections_Inner confSlug={confSlug} />;
        }
    }
    return <></>;
}
