import { gql } from "@apollo/client";
import { AtSignIcon, ChatIcon, LockIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    Divider,
    HStack,
    List,
    ListIcon,
    ListItem,
    Spinner,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Tooltip,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useRouteMatch } from "react-router-dom";
import {
    AttendeeFieldsFragment,
    RoomPrivacy_Enum,
    SidebarChatInfoFragment,
    useGetContentGroupChatIdQuery,
    useGetRoomChatIdQuery,
    usePinnedChatsWithUnreadCountsQuery,
} from "../../generated/graphql";
import { Chat } from "../Chat/Chat";
import { ChatNotificationsProvider } from "../Chat/ChatNotifications";
import type { ChatSources } from "../Chat/Configuration";
import { useRestorableState } from "../Generic/useRestorableState";
import FAIcon from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

gql`
    fragment SidebarChatInfo on chat_Chat {
        id
        contentGroup {
            id
            title
            shortTitle
        }
        nonDMRoom: room(where: { roomPrivacyName: { _neq: DM } }) {
            id
            name
            priority
            roomPrivacyName
        }
        DMRoom: room(where: { roomPrivacyName: { _eq: DM } }) {
            id
            name
            roomPeople {
                id
                attendee {
                    id
                    displayName
                }
            }
        }
        enableAutoPin
        enableAutoSubscribe
        enableMandatoryPin
        enableMandatorySubscribe
        readUpToIndices(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            unreadCount
        }
    }

    query PinnedChatsWithUnreadCounts($attendeeId: uuid!) {
        chat_Pin(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            chat {
                ...SidebarChatInfo
            }
        }
    }
`;

function computeChatName(chat: SidebarChatInfoFragment, attendeeId: string): string | undefined {
    return chat
        ? chat.contentGroup.length > 0
            ? chat.contentGroup[0].shortTitle ?? chat.contentGroup[0].title
            : chat.nonDMRoom.length > 0
            ? chat.nonDMRoom[0].name
            : chat.DMRoom.length > 0
            ? chat.DMRoom[0].roomPeople.find((x) => x?.attendee?.id !== attendeeId)?.attendee?.displayName
            : undefined
        : undefined;
}

function ChatListItem({
    chat,
    attendeeId,
    confSlug,
    onClick,
}: {
    chat: SidebarChatInfoFragment;
    attendeeId: string;
    confSlug: string;
    onClick: () => void;
}): JSX.Element {
    const chatName = computeChatName(chat, attendeeId);
    const unreadCount =
        chat && chat.readUpToIndices && chat.readUpToIndices.length > 0
            ? chat.readUpToIndices[0].unreadCount ?? undefined
            : undefined;
    const isDM = chat && chat.DMRoom.length;
    const isPrivate = chat && chat.nonDMRoom.length && chat.nonDMRoom[0].roomPrivacyName !== RoomPrivacy_Enum.Public;

    return (
        <ListItem key={chat.id} fontWeight={unreadCount ? "bold" : undefined} display="flex">
            <ListIcon mt="0.7ex" as={isDM ? AtSignIcon : isPrivate ? LockIcon : ChatIcon} />
            <Button onClick={onClick} size="xs" background="none" whiteSpace="normal" textAlign="left" h="auto" p={1}>
                <Text as="span">
                    {unreadCount ? `(${unreadCount})` : undefined} {chatName}
                </Text>
            </Button>
        </ListItem>
    );
}

function sortChats(attendeeId: string, x: SidebarChatInfoFragment, y: SidebarChatInfoFragment): number {
    function compareNames() {
        const chatNameX = computeChatName(x, attendeeId);
        const chatNameY = computeChatName(y, attendeeId);
        if (chatNameX) {
            if (chatNameY) {
                return chatNameX.localeCompare(chatNameY);
            } else {
                return -1;
            }
        } else if (chatNameY) {
            return 1;
        } else {
            return 0;
        }
    }
    if (x && x.readUpToIndices?.length && x.readUpToIndices[0].unreadCount) {
        if (y && y.readUpToIndices?.length && y.readUpToIndices[0].unreadCount) {
            return compareNames();
        } else {
            return -1;
        }
    } else if (y && y.readUpToIndices?.length && y.readUpToIndices[0].unreadCount) {
        return 1;
    } else {
        return compareNames();
    }
}

function ChatsPanel({ attendeeId, confSlug }: { attendeeId: string; confSlug: string }): JSX.Element {
    const pinnedChats = usePinnedChatsWithUnreadCountsQuery({
        variables: {
            attendeeId,
        },
        pollInterval: 30000,
    });

    const [currentChat, setCurrentChat] = useState<{ id: string; title: string; roomId: string | undefined } | null>(
        null
    );

    const sources: ChatSources | undefined = useMemo(
        () =>
            currentChat
                ? {
                      chatId: currentChat.id,
                      chatLabel: currentChat.title,
                      chatTitle: currentChat.title,
                  }
                : undefined,
        [currentChat]
    );

    const history = useHistory();

    if (sources) {
        return (
            <>
                <Chat
                    customHeadingElements={[
                        <Tooltip key="back-button" label="Back to chats list">
                            <Button size="xs" colorScheme="purple" onClick={() => setCurrentChat(null)}>
                                <FAIcon iconStyle="s" icon="chevron-left" />
                            </Button>
                        </Tooltip>,
                        currentChat?.roomId ? (
                            <Tooltip key="back-button" label="Go to video room">
                                <Button
                                    key="room-button"
                                    size="xs"
                                    colorScheme="blue"
                                    onClick={() => history.push(`/conference/${confSlug}/room/${currentChat.roomId}`)}
                                >
                                    <FAIcon iconStyle="s" icon="video" />
                                </Button>
                            </Tooltip>
                        ) : undefined,
                    ]}
                    sources={sources}
                />
            </>
        );
    } else {
        return (
            <>
                <List m={0} mb={2} ml={4}>
                    {pinnedChats.data?.chat_Pin
                        .filter((chatPin) => chatPin.chat?.enableMandatoryPin)
                        .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                        .map((chatPin) => (
                            <ChatListItem
                                key={chatPin.chatId}
                                chat={chatPin.chat}
                                attendeeId={attendeeId}
                                confSlug={confSlug}
                                onClick={() =>
                                    setCurrentChat({
                                        id: chatPin.chatId,
                                        title: computeChatName(chatPin.chat, attendeeId) ?? "Unknown chat",
                                        roomId:
                                            chatPin.chat.nonDMRoom.length > 0
                                                ? chatPin.chat.nonDMRoom[0].id
                                                : chatPin.chat.DMRoom.length > 0
                                                ? chatPin.chat.DMRoom[0].id
                                                : undefined,
                                    })
                                }
                            />
                        ))}
                </List>
                <Divider />
                <List mt={1} ml={4}>
                    {pinnedChats.data?.chat_Pin
                        .filter((chatPin) => !chatPin.chat?.enableMandatoryPin)
                        .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                        .map((chatPin) => (
                            <ChatListItem
                                key={chatPin.chatId}
                                chat={chatPin.chat}
                                attendeeId={attendeeId}
                                confSlug={confSlug}
                                onClick={() =>
                                    setCurrentChat({
                                        id: chatPin.chatId,
                                        title: computeChatName(chatPin.chat, attendeeId) ?? "Unknown chat",
                                        roomId:
                                            chatPin.chat.nonDMRoom.length > 0
                                                ? chatPin.chat.nonDMRoom[0].id
                                                : chatPin.chat.DMRoom.length > 0
                                                ? chatPin.chat.DMRoom[0].id
                                                : undefined,
                                    })
                                }
                            />
                        ))}
                    {!pinnedChats.data || pinnedChats.data.chat_Pin.length < 1 ? <>No pinned chats.</> : <></>}
                </List>
            </>
        );
    }

    // const { isOpen: isCreateDmOpen, onClose: onCreateDmClose, onOpen: onCreateDmOpen } = useDisclosure();
    // const history = useHistory();
    /* <HStack justifyContent="flex-end">
                <Button onClick={onCreateDmOpen} colorScheme="green" size="sm">
                    <FAIcon icon="plus-square" iconStyle="s" mr={3} /> DM
                </Button>
            </HStack>
            <CreateDmModal
                isOpen={isCreateDmOpen}
                onClose={onCreateDmClose}
                onCreated={async (id: string) => {
                    // Wait, because Vonage session creation is not instantaneous
                    setTimeout(() => {
                        history.push(`/conference/${confSlug}/room/${id}`);
                    }, 2000);
                }}
            /> */
}

enum RightSidebarTabs {
    PageChat = 1,
    Chats = 2,
    Presence = 3,
}

gql`
    query GetRoomChatId($roomId: uuid!) {
        Room_by_pk(id: $roomId) {
            id
            chatId
            name
        }
    }
`;

gql`
    query GetContentGroupChatId($itemId: uuid!) {
        ContentGroup_by_pk(id: $itemId) {
            id
            title
            chat {
                id
                room {
                    id
                }
            }
        }
    }
`;

function RoomChatPanel({ roomId }: { roomId: string }): JSX.Element {
    const { loading, error, data } = useGetRoomChatIdQuery({
        variables: {
            roomId,
        },
    });

    const sources: ChatSources | undefined = useMemo(
        () =>
            data?.Room_by_pk
                ? {
                      chatId: data.Room_by_pk.chatId,
                      chatLabel: data.Room_by_pk.name,
                      chatTitle: data.Room_by_pk.name,
                  }
                : undefined,
        [data?.Room_by_pk]
    );

    if (loading) {
        return <Spinner label="Loading room chat" />;
    }

    if (error) {
        return (
            <Alert
                status="error"
                variant="top-accent"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                textAlign="left"
            >
                <HStack my={2}>
                    <AlertIcon />
                    <AlertTitle>Error loading room chat</AlertTitle>
                </HStack>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    if (!sources) {
        return (
            <Alert
                status="info"
                variant="top-accent"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                textAlign="left"
            >
                <HStack my={2}>
                    <AlertIcon />
                    <AlertTitle>This room does not have a chat.</AlertTitle>
                </HStack>
            </Alert>
        );
    }

    return <Chat sources={sources} />;
}

function ItemChatPanel({ itemId, confSlug }: { itemId: string; confSlug: string }): JSX.Element {
    const { loading, error, data } = useGetContentGroupChatIdQuery({
        variables: {
            itemId,
        },
    });

    const sources: ChatSources | undefined = useMemo(
        () =>
            data?.ContentGroup_by_pk && data.ContentGroup_by_pk.chat
                ? {
                      chatId: data.ContentGroup_by_pk.chat.id,
                      chatLabel: data.ContentGroup_by_pk.title,
                      chatTitle: data.ContentGroup_by_pk.title,
                  }
                : undefined,
        [data?.ContentGroup_by_pk]
    );

    const history = useHistory();

    if (loading) {
        return <Spinner label="Loading room chat" />;
    }

    if (error) {
        return (
            <Alert
                status="error"
                variant="top-accent"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                textAlign="left"
            >
                <HStack my={2}>
                    <AlertIcon />
                    <AlertTitle>Error loading item chat</AlertTitle>
                </HStack>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    if (!sources || !data?.ContentGroup_by_pk?.chat) {
        return (
            <Alert
                status="info"
                variant="top-accent"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                textAlign="left"
            >
                <HStack my={2}>
                    <AlertIcon />
                    <AlertTitle>This item does not have a chat.</AlertTitle>
                </HStack>
            </Alert>
        );
    }

    const chat = data.ContentGroup_by_pk.chat;

    return (
        <Chat
            customHeadingElements={[
                chat.room.length > 0 ? (
                    <Tooltip key="back-button" label="Go to video room">
                        <Button
                            key="room-button"
                            size="xs"
                            colorScheme="blue"
                            onClick={() => history.push(`/conference/${confSlug}/room/${chat.room[0].id}`)}
                        >
                            <FAIcon iconStyle="s" icon="video" />
                        </Button>
                    </Tooltip>
                ) : undefined,
            ]}
            sources={sources}
        />
    );
}

function RightSidebarConferenceSections_Inner({
    rootUrl,
    confSlug,
    attendee,
    onClose,
}: {
    rootUrl: string;
    confSlug: string;
    attendee: AttendeeFieldsFragment;
    onClose: () => void;
}): JSX.Element {
    const roomMatch = useRouteMatch<{ roomId: string }>(`${rootUrl}/room/:roomId`);
    const itemMatch = useRouteMatch<{ itemId: string }>(`${rootUrl}/item/:itemId`);
    const roomId = roomMatch?.params?.roomId;
    const itemId = itemMatch?.params?.itemId;

    const [currentTab, setCurrentTab] = useRestorableState<RightSidebarTabs>(
        "RightSideBar_CurrentTab",
        RightSidebarTabs.Chats,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    useEffect(() => {
        if (roomId || itemId) {
            setCurrentTab(RightSidebarTabs.PageChat);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId, roomId]);

    const tabIndex =
        currentTab === RightSidebarTabs.PageChat
            ? 0
            : currentTab === RightSidebarTabs.Chats
            ? roomId || itemId
                ? 1
                : 0
            : currentTab === RightSidebarTabs.Presence
            ? roomId || itemId
                ? 2
                : 1
            : -2;

    const roomPanel = useMemo(() => roomId && <RoomChatPanel roomId={roomId} />, [roomId]);
    const itemPanel = useMemo(() => itemId && <ItemChatPanel itemId={itemId} confSlug={confSlug} />, [
        confSlug,
        itemId,
    ]);
    const chatsPanel = useMemo(() => <ChatsPanel attendeeId={attendee.id} confSlug={confSlug} />, [
        attendee.id,
        confSlug,
    ]);
    const presencePanel = useMemo(() => <>Presence</>, []);

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
            onChange={(index) => {
                if (roomId || itemId) {
                    switch (index) {
                        case 0:
                            setCurrentTab(RightSidebarTabs.PageChat);
                            break;
                        case 1:
                            setCurrentTab(RightSidebarTabs.Chats);
                            break;
                        case 2:
                            setCurrentTab(RightSidebarTabs.Presence);
                            break;
                    }
                } else {
                    switch (index) {
                        case 0:
                            setCurrentTab(RightSidebarTabs.Chats);
                            break;
                        case 1:
                            setCurrentTab(RightSidebarTabs.Presence);
                            break;
                    }
                }
            }}
        >
            <TabList py={2}>
                {roomId && <Tab>Room</Tab>}
                {itemId && <Tab>Item</Tab>}
                <Tab>Chats</Tab>
                <Tab>Who&apos;s here</Tab>
            </TabList>

            <TabPanels textAlign="left" display="flex" flexDir="row" flex="1" overflow="hidden">
                {roomPanel && (
                    <TabPanel p={0} w="100%" h="100%">
                        {roomPanel}
                    </TabPanel>
                )}
                {itemPanel && (
                    <TabPanel p={0} w="100%" h="100%">
                        {itemPanel}
                    </TabPanel>
                )}
                <TabPanel p={0} overflowY="auto" w="100%" h="100%">
                    {chatsPanel}
                </TabPanel>
                <TabPanel overflowY="auto" w="100%" h="100%">
                    {presencePanel}
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}

export default function RightSidebarConferenceSections({
    rootUrl,
    confSlug,
    onClose,
}: {
    rootUrl: string;
    confSlug: string;
    onClose: () => void;
}): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user && user.user.attendees.length > 0) {
        const attendee = user.user.attendees.find((x) => x.conference.slug === confSlug);
        if (attendee) {
            return (
                <ChatNotificationsProvider>
                    <RightSidebarConferenceSections_Inner
                        rootUrl={rootUrl}
                        confSlug={confSlug}
                        attendee={attendee}
                        onClose={onClose}
                    />
                </ChatNotificationsProvider>
            );
        }
    }
    return <></>;
}
