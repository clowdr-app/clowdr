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
import { Twemoji } from "react-emoji-render";
import { useHistory, useRouteMatch } from "react-router-dom";
import {
    useCreateDmMutation,
    useGetContentGroupChatIdQuery,
    useGetRoomChatIdQuery,
    useSearchAttendeesLazyQuery,
} from "../../generated/graphql";
import { Chat } from "../Chat/Chat";
import { ChatState } from "../Chat/ChatGlobalState";
import { ChatNotificationsProvider } from "../Chat/ChatNotifications";
import { useGlobalChatState } from "../Chat/GlobalChatStateProvider";
import { useAttendee } from "../Conference/AttendeesContext";
import { useConference } from "../Conference/useConference";
import type { Attendee } from "../Conference/useCurrentAttendee";
import { useRestorableState } from "../Generic/useRestorableState";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import FAIcon from "../Icons/FAIcon";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import useRoomParticipants from "../Room/useRoomParticipants";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

function ChatListItem({ chat, onClick }: { chat: ChatState; onClick: () => void }): JSX.Element {
    const chatName = chat.Name;
    const [unreadCount, setUnreadCount] = useState<number>(0);
    useEffect(() => {
        return chat.UnreadCount.subscribe((count) => {
            setUnreadCount(count);
        });
    }, [chat.UnreadCount]);

    const isDM = chat.IsDM;
    const isPrivate = chat.IsPrivate;

    return (
        <ListItem key={chat.Id} fontWeight={unreadCount ? "bold" : undefined} display="flex">
            <ListIcon mt="0.7ex" fontSize="sm" as={isDM ? AtSignIcon : isPrivate ? LockIcon : ChatIcon} />
            <Button onClick={onClick} size="sm" variant="ghost" whiteSpace="normal" textAlign="left" h="auto" p={1}>
                <Text as="span">
                    <Twemoji className="twemoji" text={`${unreadCount ? `(${unreadCount})` : ""} ${chatName}`} />
                </Text>
            </Button>
        </ListItem>
    );
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

function PeopleSearch({ createDM }: { createDM: (attendeeId: string) => void }): JSX.Element {
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
    confSlug,
    onChatIdChange,
    pageChatId,
    switchToPageChat,
    openChat,
    closeChat,
}: {
    confSlug: string;
    onChatIdChange: (id: string | null) => void;
    pageChatId: string | null;
    switchToPageChat: () => void;
    openChat: React.MutableRefObject<
        ((chat: { id: string; title: string; roomId: string | undefined }) => void) | null
    >;
    closeChat: React.MutableRefObject<(() => void) | null>;
}): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    const [pinnedChatsMap, setPinnedChatsMap] = useState<Map<string, ChatState> | null>(null);
    const [createDmMutation, createDMMutationResponse] = useCreateDmMutation();

    const globalChatState = useGlobalChatState();
    useEffect(() => {
        const unsubscribeIsPinned = new Map<string, () => void>();

        const unsubscribeChatStates = globalChatState.Chats.subscribe((chatStates) => {
            chatStates.forEach((chatState) => {
                if (!unsubscribeIsPinned.has(chatState.Id)) {
                    unsubscribeIsPinned.set(
                        chatState.Id,
                        chatState.IsPinned.subscribe((isPinned) => {
                            setPinnedChatsMap((oldPinnedChats) => {
                                if (isPinned && !oldPinnedChats?.has(chatState.Id)) {
                                    const newPinnedChats = new Map(oldPinnedChats ?? []);
                                    newPinnedChats.set(chatState.Id, chatState);
                                    return newPinnedChats;
                                } else if (!isPinned && oldPinnedChats?.has(chatState.Id)) {
                                    const newPinnedChats = new Map(oldPinnedChats ?? []);
                                    newPinnedChats.delete(chatState.Id);
                                    return newPinnedChats;
                                }
                                return oldPinnedChats;
                            });
                        })
                    );
                }
            });
        });

        return () => {
            unsubscribeIsPinned.forEach((unsubscribe) => unsubscribe());
            unsubscribeChatStates();
        };
    }, [globalChatState]);
    const pinnedChats = useMemo(() => (pinnedChatsMap ? [...pinnedChatsMap.values()] : undefined), [pinnedChatsMap]);

    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentChat, setCurrentChat] = useState<ChatState | null>(null);
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (currentChatId) {
            unsubscribe = globalChatState.observeChatId(currentChatId, setCurrentChat);
        } else {
            setCurrentChat(null);
        }
        return () => {
            unsubscribe?.();
        };
    }, [currentChatId, globalChatState]);

    openChat.current = useCallback(
        (chat) => {
            setCurrentChatId(chat);

            if (chat.id === pageChatId) {
                switchToPageChat();
            }
        },
        [pageChatId, switchToPageChat]
    );
    closeChat.current = useCallback(() => {
        setCurrentChatId(null);
    }, []);

    useEffect(() => {
        onChatIdChange(currentChat?.Id ?? null);
    }, [onChatIdChange, currentChat?.Id]);

    const history = useHistory();

    const mandatoryPinnedChats = useMemo(() => {
        if (pinnedChats) {
            const chats = pinnedChats.filter((chat) => chat.EnableMandatoryPin);
            if (chats.length > 0) {
                return (
                    <List m={0} mb={2} ml={4}>
                        {chats.sort(ChatState.compare).map((chat) => (
                            <ChatListItem
                                key={chat.Id}
                                chat={chat}
                                onClick={() => {
                                    setCurrentChatId(chat.Id);

                                    if (chat.Id === pageChatId) {
                                        switchToPageChat();
                                    }
                                }}
                            />
                        ))}
                    </List>
                );
            }
        }
        return undefined;
    }, [pageChatId, pinnedChats, switchToPageChat]);

    const dmPinnedChats = useMemo(() => {
        if (pinnedChats) {
            const chats = pinnedChats.filter((chat) => !chat.EnableMandatoryPin && chat.IsDM);
            if (chats) {
                return (
                    <List my={2} ml={4}>
                        {chats.sort(ChatState.compare).map((chat) => (
                            <ChatListItem
                                key={chat.Id}
                                chat={chat}
                                onClick={() => {
                                    setCurrentChatId(chat.Id);

                                    if (chat.Id === pageChatId) {
                                        switchToPageChat();
                                    }
                                }}
                            />
                        ))}
                    </List>
                );
            }
        }
        return undefined;
    }, [pageChatId, pinnedChats, switchToPageChat]);

    const nonDMPinnedChats = useMemo(() => {
        if (pinnedChats) {
            const chats = pinnedChats.filter((chat) => !chat.EnableMandatoryPin && !chat.IsDM);
            if (chats.length > 0) {
                return (
                    <List my={2} ml={4}>
                        {chats.sort(ChatState.compare).map((chat) => (
                            <ChatListItem
                                key={chat.Id}
                                chat={chat}
                                onClick={() => {
                                    setCurrentChatId(chat.Id);

                                    if (chat.Id === pageChatId) {
                                        switchToPageChat();
                                    }
                                }}
                            />
                        ))}
                    </List>
                );
            }
        }
        return undefined;
    }, [pageChatId, pinnedChats, switchToPageChat]);

    const peopleSearch = useMemo(
        () => (
            // TODO: Push createDM through the global chats state class?
            <PeopleSearch
                createDM={async (attendeeId) => {
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
                                setCurrentChatId(result.data.createRoomDm.chatId);

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
    } else if (currentChatId) {
        if (currentChat && currentChat.Id !== pageChatId) {
            return (
                <>
                    <Chat
                        customHeadingElements={[
                            <Tooltip key="back-button" label="Back to chats list">
                                <Button size="xs" colorScheme="purple" onClick={() => setCurrentChatId(null)}>
                                    <FAIcon iconStyle="s" icon="chevron-left" mr={1} /> All chats
                                </Button>
                            </Tooltip>,
                            currentChat && currentChat.RoomId ? (
                                <Tooltip key="video-room-button" label="Go to video room">
                                    <Button
                                        key="room-button"
                                        size="xs"
                                        colorScheme="blue"
                                        onClick={() =>
                                            history.push(`/conference/${confSlug}/room/${currentChat.RoomId}`)
                                        }
                                    >
                                        <FAIcon iconStyle="s" icon="video" />
                                    </Button>
                                </Tooltip>
                            ) : undefined,
                        ]}
                        chat={currentChat}
                    />
                </>
            );
        } else {
            return <Spinner label="Loading selected chat" />;
        }
    } else {
        return (
            <>
                {mandatoryPinnedChats && (
                    <>
                        {mandatoryPinnedChats}
                        <Divider />
                    </>
                )}
                {dmPinnedChats && (
                    <>
                        {dmPinnedChats}
                        <Divider />
                    </>
                )}
                {nonDMPinnedChats && (
                    <>
                        {nonDMPinnedChats}
                        <Divider />
                    </>
                )}
                {pinnedChats && !mandatoryPinnedChats && !dmPinnedChats && !nonDMPinnedChats && (
                    <>
                        No pinned chats.
                        <Divider />
                    </>
                )}
                {!pinnedChats ? (
                    <>
                        <Spinner label="Loading pinned chats" />
                        <Divider />
                    </>
                ) : undefined}
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
            chatId
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

    const globalChatState = useGlobalChatState();
    const [chat, setChat] = useState<ChatState | null | undefined>();
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (!loading) {
            if (data?.Room_by_pk?.chatId) {
                unsubscribe = globalChatState.observeChatId(data?.Room_by_pk?.chatId, setChat);
            } else {
                setChat(null);
            }
        }
        return () => {
            unsubscribe?.();
        };
    }, [data?.Room_by_pk?.chatId, globalChatState, loading]);

    useEffect(() => {
        if (chat?.Id) {
            onChatIdLoaded(chat.Id);
        }
    }, [onChatIdLoaded, chat?.Id]);

    if (loading || chat === undefined) {
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

    if (chat === null) {
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

    return <Chat chat={chat} />;
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

    const globalChatState = useGlobalChatState();
    const [chat, setChat] = useState<ChatState | null | undefined>();
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (!loading) {
            if (data?.ContentGroup_by_pk?.chatId) {
                unsubscribe = globalChatState.observeChatId(data.ContentGroup_by_pk.chatId, setChat);
            } else {
                setChat(null);
            }
        }
        return () => {
            unsubscribe?.();
        };
    }, [data?.ContentGroup_by_pk?.chatId, globalChatState, loading]);

    useEffect(() => {
        if (chat?.Id) {
            onChatIdLoaded(chat.Id);
        }
    }, [onChatIdLoaded, chat?.Id]);

    const history = useHistory();

    if (loading || chat === undefined) {
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

    if (chat === null) {
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

    return (
        <Chat
            customHeadingElements={[
                chat.RoomId ? (
                    <Tooltip key="back-button" label="Go to video room">
                        <Button
                            key="room-button"
                            size="xs"
                            colorScheme="blue"
                            onClick={() => history.push(`/conference/${confSlug}/room/${chat.RoomId}`)}
                        >
                            <FAIcon iconStyle="s" icon="video" />
                        </Button>
                    </Tooltip>
                ) : undefined,
            ]}
            chat={chat}
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
        <List fontSize="sm" width="100%">
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
    suppressChatId,
    openChat,
}: {
    rootUrl: string;
    confSlug: string;
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
    const closeChatCb = useRef<(() => void) | null>(null);

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
                confSlug={confSlug}
                onChatIdChange={setNonPageChatId}
                pageChatId={pageChatId}
                switchToPageChat={() => {
                    setCurrentTab(RightSidebarTabs.PageChat);
                }}
                openChat={openChatCb}
                closeChat={closeChatCb}
            />
        ),
        [confSlug, pageChatId, setCurrentTab]
    );
    const presencePanel = useMemo(() => <PresencePanel roomId={roomId} />, [roomId]);

    const onChangeTab = useCallback(
        (index) => {
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
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [itemId, roomId]
    );

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
                <TabPanel p={0} pt="4px" overflowY="auto" w="100%" h="100%">
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
                        suppressChatId={suppressChatId}
                        openChat={openChat}
                    />
                </>
            );
        }
    }
    return <></>;
}
