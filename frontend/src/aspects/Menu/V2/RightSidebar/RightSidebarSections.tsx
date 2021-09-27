import { TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouteMatch } from "react-router-dom";
import { useGlobalChatState } from "../../../Chat/GlobalChatStateProvider";
import useMaybeCurrentUser from "../../../Users/CurrentUser/useMaybeCurrentUser";
import { ChatsPanel } from "./Panels/ChatsPanel";
import { ItemChatPanel } from "./Panels/ItemChatPanel";
import { PresencePanel } from "./Panels/PresencePanel";
import { RaiseHandPanel } from "./Panels/RaiseHandPanel";
import { RoomChatPanel } from "./Panels/RoomChatPanel";
import { RightSidebarTabs, useRightSidebarCurrentTab } from "./RightSidebarCurrentTab";

function RightSidebarSections_Inner({
    confSlug,
    externalSetPageChatUnreadCount,
    externalSetChatsUnreadCount,
    isVisible,
}: {
    confSlug: string;
    externalSetPageChatUnreadCount: (count: string) => void;
    externalSetChatsUnreadCount: (count: string) => void;
    isVisible: boolean;
}): JSX.Element {
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

    useEffect(() => {
        if (!roomId && !itemId) {
            externalSetPageChatUnreadCount("");
        }
    }, [itemId, roomId, externalSetPageChatUnreadCount]);

    const roomPanel = useMemo(
        () =>
            roomId && (
                <RoomChatPanel
                    roomId={roomId}
                    onChatIdLoaded={setPageChatId}
                    setUnread={externalSetPageChatUnreadCount}
                    isVisible={isVisible && !!roomId && currentTab === RightSidebarTabs.PageChat}
                />
            ),
        [currentTab, roomId, externalSetPageChatUnreadCount, isVisible]
    );
    const itemPanel = useMemo(
        () =>
            itemId && (
                <ItemChatPanel
                    itemId={itemId}
                    onChatIdLoaded={setPageChatId}
                    confSlug={confSlug}
                    setUnread={externalSetPageChatUnreadCount}
                    isVisible={isVisible && !!itemId && currentTab === RightSidebarTabs.PageChat}
                />
            ),
        [confSlug, currentTab, itemId, externalSetPageChatUnreadCount, isVisible]
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
                setUnread={externalSetChatsUnreadCount}
                isVisible={isVisible && currentTab === RightSidebarTabs.Chats}
            />
        ),
        [confSlug, currentTab, pageChatId, switchToPageChat, isVisible, externalSetChatsUnreadCount]
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
                pt={1}
            >
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
        </>
    );
}

export default function RightSidebarSections({
    confSlug,
    externalSetPageChatUnreadCount,
    externalSetChatsUnreadCount,
    isVisible,
}: {
    confSlug: string;
    onClose: () => void;
    externalSetPageChatUnreadCount: (count: string) => void;
    externalSetChatsUnreadCount: (count: string) => void;
    isVisible: boolean;
}): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user && user.user.registrants.length > 0) {
        const registrant = user.user.registrants.find((x) => x.conference.slug === confSlug);
        if (registrant) {
            return (
                <RightSidebarSections_Inner
                    confSlug={confSlug}
                    externalSetPageChatUnreadCount={externalSetPageChatUnreadCount}
                    externalSetChatsUnreadCount={externalSetChatsUnreadCount}
                    isVisible={isVisible}
                />
            );
        }
    }
    return <></>;
}
