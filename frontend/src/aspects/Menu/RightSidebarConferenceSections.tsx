import { chakra, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRouteMatch } from "react-router-dom";
import { useGlobalChatState } from "../Chat/GlobalChatStateProvider";
import { useRestorableState } from "../Generic/useRestorableState";
import { FAIcon } from "../Icons/FAIcon";
import PageCountText from "../Realtime/PageCountText";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { ChatsPanel } from "./RightSidebarPanels/ChatsPanel";
import { ItemChatPanel } from "./RightSidebarPanels/ItemChatPanel";
import { PresencePanel } from "./RightSidebarPanels/PresencePanel";
import { RaiseHandPanel } from "./RightSidebarPanels/RaiseHandPanel";
import { RoomChatPanel } from "./RightSidebarPanels/RoomChatPanel";
import { ToggleChatsButton } from "./ToggleChatsButton";

enum RightSidebarTabs {
    PageChat = 1,
    Chats = 2,
    Presence = 3,
    RaiseHand = 4,
}

function RightSidebarConferenceSections_Inner({
    rootUrl,
    confSlug,
}: {
    rootUrl: string;
    confSlug: string;
}): JSX.Element {
    const roomMatch = useRouteMatch<{ roomId: string }>(`${rootUrl}/room/:roomId`);
    const itemMatch = useRouteMatch<{ itemId: string }>(`${rootUrl}/item/:itemId`);
    const roomId = roomMatch?.params?.roomId;
    const itemId = itemMatch?.params?.itemId;
    const [pageChatId, setPageChatId] = useState<string | null>(null);

    const [currentTab, setCurrentTab] = useRestorableState<RightSidebarTabs>(
        "RightSideBar_CurrentTab",
        RightSidebarTabs.Presence,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    const chatState = useGlobalChatState();

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
        [itemId, roomId]
    );

    const location = useLocation();

    return (
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
                <ToggleChatsButton ml={2} mr="auto" size="xs" />
                <Tab
                    ml={2}
                    px={2}
                    py={1}
                    isDisabled={!roomId && !itemId}
                    _disabled={{
                        opacity: 0.5,
                    }}
                >
                    Page Chat{pageChatUnread !== "" ? ` (${pageChatUnread})` : ""}
                </Tab>
                <Tab ml={2} px={2} py={1}>
                    My Chats{chatsUnread !== "" ? ` (${chatsUnread})` : ""}
                </Tab>
                <Tab ml={2} px={2} py={1}>
                    <chakra.span mr={1}>Who&apos;s here</chakra.span>
                    <PageCountText fontSize="inherit" lineHeight="inherit" path={location.pathname} noIcon={true} />
                </Tab>
                <Tab
                    ml={2}
                    px={2}
                    py={1}
                    mr="auto"
                    isDisabled={!roomId}
                    _disabled={{
                        opacity: 0.5,
                    }}
                >
                    <FAIcon iconStyle="s" icon="hand-paper" mr={2} />
                    <chakra.span>Raise hand</chakra.span>
                </Tab>
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
                <TabPanel p={0} pt="4px" overflowY="auto" w="100%" h="100%">
                    {chatsPanel}
                </TabPanel>
                <TabPanel p={"3px"} overflowY="auto" w="100%" h="100%">
                    {presencePanel}
                </TabPanel>
                <TabPanel p={"3px"} overflowY="auto" w="100%" h="100%">
                    {raiseHandPanel}
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}

export default function RightSidebarConferenceSections({
    rootUrl,
    confSlug,
}: {
    rootUrl: string;
    confSlug: string;
    onClose: () => void;
}): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user && user.user.registrants.length > 0) {
        const registrant = user.user.registrants.find((x) => x.conference.slug === confSlug);
        if (registrant) {
            return <RightSidebarConferenceSections_Inner rootUrl={rootUrl} confSlug={confSlug} />;
        }
    }
    return <></>;
}
