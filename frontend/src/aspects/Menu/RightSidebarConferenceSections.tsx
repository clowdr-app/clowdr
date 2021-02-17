import { gql } from "@apollo/client";
import { AtSignIcon, ChatIcon, LockIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    HStack,
    Link,
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
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Link as ReactLink, useRouteMatch } from "react-router-dom";
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
}: {
    chat: SidebarChatInfoFragment;
    attendeeId: string;
    confSlug: string;
}): JSX.Element {
    const chatName = computeChatName(chat, attendeeId);
    const chatPath = chat
        ? chat.contentGroup.length > 0
            ? `/item/${chat.contentGroup[0].id}`
            : chat.nonDMRoom.length > 0
            ? `/room/${chat.nonDMRoom[0].id}`
            : chat.DMRoom.length > 0
            ? `/room/${chat.DMRoom[0].id}`
            : undefined
        : undefined;
    const unreadCount =
        chat && chat.readUpToIndices && chat.readUpToIndices.length > 0
            ? chat.readUpToIndices[0].unreadCount ?? undefined
            : undefined;
    const isDM = chat && chat.DMRoom.length;
    const isPrivate = chat && chat.nonDMRoom.length && chat.nonDMRoom[0].roomPrivacyName !== RoomPrivacy_Enum.Public;

    return (
        <ListItem key={chat.id} fontWeight={unreadCount ? "bold" : undefined}>
            <Link as={ReactLink} to={`/conference/${confSlug}${chatPath}`} textDecoration="none">
                <ListIcon mt="0.7ex" as={isDM ? AtSignIcon : isPrivate ? LockIcon : ChatIcon} />{" "}
                <Text as="span">
                    {unreadCount ? `(${unreadCount})` : undefined} {chatName}
                </Text>
            </Link>
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

    // const { isOpen: isCreateDmOpen, onClose: onCreateDmClose, onOpen: onCreateDmOpen } = useDisclosure();
    // const history = useHistory();

    return (
        <>
            {/* <HStack justifyContent="flex-end">
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
            /> */}
            <List m={0} ml={4}>
                {pinnedChats.data?.chat_Pin
                    .filter((chatPin) => chatPin.chat?.enableMandatoryPin)
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                        />
                    ))}
            </List>
            <List my={4} ml={4}>
                {pinnedChats.data?.chat_Pin
                    .filter((chatPin) => !chatPin.chat?.enableMandatoryPin)
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                        />
                    ))}
                {!pinnedChats.data || pinnedChats.data.chat_Pin.length < 1 ? <>No pinned chats.</> : <></>}
            </List>
        </>
    );
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
        }
    }
`;

gql`
    query GetContentGroupChatId($itemId: uuid!) {
        ContentGroup_by_pk(id: $itemId) {
            id
            chatId
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
                      chatId: data?.Room_by_pk?.chatId,
                      chatLabel: "Unused label",
                      chatTitle: "Unused title",
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

function ItemChatPanel({ itemId }: { itemId: string }): JSX.Element {
    const { loading, error, data } = useGetContentGroupChatIdQuery({
        variables: {
            itemId,
        },
    });

    const sources: ChatSources | undefined = useMemo(
        () =>
            data?.ContentGroup_by_pk
                ? {
                      chatId: data?.ContentGroup_by_pk?.chatId,
                      chatLabel: "Unused label",
                      chatTitle: "Unused title",
                  }
                : undefined,
        [data?.ContentGroup_by_pk]
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
                    <AlertTitle>Error loading item chat</AlertTitle>
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
                    <AlertTitle>This item does not have a chat.</AlertTitle>
                </HStack>
            </Alert>
        );
    }

    return <Chat sources={sources} />;
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
    const itemPanel = useMemo(() => itemId && <ItemChatPanel itemId={itemId} />, [itemId]);
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
            flexDir="column"
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
            <TabList pt={2}>
                {roomId && <Tab>Room</Tab>}
                {itemId && <Tab>Item</Tab>}
                <Tab>Chats</Tab>
                <Tab>Who&apos;s here</Tab>
            </TabList>

            <TabPanels textAlign="left" display="flex" flexDir="row" h="100%">
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
                <TabPanel overflowY="auto" w="100%" h="100%">
                    {chatsPanel}
                </TabPanel>
                <TabPanel overflowY="auto" w="100%" h="100%">
                    {presencePanel}
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
    // return <ChatsPanel attendeeId={attendee.id} confSlug={confSlug} />;
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
