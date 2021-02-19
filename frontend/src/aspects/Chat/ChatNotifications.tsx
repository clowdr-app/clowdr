import { gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, ButtonGroup, CloseButton, Heading, RenderProps, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Chat_MessageType_Enum,
    SidebarReadUpToIndexFragmentDoc,
    useSetNotifiedUpToIndexMutation,
    useSubdMessages_2021_01_21T08_24Subscription,
    useSubscribedChatsQuery,
} from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import useCurrentAttendee, { useMaybeCurrentAttendee } from "../Conference/useCurrentAttendee";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { Markdown } from "../Text/Markdown";

gql`
    query SubscribedChats($attendeeId: uuid!) {
        chat_Subscription(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
        }
    }

    subscription SubdMessages_2021_01_21T08_24($chatIds: [uuid!]!) {
        chat_Message(limit: 5, order_by: { id: desc }, where: { chatId: { _in: $chatIds } }) {
            id
            chatId
            message
            type
            senderId
            senderName
            chatTitle
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
    const subscriptionsQ = useSubscribedChatsQuery({
        variables: {
            attendeeId: currentAttendee.id,
        },
        pollInterval: 120000,
    });

    if (!subscriptionsQ.data) {
        return <></>;
    }

    return (
        <ChatNotificationsProvider_WithAttendeeInner
            attendeeId={attendeeId}
            chatIds={subscriptionsQ.data.chat_Subscription.map((x) => x.chatId)}
            suppressChatId={suppressChatId}
            openChat={openChat}
        />
    );
}

function ChatNotificationsProvider_WithAttendeeInner({
    attendeeId,
    chatIds,
    suppressChatId,
    openChat,
}: {
    attendeeId: string;
    chatIds: string[];
    suppressChatId: React.MutableRefObject<string | null>;
    openChat: React.MutableRefObject<
        ((chat: { id: string; title: string; roomId: string | undefined }) => void) | null
    >;
}): JSX.Element {
    const currentAttendee = useCurrentAttendee();
    const subscription = useSubdMessages_2021_01_21T08_24Subscription({
        variables: {
            chatIds,
        },
    });
    useQueryErrorToast(subscription.error, true, "ChatNotifications:SubdMessages_2021_01_21T08_24");
    const [setNotifiedUpTo] = useSetNotifiedUpToIndexMutation();

    const conference = useConference();
    const history = useHistory();
    const location = useLocation();
    const toast = useToast();
    const latestIndices = useRef<Map<string, number> | null>(null);
    useEffect(() => {
        (async () => {
            if (subscription.data?.chat_Message) {
                const data = subscription.data.chat_Message;
                if (latestIndices.current) {
                    for (const subscription of data) {
                        const latestMessage = subscription;
                        const latestIndex = latestIndices.current?.get(subscription.chatId);
                        if (!latestIndex || latestIndex < latestMessage.id) {
                            latestIndices.current?.set(subscription.chatId, latestMessage.id);

                            setTimeout(() => {
                                setNotifiedUpTo({
                                    variables: {
                                        attendeeId,
                                        chatId: latestMessage.chatId,
                                        msgId: latestMessage.id,
                                    },
                                    update: (cache, { data: _data }) => {
                                        if (_data?.insert_chat_ReadUpToIndex_one) {
                                            const data = _data.insert_chat_ReadUpToIndex_one;
                                            cache.writeFragment({
                                                data,
                                                id: cache.identify(data),
                                                fragment: SidebarReadUpToIndexFragmentDoc,
                                                fragmentName: "SidebarReadUpToIndex",
                                            });
                                        }
                                    },
                                });
                            }, Math.random() * 2500);

                            const chatName = latestMessage.chatTitle;
                            const chatPath = `/conference/${conference.slug}/chat/${latestMessage.chatId}`;

                            if (
                                currentAttendee.id !== latestMessage.senderId &&
                                latestMessage.chatId !== suppressChatId.current &&
                                latestMessage.type !== Chat_MessageType_Enum.DuplicationMarker &&
                                latestMessage.type !== Chat_MessageType_Enum.Emote
                            ) {
                                toast({
                                    position: "top-right",
                                    description: latestMessage.message,
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
                                                    {latestMessage.type === Chat_MessageType_Enum.Message
                                                        ? "message"
                                                        : latestMessage.type === Chat_MessageType_Enum.Answer
                                                        ? "answer"
                                                        : latestMessage.type === Chat_MessageType_Enum.Question
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
                                                    {latestMessage.senderName !== " "
                                                        ? latestMessage.senderName
                                                        : "Sender name unavailable"}
                                                </Heading>
                                                <Box maxW="250px" maxH="200px" overflow="hidden" noOfLines={10}>
                                                    <Markdown restrictHeadingSize>{latestMessage.message}</Markdown>
                                                </Box>
                                                <ButtonGroup isAttached>
                                                    {chatPath ? (
                                                        <Button
                                                            colorScheme="green"
                                                            onClick={() => {
                                                                props.onClose();
                                                                openChat.current?.({
                                                                    id: latestMessage.chatId,
                                                                    title: latestMessage.chatTitle,
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
                } else {
                    latestIndices.current = new Map();
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
        subscription.data?.chat_Message,
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
