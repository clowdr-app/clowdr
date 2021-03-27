import { gql } from "@apollo/client";
import { AtSignIcon, ChatIcon, LockIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
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
    UnorderedList,
    useToast,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Twemoji } from "react-emoji-render";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import {
    useCreateDmMutation,
    useGetContentGroupChatIdQuery,
    useGetRoomChatIdQuery,
    useSearchAttendeesLazyQuery,
} from "../../generated/graphql";
import { Chat } from "../Chat/Chat";
import { ChatState } from "../Chat/ChatGlobalState";
import { useGlobalChatState } from "../Chat/GlobalChatStateProvider";
import { AttendeeIdSpec, useAttendee, useAttendees } from "../Conference/AttendeesContext";
import { useConference, useMaybeConference } from "../Conference/useConference";
import { Attendee, useMaybeCurrentAttendee } from "../Conference/useCurrentAttendee";
import { useRestorableState } from "../Generic/useRestorableState";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import FAIcon from "../Icons/FAIcon";
import { usePresenceState } from "../Presence/PresenceStateProvider";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import useRoomParticipants from "../Room/useRoomParticipants";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { ToggleChatsButton } from "./ToggleChatsButton";

function ChatListItem({ chat, onClick }: { chat: ChatState; onClick: () => void }): JSX.Element {
    const chatName = chat.Name;
    const [unreadCount, setUnreadCount] = useState<number>(0);
    useEffect(() => {
        return chat.UnreadCount.subscribe(setUnreadCount);
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
    const attendee = useMaybeCurrentAttendee();

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
                searchedAttendees={
                    searched && search.length > 0 ? searched.filter((x) => x.id !== attendee?.id) : undefined
                }
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
    setUnread,
}: {
    confSlug: string;
    onChatIdChange: (id: string | null) => void;
    pageChatId: string | null;
    switchToPageChat: () => void;
    openChat: React.MutableRefObject<((chatId: string) => void) | null>;
    closeChat: React.MutableRefObject<(() => void) | null>;
    setUnread: (v: number) => void;
}): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    const [pinnedChatsMap, setPinnedChatsMap] = useState<Map<string, ChatState> | null>(null);
    const unreadCountsRef = React.useRef<Map<string, number>>(new Map());
    const [createDmMutation, createDMMutationResponse] = useCreateDmMutation();

    useEffect(() => {
        let unsubs: (() => void)[] = [];

        if (pinnedChatsMap) {
            unsubs = [...pinnedChatsMap.values()].map((chat) =>
                chat.UnreadCount.subscribe((count) => {
                    unreadCountsRef.current.set(chat.Id, count);

                    const total = [...unreadCountsRef.current.values()].reduce((acc, x) => acc + x);
                    setUnread(total);
                })
            );
        }

        return () => {
            unsubs.forEach((unsub) => unsub());
        };
    }, [pinnedChatsMap, setUnread]);

    const globalChatState = useGlobalChatState();
    useEffect(() => {
        const unsubscribeIsPinned = new Map<string, () => void>();

        const unsubscribeChatStates = globalChatState.Chats.subscribe((chatStates) => {
            if (chatStates.size > 0) {
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
            } else {
                setPinnedChatsMap(new Map());
            }
        });

        return () => {
            unsubscribeIsPinned.forEach((unsubscribe) => unsubscribe());
            unsubscribeChatStates();
        };
    }, [globalChatState]);
    const pinnedChats = useMemo(() => (pinnedChatsMap ? [...pinnedChatsMap.values()] : undefined), [pinnedChatsMap]);

    const [currentChatId, _setCurrentChatId] = useState<string | null>(null);
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
    const setCurrentChatId = useCallback((v: string | null) => {
        setCurrentChat((old) => (old?.Id !== v ? null : old));
        _setCurrentChatId(v);
    }, []);

    openChat.current = useCallback(
        (chatId: string) => {
            setCurrentChatId(chatId);

            if (chatId === pageChatId) {
                switchToPageChat();
            }
        },
        [pageChatId, setCurrentChatId, switchToPageChat]
    );
    closeChat.current = useCallback(() => {
        setCurrentChatId(null);
    }, [setCurrentChatId]);

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
    }, [pageChatId, pinnedChats, setCurrentChatId, switchToPageChat]);

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
    }, [pageChatId, pinnedChats, setCurrentChatId, switchToPageChat]);

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
    }, [pageChatId, pinnedChats, setCurrentChatId, switchToPageChat]);

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
        [
            conference.id,
            createDMMutationResponse.loading,
            createDmMutation,
            pageChatId,
            setCurrentChatId,
            switchToPageChat,
            toast,
        ]
    );

    const chatEl = useMemo(() => {
        if (currentChatId && currentChatId !== pageChatId) {
            if (currentChat) {
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
        }
        return undefined;
    }, [confSlug, currentChat, currentChatId, history, pageChatId, setCurrentChatId]);

    const chatLists = useMemo(
        () => (
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
                {pinnedChats === undefined ? (
                    <>
                        <Spinner label="Loading pinned chats" />
                        <Divider />
                    </>
                ) : undefined}
                {peopleSearch}
            </>
        ),
        [dmPinnedChats, mandatoryPinnedChats, nonDMPinnedChats, peopleSearch, pinnedChats]
    );

    if (createDMMutationResponse.loading) {
        return (
            <VStack alignItems="center">
                <Text>Setting up chat...</Text>
                <div>
                    <Spinner />
                </div>
            </VStack>
        );
    } else if (chatEl) {
        return chatEl;
    } else {
        return chatLists;
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
    setUnread,
}: {
    roomId: string;
    onChatIdLoaded: (chatId: string) => void;
    setUnread: (v: number) => void;
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

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (chat) {
            unsubscribe = chat.UnreadCount.subscribe(setUnread);
        }
        return () => {
            unsubscribe?.();
        };
    }, [chat, setUnread]);

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
    setUnread,
}: {
    itemId: string;
    confSlug: string;
    onChatIdLoaded: (chatId: string) => void;
    setUnread: (v: number) => void;
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

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (chat) {
            unsubscribe = chat.UnreadCount.subscribe(setUnread);
        }
        return () => {
            unsubscribe?.();
        };
    }, [chat, setUnread]);

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
    const [userIds, setUserIds] = useState<AttendeeIdSpec[]>([]);
    const presence = usePresenceState();
    const mConference = useMaybeConference();
    const location = useLocation();

    useEffect(() => {
        return presence.observePage(location.pathname, mConference?.slug, (ids) => {
            setUserIds([...ids.values()].map((x) => ({ user: x })));
        });
    }, [location.pathname, mConference?.slug, presence]);

    const attendees = useAttendees(userIds);
    const sortedAttendees = useMemo(() => R.sortBy((x) => x.displayName, attendees), [attendees]);

    return (
        <UnorderedList fontSize="sm">
            {sortedAttendees.map((attendee) => (
                <ListItem key={attendee.id}>{attendee.displayName}</ListItem>
            ))}
        </UnorderedList>
    );
}

function ParticipantListItem({ attendeeId }: { attendeeId: string }): JSX.Element {
    const idObj = useMemo(() => ({ attendee: attendeeId }), [attendeeId]);
    const attendee = useAttendee(idObj);
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

    const [elements, setElements] = useState<JSX.Element[]>([]);

    useEffect(() => {
        setElements((oldElements) => {
            const newElements: JSX.Element[] = [];
            for (const participant of thisRoomParticipants) {
                if (!oldElements.some((x) => x.key !== participant.id)) {
                    newElements.push(<ParticipantListItem key={participant.id} attendeeId={participant.attendeeId} />);
                }
            }

            const removeIds: string[] = [];
            for (const element of oldElements) {
                if (!thisRoomParticipants.some((x) => x.id === element.key)) {
                    removeIds.push(element.key as string);
                }
            }
            return [...oldElements.filter((x) => !removeIds.includes(x.key as string)), ...newElements];
        });
    }, [thisRoomParticipants]);

    return roomParticipants && roomParticipants.length > 0 ? (
        <>
            <Heading as="h3" fontSize="sm" textAlign="left" mb={2}>
                Connected to this room
            </Heading>
            <Text fontStyle="italic" fontSize="sm" mb={2}>
                Users who have joined the video/audio chat room.
            </Text>
            <List fontSize="sm" width="100%">
                {elements}
            </List>
            <Divider my={4} />
        </>
    ) : (
        <></>
    );
}

function PresencePanel_WithConnectedParticipants({ roomId }: { roomId: string }): JSX.Element {
    return (
        <>
            <RoomParticipantsList roomId={roomId} />
            <Heading as="h3" fontSize="sm" textAlign="left" mb={2}>
                Here with you
            </Heading>
            <Text fontStyle="italic" fontSize="sm" mb={2}>
                Users with at least one tab open on this page.
            </Text>
            <PresencePanel_WithoutConnectedParticipants />
        </>
    );
}

function PresencePanel({ roomId, isOpen }: { roomId?: string; isOpen: boolean }): JSX.Element {
    const [panelContents, setPanelContents] = useState<{
        roomId: string;
        element: JSX.Element;
    } | null>(null);
    useEffect(() => {
        if (isOpen && roomId && roomId !== panelContents?.roomId) {
            setPanelContents({
                roomId,
                element: (
                    <RoomParticipantsProvider roomId={roomId}>
                        <PresencePanel_WithConnectedParticipants roomId={roomId} />
                    </RoomParticipantsProvider>
                ),
            });
        }
    }, [isOpen, roomId, panelContents]);

    useEffect(() => {
        let timeoutId: number | undefined;
        if (!isOpen) {
            timeoutId = setTimeout(
                (() => {
                    setPanelContents(null);
                }) as TimerHandler,
                5000
            );
        }
        return () => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        };
    }, [isOpen]);

    return panelContents?.element ?? (isOpen ? <PresencePanel_WithoutConnectedParticipants /> : <></>);
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
    const [nonPageChatId, setNonPageChatId] = useState<string | null>(null);

    const [currentTab, setCurrentTab] = useRestorableState<RightSidebarTabs>(
        "RightSideBar_CurrentTab",
        RightSidebarTabs.Chats,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    const chatState = useGlobalChatState();

    useEffect(() => {
        switch (currentTab) {
            case RightSidebarTabs.PageChat:
                chatState.suppressNotificationsForChatId = pageChatId;
                break;
            case RightSidebarTabs.Chats:
                chatState.suppressNotificationsForChatId = nonPageChatId;
                break;
            case RightSidebarTabs.Presence:
                chatState.suppressNotificationsForChatId = null;
                break;
        }
    }, [chatState, currentTab, nonPageChatId, pageChatId]);

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

    const openChatCb = useRef<((chatId: string) => void) | null>(null);
    chatState.openChatInSidebar = useCallback(
        (chatId: string) => {
            setCurrentTab(RightSidebarTabs.Chats);
            openChatCb.current?.(chatId);
        },
        [setCurrentTab]
    );
    const closeChatCb = useRef<(() => void) | null>(null);

    const [pageChatUnread, setPageChatUnread] = useState<number>(0);
    const [chatsUnread, setChatsUnread] = useState<number>(0);

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
                onChatIdChange={setNonPageChatId}
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
                <ToggleChatsButton ml={2} mr="auto" size="xs" />
                {roomId && <Tab ml={2}>Room{pageChatUnread > 0 ? ` (${pageChatUnread})` : ""}</Tab>}
                {itemId && (
                    <Tab ml={roomId ? undefined : 2}>Item{pageChatUnread > 0 ? ` (${pageChatUnread})` : ""}</Tab>
                )}
                <Tab ml={roomId || itemId ? undefined : 2}>Chats{chatsUnread > 0 ? ` (${chatsUnread})` : ""}</Tab>
                <Tab mr="auto">Who&apos;s here</Tab>
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
    if (user.user && user.user.attendees.length > 0) {
        const attendee = user.user.attendees.find((x) => x.conference.slug === confSlug);
        if (attendee) {
            return <RightSidebarConferenceSections_Inner rootUrl={rootUrl} confSlug={confSlug} />;
        }
    }
    return <></>;
}
