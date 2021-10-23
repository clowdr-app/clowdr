import { AtSignIcon, ChatIcon, LockIcon } from "@chakra-ui/icons";
import { Button, Divider, List, ListIcon, ListItem, Spinner, Text, Tooltip, useToast, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import { useHistory } from "react-router-dom";
import { gql } from "urql";
import { useCreateDmMutation } from "../../../../../generated/graphql";
import { Chat } from "../../../../Chat/Chat";
import { ChatState } from "../../../../Chat/ChatGlobalState";
import { useGlobalChatState } from "../../../../Chat/GlobalChatStateProvider";
import { useConference } from "../../../../Conference/useConference";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import FAIcon from "../../../../Icons/FAIcon";
import { PeopleSearch } from "./PeopleSearch";

gql`
    mutation CreateDm($registrantIds: [uuid]!, $conferenceId: uuid!) {
        createRoomDm(registrantIds: $registrantIds, conferenceId: $conferenceId) {
            message
            roomId
            chatId
        }
    }
`;

export function ChatListItem({ chat, onClick }: { chat: ChatState; onClick: () => void }): JSX.Element {
    const chatName = chat.Name;
    const [unreadCount, setUnreadCount] = useState<string>("");
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

export function ChatsPanel({
    pageChatId,
    switchToPageChat,
    openChat,
    closeChat,
    setUnread,
    isVisible,
}: {
    pageChatId: string | null;
    switchToPageChat: () => void;
    openChat: React.MutableRefObject<((chatId: string) => void) | null>;
    closeChat: React.MutableRefObject<(() => void) | null>;
    setUnread: (v: string) => void;
    isVisible: boolean;
}): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const toast = useToast();
    const [pinnedChatsMap, setPinnedChatsMap] = useState<Map<string, ChatState> | null>(null);
    const unreadCountsRef = React.useRef<Map<string, string>>(new Map());
    const [createDMMutationResponse, createDmMutation] = useCreateDmMutation();

    useEffect(() => {
        let unsubs: (() => void)[] = [];

        if (pinnedChatsMap) {
            unsubs = [...pinnedChatsMap.values()].map((chat) =>
                chat.UnreadCount.subscribe((count) => {
                    unreadCountsRef.current.set(chat.Id, count);

                    const total = [...unreadCountsRef.current.values()].reduce(
                        (acc, x) =>
                            !x?.length ? acc : x.includes("+") ? Number.POSITIVE_INFINITY : acc + parseInt(x, 10),
                        0
                    );
                    setUnread(total === Number.POSITIVE_INFINITY ? "10+" : total > 0 ? total.toString() : "");
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
    const pinnedChats = useMemo(
        () => (pinnedChatsMap !== null ? [...pinnedChatsMap.values()] : undefined),
        [pinnedChatsMap]
    );

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
                createDM={async (registrantId) => {
                    if (!createDMMutationResponse.fetching) {
                        try {
                            const result = await createDmMutation({
                                registrantIds: [registrantId],
                                conferenceId: conference.id,
                            });
                            if (
                                result.error ||
                                !result.data?.createRoomDm?.roomId ||
                                !result.data?.createRoomDm?.chatId
                            ) {
                                console.error("Failed to create DM", result.error);
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
            createDMMutationResponse.fetching,
            createDmMutation,
            pageChatId,
            setCurrentChatId,
            switchToPageChat,
            toast,
        ]
    );

    const chat_IsVisible = React.useRef<boolean>(false);
    useEffect(() => {
        const _isVisible = isVisible && !!currentChatId && currentChatId !== pageChatId && !!currentChat;
        chat_IsVisible.current = _isVisible;
        if (_isVisible) {
            currentChat?.fixUnreadCountToZero();
        }
        return () => {
            if (_isVisible) {
                currentChat?.unfixUnreadCountToZero();
            }
        };
    }, [currentChat, currentChatId, pageChatId, isVisible]);
    const chatEl = useMemo(() => {
        if (currentChatId && currentChatId !== pageChatId) {
            if (currentChat) {
                return (
                    <>
                        <Chat
                            isVisible={chat_IsVisible}
                            customHeadingElements={[
                                <Tooltip key="back-button" label="Back to chats list">
                                    <Button
                                        size="xs"
                                        colorScheme="SecondaryActionButton"
                                        onClick={() => setCurrentChatId(null)}
                                        aria-label="Return to all chats list"
                                    >
                                        <FAIcon iconStyle="s" icon="chevron-left" mr={1} />
                                        &nbsp;
                                        <FAIcon iconStyle="s" icon="comments" mr={1} />
                                    </Button>
                                </Tooltip>,
                                currentChat && currentChat.RoomId ? (
                                    <Tooltip key="room-button" label="Go to video room">
                                        <Button
                                            key="room-button"
                                            size="xs"
                                            colorScheme="PrimaryActionButton"
                                            onClick={() => history.push(`${conferencePath}/room/${currentChat.RoomId}`)}
                                            aria-label="Go to video room for this chat"
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
    }, [currentChat, currentChatId, history, pageChatId, setCurrentChatId, conferencePath]);

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

    if (createDMMutationResponse.fetching) {
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
