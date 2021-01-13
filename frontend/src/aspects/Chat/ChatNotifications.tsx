import { gql } from "@apollo/client";
import { Button, chakra, Heading, Text, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import {
    Chat_MessageType_Enum,
    useSelectNewMessagesQuery,
    useSubdChatsUnreadCountsSubscription,
} from "../../generated/graphql";
import { useMaybeCurrentAttendee } from "../Conference/useCurrentAttendee";

gql`
    subscription SubdChatsUnreadCounts($attendeeId: uuid!) {
        subscribedUnreadCounts: chat_ReadUpToIndex(
            where: { attendeeId: { _eq: $attendeeId }, chat: { subscriptions: { attendeeId: { _eq: $attendeeId } } } }
            limit: 30
        ) {
            chatId
            messageId
            unreadCount
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
    onUnreadCountsChange: (unreadCounts: Map<string, number>) => void;
}): JSX.Element {
    const [excludedChatIds, setExcludedChatIds] = useState<string[]>([]);

    const { refetch: fetchMessages } = useSelectNewMessagesQuery({
        skip: true,
    });
    const subscription = useSubdChatsUnreadCountsSubscription({
        variables: {
            attendeeId,
        },
    });

    const [storedUnreadCounts, setStoredUnreadCounts] = useState<
        Map<string, { old: number | undefined; new: number; msgIdx: number }>
    >(new Map());
    useEffect(() => {
        if (subscription.data?.subscribedUnreadCounts) {
            const data = subscription.data.subscribedUnreadCounts;
            setStoredUnreadCounts((old) => {
                const newMap = new Map(old);
                data.forEach((x) => {
                    const prev = newMap.get(x.chatId);
                    newMap.set(x.chatId, { old: prev?.new, new: x.unreadCount ?? 1, msgIdx: x.messageId });
                });
                return newMap;
            });
        }
    }, [excludedChatIds, subscription.data?.subscribedUnreadCounts]);

    const toast = useToast();
    const notifiedMessages = React.useRef(new Set<number>());
    useEffect(() => {
        (async () => {
            const or: any[] = [];
            const where = { _or: or };
            const supressChatIds = new Set<string>();
            for (const [chatId, indexes] of storedUnreadCounts) {
                if (!excludedChatIds.includes(chatId) && indexes.old !== indexes.new) {
                    or.push({
                        chatId: { _eq: chatId },
                        id: { _gt: indexes.msgIdx },
                    });

                    if (!indexes.old) {
                        supressChatIds.add(chatId);
                    }
                }
            }
            const newMessages = await fetchMessages({
                where,
            });

            let notifiedCount = 0;
            for (let idx = 0; idx < newMessages.data.chat_Message.length; idx++) {
                const newMsg = newMessages.data.chat_Message[idx];
                if (!notifiedMessages.current.has(newMsg.id)) {
                    notifiedMessages.current.add(newMsg.id);

                    if (
                        !supressChatIds.has(newMsg.chatId) &&
                        newMsg.senderId !== attendeeId &&
                        (newMsg.type === Chat_MessageType_Enum.Message ||
                            newMsg.type === Chat_MessageType_Enum.Answer ||
                            newMsg.type === Chat_MessageType_Enum.Question)
                    ) {
                        // TODO: Get the chat's room or content name, room or content id and conference id

                        toast({
                            position: "top-right",
                            description: newMsg.message,
                            isClosable: true,
                            duration: 10000,
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
                                        <Heading as="h3" fontSize="0.9rem" fontStyle="italic">
                                            from {newMsg.sender?.displayName ?? "Unknown sender"}
                                        </Heading>
                                        <Text>{newMsg.message}</Text>
                                        <chakra.a aria-hidden colorScheme="green" as={Button} href={"/conference/TODO"}>
                                            Go to chat
                                        </chakra.a>
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
        })();
    }, [fetchMessages, toast, storedUnreadCounts, excludedChatIds, attendeeId]);

    return (
        <ChatNotificationsContext.Provider value={{ setExcludedChatIds }}>{children}</ChatNotificationsContext.Provider>
    );
}

export function ChatNotificationsProvider({
    children,
    onUnreadCountsChange,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    onUnreadCountsChange: (unreadCounts: Map<string, number>) => void;
}): JSX.Element {
    const attendee = useMaybeCurrentAttendee();

    if (attendee) {
        return (
            <ChatNotificationsProvider_WithAttendee
                onUnreadCountsChange={onUnreadCountsChange}
                attendeeId={attendee.id}
            >
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
