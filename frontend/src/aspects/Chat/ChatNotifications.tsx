import { gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, ButtonGroup, CloseButton, Heading, RenderProps, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Chat_MessageType_Enum,
    useSetNotifiedUpToIndexMutation,
    useSubdMessages_2021_02_20T21_08Subscription,
} from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import useCurrentAttendee, { useMaybeCurrentAttendee } from "../Conference/useCurrentAttendee";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { Markdown } from "../Text/Markdown";

gql`
    subscription SubdMessages_2021_02_20T21_08($attendeeId: uuid!) {
        chat_Subscription(where: { attendeeId: { _eq: $attendeeId } }) {
            chatId
            attendeeId
            chat {
                id
                messages(limit: 1, order_by: { id: desc }) {
                    id
                    chatId
                    message
                    type
                    senderId
                    senderName
                    chatTitle
                }
            }
        }
    }

    mutation SetNotifiedUpToIndex($attendeeId: uuid!, $chatId: uuid!, $msgId: Int!) {
        insert_chat_ReadUpToIndex_one(
            object: { attendeeId: $attendeeId, chatId: $chatId, messageId: -1, notifiedUpToMessageId: $msgId }
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [notifiedUpToMessageId] }
        ) {
            chatId
            attendeeId
            unreadCount
            notifiedUpToMessageId
        }
    }
`;

function ChatNotificationsProvider_WithAttendee({
    attendeeId,
    suppressChatId,
    openChat,
}: {
    attendeeId: string;
    suppressChatId: React.MutableRefObject<string | null>;
    openChat: React.MutableRefObject<
        ((chat: { id: string; title: string; roomId: string | undefined }) => void) | null
    >;
}): JSX.Element {
    const currentAttendee = useCurrentAttendee();
    const subscription = useSubdMessages_2021_02_20T21_08Subscription({
        variables: {
            attendeeId,
        },
    });
    useQueryErrorToast(subscription.error, true, "ChatNotifications:SubdMessages_2021_02_20T21_08");
    const [setNotifiedUpTo] = useSetNotifiedUpToIndexMutation();

    const conference = useConference();
    const history = useHistory();
    const location = useLocation();
    const toast = useToast();
    const latestIndices = useRef<Map<string, number> | null>(null);
    useEffect(() => {
        (async () => {
            if (subscription.data?.chat_Subscription) {
                const chats = subscription.data.chat_Subscription.map((x) => x.chat);
                if (latestIndices.current) {
                    for (const chat of chats) {
                        if (chat.messages.length > 0) {
                            const message = chat.messages[0];
                            const latestIndex = latestIndices.current?.get(message.chatId);
                            if (!latestIndex || latestIndex < message.id) {
                                latestIndices.current?.set(message.chatId, message.id);

                                // CHAT_TODO
                                // setTimeout(() => {
                                //     setNotifiedUpTo({
                                //         variables: {
                                //             attendeeId,
                                //             chatId: message.chatId,
                                //             msgId: message.id,
                                //         },
                                //         update: (cache, { data: _data }) => {
                                //             if (_data?.insert_chat_ReadUpToIndex_one) {
                                //                 const data = _data.insert_chat_ReadUpToIndex_one;
                                //                 cache.writeFragment({
                                //                     data,
                                //                     id: cache.identify(data),
                                //                     fragment: SidebarReadUpToIndexFragmentDoc,
                                //                     fragmentName: "SidebarReadUpToIndex",
                                //                 });
                                //             }
                                //         },
                                //     });
                                // }, Math.random() * 2500);

                                const chatName = message.chatTitle;
                                const chatPath = `/conference/${conference.slug}/chat/${message.chatId}`;

                                if (
                                    currentAttendee.id !== message.senderId &&
                                    message.chatId !== suppressChatId.current &&
                                    message.type !== Chat_MessageType_Enum.DuplicationMarker &&
                                    message.type !== Chat_MessageType_Enum.Emote
                                ) {
                                    toast({
                                        position: "top-right",
                                        description: message.message,
                                        isClosable: true,
                                        duration: 15000,
                                        render: function ChatNotification(props: RenderProps) {
                                            return (
                                                <VStack
                                                    alignItems="flex-start"
                                                    background="purple.700"
                                                    color="gray.50"
                                                    w="auto"
                                                    h="auto"
                                                    p={5}
                                                    opacity={0.95}
                                                    borderRadius={10}
                                                    position="relative"
                                                    pt={2}
                                                >
                                                    <CloseButton
                                                        position="absolute"
                                                        top={2}
                                                        right={2}
                                                        onClick={props.onClose}
                                                    />
                                                    <Heading textAlign="left" as="h2" fontSize="1rem" my={0} py={0}>
                                                        New{" "}
                                                        {message.type === Chat_MessageType_Enum.Message
                                                            ? "message"
                                                            : message.type === Chat_MessageType_Enum.Answer
                                                            ? "answer"
                                                            : message.type === Chat_MessageType_Enum.Question
                                                            ? "question"
                                                            : "message"}
                                                    </Heading>
                                                    {chatName ? (
                                                        <Heading
                                                            textAlign="left"
                                                            as="h3"
                                                            fontSize="0.9rem"
                                                            fontStyle="italic"
                                                            maxW="250px"
                                                            noOfLines={1}
                                                        >
                                                            in {chatName}
                                                        </Heading>
                                                    ) : undefined}
                                                    <Heading
                                                        textAlign="left"
                                                        as="h3"
                                                        fontSize="0.9rem"
                                                        fontStyle="italic"
                                                        maxW="250px"
                                                        noOfLines={1}
                                                    >
                                                        from{" "}
                                                        {message.senderName !== " "
                                                            ? message.senderName
                                                            : "Sender name unavailable"}
                                                    </Heading>
                                                    <Box maxW="250px" maxH="200px" overflow="hidden" noOfLines={10}>
                                                        <Markdown restrictHeadingSize>{message.message}</Markdown>
                                                    </Box>
                                                    <ButtonGroup isAttached>
                                                        {chatPath ? (
                                                            <Button
                                                                colorScheme="green"
                                                                onClick={() => {
                                                                    props.onClose();
                                                                    openChat.current?.({
                                                                        id: message.chatId,
                                                                        title: message.chatTitle,
                                                                        roomId: undefined,
                                                                    });
                                                                }}
                                                            >
                                                                Go to chat
                                                            </Button>
                                                        ) : undefined}
                                                        {chatPath ? (
                                                            <Button
                                                                colorScheme="blue"
                                                                onClick={() => {
                                                                    props.onClose();
                                                                    window.open(chatPath, "_blank");
                                                                }}
                                                            >
                                                                <ExternalLinkIcon />
                                                            </Button>
                                                        ) : undefined}
                                                    </ButtonGroup>
                                                </VStack>
                                            );
                                        },
                                    });
                                }
                            }
                        }
                    }
                } else {
                    latestIndices.current = new Map();
                    for (const chat of chats) {
                        if (chat.messages.length > 0) {
                            latestIndices.current.set(chat.messages[0].chatId, chat.messages[0].id);
                        }
                    }
                }
            }
        })();
    }, [
        attendeeId,
        conference.slug,
        currentAttendee.id,
        history,
        location.pathname,
        openChat,
        setNotifiedUpTo,
        subscription.data?.chat_Subscription,
        suppressChatId,
        toast,
    ]);

    return <></>;
}

export function ChatNotificationsProvider({
    suppressChatId,
    openChat,
}: {
    suppressChatId: React.MutableRefObject<string | null>;
    openChat: React.MutableRefObject<
        ((chat: { id: string; title: string; roomId: string | undefined }) => void) | null
    >;
}): JSX.Element {
    const attendee = useMaybeCurrentAttendee();

    if (attendee) {
        return (
            <ChatNotificationsProvider_WithAttendee
                attendeeId={attendee.id}
                suppressChatId={suppressChatId}
                openChat={openChat}
            />
        );
    } else {
        return <></>;
    }
}
