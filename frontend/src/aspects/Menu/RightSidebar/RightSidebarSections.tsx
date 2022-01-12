import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouteMatch } from "react-router-dom";
import { useGlobalChatState } from "../../Chat/GlobalChatStateProvider";
import { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import { useAuthParameters } from "../../GQL/AuthParameters";
import { ChatsPanel } from "./Panels/ChatsPanel";
import { ItemChatPanel } from "./Panels/ItemChatPanel";
import { PresencePanel } from "./Panels/PresencePanel";
import { RaiseHandPanel } from "./Panels/RaiseHandPanel";
import { RoomChatPanel } from "./Panels/RoomChatPanel";
import { RightSidebarTabs, useRightSidebarCurrentTab } from "./RightSidebarCurrentTab";

function RightSidebarSections_Inner({
    externalSetPageChatAvailable,
    isVisible,
}: {
    externalSetPageChatAvailable?: (isAvailable: boolean) => void;
    isVisible: boolean;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const roomMatch = useRouteMatch<{ roomId: string }>(`${conferencePath}/room/:roomId`);
    const itemMatch = useRouteMatch<{ itemId: string }>(`${conferencePath}/item/:itemId`);
    const conferenceLandingPageMatch = useRouteMatch({
        exact: true,
        path: conferencePath ?? "",
    });
    const exhibitionMatch = useRouteMatch<{ exhibitionId: string }>(`${conferencePath}/exhibition/:exhibitionId`);
    const roomId = roomMatch?.params?.roomId;
    const itemOrExhibitionId =
        itemMatch?.params?.itemId ??
        exhibitionMatch?.params?.exhibitionId ??
        (conferenceLandingPageMatch ? "LANDING_PAGE" : undefined);
    const [pageChatId, setPageChatId] = useState<string | null>(null);

    const chatState = useGlobalChatState();
    const { currentTab, setCurrentTab } = useRightSidebarCurrentTab();

    useEffect(() => {
        if (roomId || itemOrExhibitionId) {
            setCurrentTab(RightSidebarTabs.PageChat);
        } else {
            setPageChatId(null);

            setCurrentTab((ct) =>
                ct === RightSidebarTabs.PageChat || ct === RightSidebarTabs.RaiseHand ? RightSidebarTabs.Presence : ct
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemOrExhibitionId, roomId]);

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
        if (!roomId && !itemOrExhibitionId) {
            externalSetPageChatAvailable?.(false);
        }
    }, [itemOrExhibitionId, roomId, externalSetPageChatAvailable]);

    const roomPanel = useMemo(
        () =>
            roomId && (
                <RoomChatPanel
                    roomId={roomId}
                    onChatIdLoaded={setPageChatId}
                    isVisible={isVisible && !!roomId && currentTab === RightSidebarTabs.PageChat}
                    setPageChatAvailable={externalSetPageChatAvailable}
                />
            ),
        [currentTab, roomId, isVisible, externalSetPageChatAvailable]
    );
    const itemPanel = useMemo(
        () =>
            itemOrExhibitionId && (
                <ItemChatPanel
                    itemOrExhibitionId={itemOrExhibitionId}
                    onChatIdLoaded={setPageChatId}
                    isVisible={isVisible && !!itemOrExhibitionId && currentTab === RightSidebarTabs.PageChat}
                    setPageChatAvailable={externalSetPageChatAvailable}
                />
            ),
        [currentTab, itemOrExhibitionId, isVisible, externalSetPageChatAvailable]
    );
    const switchToPageChat = useCallback(() => {
        setCurrentTab(RightSidebarTabs.PageChat);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const chatsPanel = useMemo(
        () => (
            <ChatsPanel
                pageChatId={pageChatId}
                switchToPageChat={switchToPageChat}
                openChat={openChatCb}
                closeChat={closeChatCb}
                isVisible={isVisible && currentTab === RightSidebarTabs.Chats}
            />
        ),
        [currentTab, pageChatId, switchToPageChat, isVisible]
    );
    const presencePanel = useMemo(
        () => <PresencePanel isOpen={currentTab === RightSidebarTabs.Presence} />,
        [currentTab]
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
                variant="unstyled"
                isFitted
                align="center"
                size="sm"
                colorScheme="RightMenu"
                index={tabIndex}
                overflow="hidden"
                display="flex"
                flexFlow="column"
                width="100%"
                height="100%"
                onChange={onChangeTab}
                zIndex={0}
            >
                <TabList>
                    <Tab _selected={{ color: "white", bg: "RightMenu.700" }}>Chat</Tab>
                    <Tab _selected={{ color: "white", bg: "RightMenu.700" }}>Raise hand</Tab>
                    <Tab _selected={{ color: "white", bg: "RightMenu.700" }}>Chat List</Tab>
                    <Tab _selected={{ color: "white", bg: "RightMenu.700" }}>Who&lsquo;s Here</Tab>
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
        </>
    );
}

export default function RightSidebarSections({
    externalSetPageChatAvailable,
    isVisible,
}: {
    onClose: () => void;
    externalSetPageChatAvailable?: (isAvailable: boolean) => void;
    isVisible: boolean;
}): JSX.Element {
    const registrant = useMaybeCurrentRegistrant();
    if (registrant) {
        return (
            <RightSidebarSections_Inner
                externalSetPageChatAvailable={externalSetPageChatAvailable}
                isVisible={isVisible}
            />
        );
    }
    return <></>;
}
