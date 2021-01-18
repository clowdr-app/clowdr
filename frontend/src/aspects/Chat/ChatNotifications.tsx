import { gql } from "@apollo/client";
import { Box, Button, CloseButton, Heading, RenderProps, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Chat_MessageType_Enum,
    RoomPrivacy_Enum,
    useSetNotifiedUpToIndexMutation,
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
            roomPrivacyName
        }
        messages(limit: 1, order_by: { id: desc }) {
            id
            message
            type
            sender {
                id
                displayName
            }
        }
        readUpToIndices(where: { attendeeId: { _eq: $attendeeId } }) {
            attendeeId
            chatId
            notifiedUpToMessageId
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

    mutation SetNotifiedUpToIndex($attendeeId: uuid!, $chatId: uuid!, $msgId: Int!) {
        insert_chat_ReadUpToIndex_one(
            object: { attendeeId: $attendeeId, chatId: $chatId, messageId: -1, notifiedUpToMessageId: $msgId }
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [notifiedUpToMessageId] }
        ) {
            chatId
            attendeeId
            notifiedUpToMessageId
        }
    }
`;

export function ChatNotificationsProvider_WithAttendee({
    children,
    attendeeId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    attendeeId: string;
}): JSX.Element {
    const subscription = useSubdChatsUnreadCountsSubscription({
        variables: {
            attendeeId,
        },
    });
    const [setNotifiedUpTo] = useSetNotifiedUpToIndexMutation();

    const conference = useConference();
    const history = useHistory();
    const location = useLocation();
    const toast = useToast();
    useEffect(() => {
        (async () => {
            if (subscription.data?.chat_Subscription) {
                const data = subscription.data.chat_Subscription;
                for (const subscription of data) {
                    if (subscription.chat && subscription.chat.messages && subscription.chat.messages.length > 0) {
                        const latestMessage = subscription.chat.messages[0];
                        if (
                            !subscription.chat.readUpToIndices ||
                            subscription.chat.readUpToIndices.length === 0 ||
                            subscription.chat.readUpToIndices[0].notifiedUpToMessageId !== latestMessage.id
                        ) {
                            const chatInfo = subscription.chat;

                            setTimeout(() => {
                                setNotifiedUpTo({
                                    variables: {
                                        attendeeId,
                                        chatId: chatInfo.id,
                                        msgId: latestMessage.id,
                                    },
                                });
                            }, Math.random() * 2500);

                            const chatName = chatInfo
                                ? chatInfo.contentGroup.length > 0
                                    ? chatInfo.contentGroup[0].shortTitle ?? chatInfo.contentGroup[0].title
                                    : chatInfo.room.length > 0 &&
                                      chatInfo.room[0].roomPrivacyName !== RoomPrivacy_Enum.Dm
                                    ? chatInfo.room[0].name
                                    : undefined
                                : undefined;
                            const chatPath = chatInfo
                                ? chatInfo.contentGroup.length > 0
                                    ? `/item/${chatInfo.contentGroup[0].id}`
                                    : chatInfo.room.length > 0
                                    ? `/room/${chatInfo.room[0].id}`
                                    : undefined
                                : undefined;

                            const newMsg = chatInfo.messages[0];
                            if (!chatPath || !location.pathname.endsWith(chatPath)) {
                                toast({
                                    position: "top-right",
                                    description: newMsg.message,
                                    isClosable: true,
                                    duration: 8000,
                                    render: function ChatNotification(props: RenderProps) {
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
                                                    {newMsg.type === Chat_MessageType_Enum.Message
                                                        ? "message"
                                                        : newMsg.type === Chat_MessageType_Enum.Answer
                                                        ? "answer"
                                                        : newMsg.type === Chat_MessageType_Enum.Question
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
                                                    from {newMsg.sender?.displayName ?? "Unknown sender"}
                                                </Heading>
                                                <Box maxW="250px" maxH="200px" overflow="hidden" noOfLines={10}>
                                                    <Markdown restrictHeadingSize>{newMsg.message}</Markdown>
                                                </Box>
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
                            }
                        }
                    }
                }
            }
        })();
    }, [conference.slug, history, location.pathname, subscription.data?.chat_Subscription, toast]);

    return <>{children}</>;
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
        return <>{children}</>;
    }
}
