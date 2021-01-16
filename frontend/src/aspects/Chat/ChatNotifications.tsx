import { gql } from "@apollo/client";
import { Button, Heading, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Chat_MessageType_Enum,
    SubdChatInfoFragment,
    useSelectNewMessagesQuery,
    useSubdChatsUnreadCountsSubscription,
} from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentAttendee } from "../Conference/useCurrentAttendee";
import { Markdown } from "../Text/Markdown";

gql`
    fragment SubdChatInfo on chat_Chat {
        id
        contentGroup {
            id
            title
            shortTitle
        }
        room {
            id
            name
        }
        readUpToIndices(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            messageId
            unreadCount
        }
    }

    subscription SubdChatsUnreadCounts($attendeeId: uuid!) {
        chat_Subscription(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            chat {
                ...SubdChatInfo
            }
        }
    }

    query SelectNewMessages($where: chat_Message_bool_exp!) {
        chat_Message(order_by: { id: desc }, where: $where) {
            ...ChatMessageData
        }
    }
`;

interface ChatNotificationsCtx {
    setExcludedChatIds: (ids: string[]) => void;
}

const ChatNotificationsContext = React.createContext<ChatNotificationsCtx | undefined>(undefined);

export function useChatNotifications(): ChatNotificationsCtx {
    const ctx = React.useContext(ChatNotificationsContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function ChatNotificationsProvider_WithAttendee({
    children,
    attendeeId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    attendeeId: string;
}): JSX.Element {
    const [excludedChatIds, setExcludedChatIds] = useState<string[]>([]);

    const { refetch: fetchMessages } = useSelectNewMessagesQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const subscription = useSubdChatsUnreadCountsSubscription({
        variables: {
            attendeeId,
        },
    });

    const [storedUnreadCounts, setStoredUnreadCounts] = useState<
        Map<string, { old: number | undefined; new: SubdChatInfoFragment }>
    >(new Map());
    const [loadInTime] = useState<number>(Date.now());
    useEffect(() => {
        if (subscription.data?.chat_Subscription) {
            const data = subscription.data.chat_Subscription;
            setStoredUnreadCounts((old) => {
                const newMap = new Map(old);
                data.forEach((x) => {
                    const prev = newMap.get(x.chatId);
                    if (x.chat && x.chat.readUpToIndices.length > 0) {
                        newMap.set(x.chatId, {
                            old:
                                prev?.new.readUpToIndices && prev.new.readUpToIndices.length > 0
                                    ? prev?.new.readUpToIndices[0].unreadCount ?? undefined
                                    : undefined,
                            new: x.chat,
                        });
                    }
                });
                return newMap;
            });
        }
    }, [excludedChatIds, subscription.data?.chat_Subscription]);

    const conference = useConference();
    const history = useHistory();
    const location = useLocation();
    const toast = useToast();
    const notifiedMessages = React.useRef(new Set<number>());
    useEffect(() => {
        (async () => {
            const or: any[] = [];
            const where = { _or: or };
            for (const [chatId, indexes] of storedUnreadCounts) {
                if (
                    !excludedChatIds.includes(chatId) &&
                    indexes.new.readUpToIndices &&
                    indexes.new.readUpToIndices.length > 0 &&
                    indexes.new.readUpToIndices[0].unreadCount !== undefined &&
                    indexes.new.readUpToIndices[0].unreadCount !== null &&
                    indexes.old !== indexes.new.readUpToIndices[0].unreadCount
                ) {
                    or.push({
                        chatId: { _eq: chatId },
                        id: { _gt: indexes.new.readUpToIndices[0].messageId },
                    });
                }
            }
            const newMessages = await fetchMessages({
                where,
            });

            const now = Date.now();
            let notifiedCount = 0;
            for (let idx = 0; idx < newMessages.data.chat_Message.length; idx++) {
                const newMsg = newMessages.data.chat_Message[idx];
                if (!notifiedMessages.current.has(newMsg.id)) {
                    notifiedMessages.current.add(newMsg.id);

                    if (
                        now - loadInTime > 1500 &&
                        newMsg.senderId !== attendeeId &&
                        (newMsg.type === Chat_MessageType_Enum.Message ||
                            newMsg.type === Chat_MessageType_Enum.Answer ||
                            newMsg.type === Chat_MessageType_Enum.Question) &&
                        // TODO: Remove this hack for avoiding the broken notification load-in behaviour
                        newMessages.data.chat_Message.length < 6
                    ) {
                        const chatInfo = storedUnreadCounts.get(newMsg.chatId);
                        const chatName = chatInfo
                            ? chatInfo.new.contentGroup.length > 0
                                ? chatInfo.new.contentGroup[0].shortTitle ?? chatInfo.new.contentGroup[0].title
                                : chatInfo.new.room.length > 0
                                ? chatInfo.new.room[0].name
                                : undefined
                            : undefined;
                        const chatPath = chatInfo
                            ? chatInfo.new.contentGroup.length > 0
                                ? `/item/${chatInfo.new.contentGroup[0].id}`
                                : chatInfo.new.room.length > 0
                                ? `/room/${chatInfo.new.room[0].id}`
                                : undefined
                            : undefined;

                        if (!chatPath || !location.pathname.endsWith(chatPath)) {
                            toast({
                                position: "top-right",
                                description: newMsg.message,
                                isClosable: true,
                                duration: 8000,
                                render: function ChatNotification() {
                                    return (
                                        <VStack
                                            alignItems="flex-start"
                                            background="black"
                                            color="gray.50"
                                            w="auto"
                                            h="auto"
                                            p={5}
                                            opacity={0.95}
                                            borderRadius={10}
                                        >
                                            <Heading as="h2" fontSize="1.2rem">
                                                New{" "}
                                                {newMsg.type === Chat_MessageType_Enum.Message
                                                    ? "message"
                                                    : newMsg.type === Chat_MessageType_Enum.Answer
                                                    ? "answer"
                                                    : newMsg.type === Chat_MessageType_Enum.Question
                                                    ? "question"
                                                    : "message"}
                                            </Heading>
                                            {chatName ? (
                                                <Heading as="h3" fontSize="0.9rem" fontStyle="italic">
                                                    in {chatName}
                                                </Heading>
                                            ) : undefined}
                                            <Heading as="h3" fontSize="0.9rem" fontStyle="italic">
                                                from {newMsg.sender?.displayName ?? "Unknown sender"}
                                            </Heading>
                                            <Markdown restrictHeadingSize>{newMsg.message}</Markdown>
                                            {chatPath ? (
                                                <Button
                                                    colorScheme="green"
                                                    onClick={() => {
                                                        history.push(`/conference/${conference.slug}${chatPath}`);
                                                    }}
                                                >
                                                    Go to chat
                                                </Button>
                                            ) : undefined}
                                        </VStack>
                                    );
                                },
                            });

                            notifiedCount++;
                            if (notifiedCount % 3 === 0) {
                                await new Promise((resolve) => setTimeout(resolve, 2000));
                            }
                        }
                    }
                }
            }
        })();
    }, [
        fetchMessages,
        toast,
        storedUnreadCounts,
        excludedChatIds,
        attendeeId,
        location.pathname,
        history,
        conference.slug,
        loadInTime,
    ]);

    return (
        <ChatNotificationsContext.Provider value={{ setExcludedChatIds }}>{children}</ChatNotificationsContext.Provider>
    );
}

export function ChatNotificationsProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const attendee = useMaybeCurrentAttendee();

    if (attendee) {
        return (
            <ChatNotificationsProvider_WithAttendee attendeeId={attendee.id}>
                {children}
            </ChatNotificationsProvider_WithAttendee>
        );
    } else {
        return (
            <ChatNotificationsContext.Provider
                value={{
                    setExcludedChatIds: (_ids) => {
                        /* EMPTY */
                    },
                }}
            >
                {children}
            </ChatNotificationsContext.Provider>
        );
    }
}
