import { gql } from "@apollo/client";
import { AtSignIcon, ChatIcon, LockIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Center,
    Divider,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
    Image,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
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
    useToast,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useRouteMatch } from "react-router-dom";
import {
    AttendeeFieldsFragment,
    RoomPrivacy_Enum,
    SidebarChatInfoFragment,
    useCreateDmMutation,
    useGetContentGroupChatIdQuery,
    useGetRoomChatIdQuery,
    usePinnedChatsWithUnreadCountsQuery,
    useSearchAttendeesLazyQuery,
} from "../../generated/graphql";
import { Chat } from "../Chat/Chat";
import { ChatNotificationsProvider } from "../Chat/ChatNotifications";
import type { ChatSources } from "../Chat/Configuration";
import { useAttendee } from "../Conference/AttendeesContext";
import { useConference } from "../Conference/useConference";
import type { Attendee } from "../Conference/useCurrentAttendee";
import { useRestorableState } from "../Generic/useRestorableState";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import FAIcon from "../Icons/FAIcon";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import useRoomParticipants from "../Room/useRoomParticipants";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

gql`
    fragment SidebarReadUpToIndex on chat_ReadUpToIndex {
        attendeeId
        chatId
        messageId
        unreadCount
    }

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
            ...SidebarReadUpToIndex
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
    const chatName = computeChatName(chat, attendeeId) ?? "<Unknown chat>";
    const unreadCount =
        chat && chat.readUpToIndices && chat.readUpToIndices.length > 0
            ? chat.readUpToIndices[0].unreadCount ?? undefined
            : undefined;
    const isDM = chat && chat.DMRoom.length;
    const isPrivate = chat && chat.nonDMRoom.length && chat.nonDMRoom[0].roomPrivacyName !== RoomPrivacy_Enum.Public;

    return (
        <ListItem key={chat.id} fontWeight={unreadCount ? "bold" : undefined} display="flex">
            <ListIcon mt="0.7ex" fontSize="sm" as={isDM ? AtSignIcon : isPrivate ? LockIcon : ChatIcon} />
            <Button onClick={onClick} size="sm" variant="ghost" whiteSpace="normal" textAlign="left" h="auto" p={1}>
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

function AttendeeTile({ attendee, onClick }: { attendee: Attendee; onClick: () => void }): JSX.Element {
    return (
        <Button
            variant="ghost"
            borderRadius={0}
            p={0}
            w="100%"
            h="auto"
            minH="25px"
            justifyContent="flex-start"
            onClick={onClick}
            overflow="hidden"
        >
            {attendee.profile.photoURL_50x50 ? (
                <Image
                    w="25px"
                    h="25px"
                    ml={2}
                    aria-describedby={`attendee-trigger-${attendee.id}`}
                    src={attendee.profile.photoURL_50x50}
                />
            ) : (
                <Center w="25px" h="25px" flex="0 0 25px" ml={2}>
                    <FAIcon iconStyle="s" icon="cat" />
                </Center>
            )}
            <Center maxH="100%" flex="0 1 auto" py={0} mx={2} overflow="hidden">
                <Text
                    my={2}
                    as="span"
                    id={`attendee-trigger-${attendee.id}`}
                    maxW="100%"
                    whiteSpace="normal"
                    overflowWrap="anywhere"
                    fontSize="sm"
                >
                    {attendee.displayName}
                </Text>
            </Center>
        </Button>
    );
}

function AttendeesList({
    searchedAttendees,
    createDM,
}: {
    searchedAttendees?: Attendee[];
    createDM: (attendeeId: string, attendeeName: string) => void;
}): JSX.Element {
    return (
        <List>
            {searchedAttendees?.map((attendee, idx) => (
                <ListItem key={attendee.id + "-search-" + idx}>
                    <AttendeeTile
                        attendee={attendee}
                        onClick={() => {
                            createDM(attendee.id, attendee.displayName);
                        }}
                    />
                </ListItem>
            ))}
        </List>
    );
}

function PeopleSearch({ createDM }: { createDM: (attendeeId: string, attendeeName: string) => void }): JSX.Element {
    const [search, setSearch] = useState<string>("");

    const conference = useConference();

    const [
        searchQuery,
        { loading: loadingSearch, error: errorSearch, data: dataSearch },
    ] = useSearchAttendeesLazyQuery();
    useQueryErrorToast(errorSearch, false, "RightSidebarConferenceSections.tsx -- search attendees");

    const [loadedCount, setLoadedCount] = useState<number>(30);

    const [searched, setSearched] = useState<Attendee[] | null>(null);
    const [allSearched, setAllSearched] = useState<Attendee[] | null>(null);

    useEffect(() => {
        setSearched(allSearched?.slice(0, loadedCount) ?? null);
    }, [allSearched, loadedCount]);

    useEffect(() => {
        function doSearch() {
            if ((loadingSearch && !dataSearch) || errorSearch) {
                return undefined;
            }

            if (!dataSearch) {
                return undefined;
            }

            return dataSearch?.Attendee.filter((x) => !!x.profile && !!x.userId) as Attendee[];
        }

        setLoadedCount(30);
        setAllSearched((oldSearched) => doSearch() ?? oldSearched ?? null);
        // We need `search` in the sensitivity list because Apollo cache may not
        // change the data/error/loading state if the result comes straight from
        // the cache of the last run of the search query
    }, [dataSearch, errorSearch, loadingSearch, search]);

    useEffect(() => {
        const tId = setTimeout(() => {
            if (search.length >= 3) {
                searchQuery({
                    variables: {
                        conferenceId: conference.id,
                        search: `%${search}%`,
                    },
                });
            } else {
                setAllSearched(null);
            }
        }, 750);
        return () => {
            clearTimeout(tId);
        };
    }, [conference.id, search, searchQuery]);

    return (
        <>
            <FormControl my={2} px={2}>
                <FormLabel fontSize="sm">Search for people to start a chat</FormLabel>
                <InputGroup size="sm">
                    <InputLeftAddon as="label" id="attendees-search">
                        Search
                    </InputLeftAddon>
                    <Input
                        aria-labelledby="attendees-search"
                        value={search}
                        onChange={(ev) => setSearch(ev.target.value)}
                        placeholder="Type to search"
                    />
                    <InputRightElement>
                        {loadingSearch ? <Spinner /> : <FAIcon iconStyle="s" icon="search" />}
                    </InputRightElement>
                </InputGroup>
                <FormHelperText>Search names, affiliations and bios. (Min length 3)</FormHelperText>
            </FormControl>
            <AttendeesList
                createDM={createDM}
                searchedAttendees={searched && search.length > 0 ? searched : undefined}
            />
        </>
    );
}

function ChatsPanel({
    attendeeId,
    confSlug,
    onChatIdChange,
    pageChatId,
    switchToPageChat,
    openChat,
}: {
    attendeeId: string;
    confSlug: string;
    onChatIdChange: (id: string | null) => void;
    pageChatId: string | null;
    switchToPageChat: () => void;
    openChat: React.MutableRefObject<
        ((chat: { id: string; title: string; roomId: string | undefined }) => void) | null
    >;
}): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    const pinnedChats = usePinnedChatsWithUnreadCountsQuery({
        variables: {
            attendeeId,
        },
        // pollInterval: 10000,
    });
    const [createDmMutation, createDMMutationResponse] = useCreateDmMutation();

    const [currentChat, setCurrentChat] = useState<{ id: string; title: string; roomId: string | undefined } | null>(
        null
    );

    openChat.current = useCallback(
        (chat) => {
            setCurrentChat(chat);

            if (chat.id === pageChatId) {
                switchToPageChat();
            }
        },
        [pageChatId, switchToPageChat]
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

    useEffect(() => {
        onChatIdChange(sources?.chatId ?? null);
    }, [onChatIdChange, sources?.chatId]);

    const history = useHistory();

    const mandatoryPinnedChats = useMemo(
        () => (
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
                            onClick={() => {
                                setCurrentChat({
                                    id: chatPin.chatId,
                                    title: computeChatName(chatPin.chat, attendeeId) ?? "Unknown chat",
                                    roomId:
                                        chatPin.chat.nonDMRoom.length > 0
                                            ? chatPin.chat.nonDMRoom[0].id
                                            : chatPin.chat.DMRoom.length > 0
                                            ? chatPin.chat.DMRoom[0].id
                                            : undefined,
                                });

                                if (chatPin.chatId === pageChatId) {
                                    switchToPageChat();
                                }
                            }}
                        />
                    ))}
            </List>
        ),
        [attendeeId, confSlug, pageChatId, pinnedChats.data?.chat_Pin, switchToPageChat]
    );

    const dmPinnedChats = useMemo(
        () => (
            <List my={2} ml={4}>
                {pinnedChats.data?.chat_Pin
                    .filter(
                        (chatPin) => !!chatPin.chat && !chatPin.chat?.enableMandatoryPin && chatPin.chat?.DMRoom.length
                    )
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                            onClick={() => {
                                setCurrentChat({
                                    id: chatPin.chatId,
                                    title: computeChatName(chatPin.chat, attendeeId) ?? "Unknown chat",
                                    roomId:
                                        chatPin.chat.nonDMRoom.length > 0
                                            ? chatPin.chat.nonDMRoom[0].id
                                            : chatPin.chat.DMRoom.length > 0
                                            ? chatPin.chat.DMRoom[0].id
                                            : undefined,
                                });

                                if (chatPin.chatId === pageChatId) {
                                    switchToPageChat();
                                }
                            }}
                        />
                    ))}
                {!pinnedChats.data || pinnedChats.data.chat_Pin.length < 1 ? <>No pinned chats.</> : <></>}
            </List>
        ),
        [attendeeId, confSlug, pageChatId, pinnedChats.data, switchToPageChat]
    );

    const nonDMPinnedChats = useMemo(
        () => (
            <List my={2} ml={4}>
                {pinnedChats.data?.chat_Pin
                    .filter(
                        (chatPin) => !!chatPin.chat && !chatPin.chat?.enableMandatoryPin && !chatPin.chat?.DMRoom.length
                    )
                    .sort((x, y) => sortChats(attendeeId, x.chat, y.chat))
                    .map((chatPin) => (
                        <ChatListItem
                            key={chatPin.chatId}
                            chat={chatPin.chat}
                            attendeeId={attendeeId}
                            confSlug={confSlug}
                            onClick={() => {
                                setCurrentChat({
                                    id: chatPin.chatId,
                                    title: computeChatName(chatPin.chat, attendeeId) ?? "Unknown chat",
                                    roomId:
                                        chatPin.chat.nonDMRoom.length > 0
                                            ? chatPin.chat.nonDMRoom[0].id
                                            : chatPin.chat.DMRoom.length > 0
                                            ? chatPin.chat.DMRoom[0].id
                                            : undefined,
                                });

                                if (chatPin.chatId === pageChatId) {
                                    switchToPageChat();
                                }
                            }}
                        />
                    ))}
                {!pinnedChats.data || pinnedChats.data.chat_Pin.length < 1 ? <>No pinned chats.</> : <></>}
            </List>
        ),
        [attendeeId, confSlug, pageChatId, pinnedChats.data, switchToPageChat]
    );

    const peopleSearch = useMemo(
        () => (
            <PeopleSearch
                createDM={async (attendeeId, attendeeName) => {
                    if (!createDMMutationResponse.loading) {
                        try {
                            const result = await createDmMutation({
                                variables: {
                                    attendeeIds: [attendeeId],
                                    conferenceId: conference.id,
                                },
                            });
                            if (
                                result.errors ||
                                !result.data?.createRoomDm?.roomId ||
                                !result.data?.createRoomDm?.chatId
                            ) {
                                console.error("Failed to create DM", result.errors);
                                throw new Error("Failed to create DM");
                            } else {
                                setCurrentChat({
                                    id: result.data.createRoomDm.chatId,
                                    roomId: result.data.createRoomDm.roomId,
                                    title: attendeeName,
                                });

                                if (result.data.createRoomDm.chatId === pageChatId) {
                                    switchToPageChat();
                                }
                            }
                        } catch (e) {
                            toast({
                                title: "Could not create DM",
                                status: "error",
                            });
                            console.error("Could not create DM", e);
                        }
                    }
                }}
            />
        ),
        [conference.id, createDMMutationResponse.loading, createDmMutation, pageChatId, switchToPageChat, toast]
    );

    if (createDMMutationResponse.loading) {
        return (
            <VStack alignItems="center">
                <Text>Setting up chat...</Text>
                <Box>
                    <Spinner />
                </Box>
            </VStack>
        );
    } else if (sources && sources.chatId !== pageChatId) {
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
                            <Tooltip key="video-room-button" label="Go to video room">
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
                {mandatoryPinnedChats}
                <Divider />
                {dmPinnedChats}
                <Divider />
                {nonDMPinnedChats}
                <Divider />
                {peopleSearch}
            </>
        );
    }
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

function RoomChatPanel({
    roomId,
    onChatIdLoaded,
}: {
    roomId: string;
    onChatIdLoaded: (chatId: string) => void;
}): JSX.Element {
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

    useEffect(() => {
        if (sources?.chatId) {
            onChatIdLoaded(sources.chatId);
        }
    }, [onChatIdLoaded, sources?.chatId]);

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

function ItemChatPanel({
    itemId,
    confSlug,
    onChatIdLoaded,
}: {
    itemId: string;
    confSlug: string;
    onChatIdLoaded: (chatId: string) => void;
}): JSX.Element {
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

    useEffect(() => {
        if (sources?.chatId) {
            onChatIdLoaded(sources.chatId);
        }
    }, [onChatIdLoaded, sources?.chatId]);

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

function PresencePanel_WithoutConnectedParticipants(): JSX.Element {
    return (
        <Text fontSize="sm" fontStyle="italic">
            Coming soon!
        </Text>
    );
}

function ParticipantListItem({ attendeeId }: { attendeeId: string }): JSX.Element {
    const attendee = useAttendee(attendeeId);
    return (
        <ListItem fontWeight="light">
            <FAIcon icon="circle" iconStyle="s" fontSize="0.5rem" color="green.400" mr={2} mb={1} />
            {attendee?.displayName ?? "Loading"}
        </ListItem>
    );
}

function RoomParticipantsList({ roomId }: { roomId: string }): JSX.Element {
    const roomParticipants = useRoomParticipants();

    const thisRoomParticipants = useMemo(
        () => (roomParticipants ? roomParticipants.filter((participant) => participant.roomId === roomId) : []),
        [roomId, roomParticipants]
    );

    return roomParticipants && roomParticipants.length > 0 ? (
        <List fontSize="sm" maxH="3rem" overflowY="hidden" columns={3} columnGap={3} width="100%">
            {thisRoomParticipants.map((participant) => (
                <ParticipantListItem key={participant.id} attendeeId={participant.attendeeId} />
            ))}
        </List>
    ) : (
        <Text fontSize="sm" fontStyle="italic">
            Nobody is connected to this room at the moment.
        </Text>
    );
}

function PresencePanel_WithConnectedParticipants({ roomId }: { roomId: string }): JSX.Element {
    return (
        <>
            <Heading as="h3" fontSize="sm" textAlign="left" mb={2}>
                Connected to this room
            </Heading>
            <RoomParticipantsList roomId={roomId} />
            <Divider my={4} />
            <Heading as="h3" fontSize="sm" textAlign="left" mb={2}>
                Here with you
            </Heading>
            <PresencePanel_WithoutConnectedParticipants />
        </>
    );
}

function PresencePanel({ roomId }: { roomId?: string }): JSX.Element {
    if (roomId) {
        return (
            <RoomParticipantsProvider roomId={roomId}>
                <PresencePanel_WithConnectedParticipants roomId={roomId} />
            </RoomParticipantsProvider>
        );
    } else {
        return <PresencePanel_WithoutConnectedParticipants />;
    }
}

function RightSidebarConferenceSections_Inner({
    rootUrl,
    confSlug,
    attendee,
    onClose,
    suppressChatId,
    openChat,
}: {
    rootUrl: string;
    confSlug: string;
    attendee: AttendeeFieldsFragment;
    onClose: () => void;
    suppressChatId: React.MutableRefObject<string | null>;
    openChat: React.MutableRefObject<
        ((chat: { id: string; title: string; roomId: string | undefined }) => void) | null
    >;
}): JSX.Element {
    const roomMatch = useRouteMatch<{ roomId: string }>(`${rootUrl}/room/:roomId`);
    const itemMatch = useRouteMatch<{ itemId: string }>(`${rootUrl}/item/:itemId`);
    const roomId = roomMatch?.params?.roomId;
    const itemId = itemMatch?.params?.itemId;
    const [pageChatId, setPageChatId] = useState<string | null>(null);
    const [nonPageChatId, setNonPageChatId] = useState<string | null>(null);

    const [currentTab, setCurrentTab] = useRestorableState<RightSidebarTabs>(
        "RightSideBar_CurrentTab",
        RightSidebarTabs.Chats,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    useEffect(() => {
        switch (currentTab) {
            case RightSidebarTabs.PageChat:
                suppressChatId.current = pageChatId;
                break;
            case RightSidebarTabs.Chats:
                suppressChatId.current = nonPageChatId;
                break;
            case RightSidebarTabs.Presence:
                suppressChatId.current = null;
                break;
        }
    }, [currentTab, nonPageChatId, pageChatId, suppressChatId]);

    useEffect(() => {
        if (roomId || itemId) {
            setCurrentTab(RightSidebarTabs.PageChat);
        } else {
            setPageChatId(null);
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

    const openChatCb = useRef<((chat: { id: string; title: string; roomId: string | undefined }) => void) | null>(null);
    openChat.current = useCallback(
        (chat) => {
            setCurrentTab(RightSidebarTabs.Chats);
            openChatCb.current?.(chat);
        },
        [setCurrentTab]
    );

    const roomPanel = useMemo(() => roomId && <RoomChatPanel roomId={roomId} onChatIdLoaded={setPageChatId} />, [
        roomId,
    ]);
    const itemPanel = useMemo(
        () => itemId && <ItemChatPanel itemId={itemId} onChatIdLoaded={setPageChatId} confSlug={confSlug} />,
        [confSlug, itemId]
    );
    const chatsPanel = useMemo(
        () => (
            <ChatsPanel
                attendeeId={attendee.id}
                confSlug={confSlug}
                onChatIdChange={setNonPageChatId}
                pageChatId={pageChatId}
                switchToPageChat={() => {
                    setCurrentTab(RightSidebarTabs.PageChat);
                }}
                openChat={openChatCb}
            />
        ),
        [attendee.id, confSlug, pageChatId, setCurrentTab]
    );
    const presencePanel = useMemo(() => <PresencePanel roomId={roomId} />, [roomId]);

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
    const suppressChatId = useRef<string | null>(null);
    const openChat = useRef<((chat: { id: string; title: string; roomId: string | undefined }) => void) | null>(null);
    if (user.user && user.user.attendees.length > 0) {
        const attendee = user.user.attendees.find((x) => x.conference.slug === confSlug);
        if (attendee) {
            return (
                <>
                    <ChatNotificationsProvider suppressChatId={suppressChatId} openChat={openChat} />
                    <RightSidebarConferenceSections_Inner
                        rootUrl={rootUrl}
                        confSlug={confSlug}
                        attendee={attendee}
                        onClose={onClose}
                        suppressChatId={suppressChatId}
                        openChat={openChat}
                    />
                </>
            );
        }
    }
    return <></>;
}
