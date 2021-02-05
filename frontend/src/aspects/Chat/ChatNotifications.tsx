import { gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, ButtonGroup, CloseButton, Heading, RenderProps, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
    Chat_MessageType_Enum,
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
        chat_Message(limit: 1, order_by: { id: desc }, where: { chatId: { _in: $chatIds } }) {
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
    const currentAttendee = useCurrentAttendee();
    const subscriptionsQ = useSubscribedChatsQuery({
        variables: {
            attendeeId: currentAttendee.id,
        },
        pollInterval: 120000,
    });

    if (!subscriptionsQ.data) {
        return <>{children}</>;
    }

    return (
        <ChatNotificationsProvider_WithAttendeeInner
            attendeeId={attendeeId}
            chatIds={subscriptionsQ.data.chat_Subscription.map((x) => x.chatId)}
        >
            {children}
        </ChatNotificationsProvider_WithAttendeeInner>
    );
}

export function ChatNotificationsProvider_WithAttendeeInner({
    children,
    attendeeId,
    chatIds,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    attendeeId: string;
    chatIds: string[];
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
                        if (!latestIndex || latestIndex !== latestMessage.id) {
                            setTimeout(() => {
                                setNotifiedUpTo({
                                    variables: {
                                        attendeeId,
                                        chatId: latestMessage.chatId,
                                        msgId: latestMessage.id,
                                    },
                                });
                            }, Math.random() * 2500);

                            const chatName = latestMessage.chatTitle;
                            const chatPath = `/conference/${conference.slug}/chat/${latestMessage.chatId}`;

                            if (
                                currentAttendee.id !== latestMessage.senderId &&
                                (!chatPath || !location.pathname.endsWith(chatPath)) &&
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
                                                            variant="outline"
                                                            onClick={() => {
                                                                props.onClose();
                                                                history.push(chatPath);
                                                            }}
                                                        >
                                                            Go to chat
                                                        </Button>
                                                    ) : undefined}
                                                    {chatPath ? (
                                                        <Button
                                                            colorScheme="blue"
                                                            variant="outline"
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

                if (!latestIndices.current) {
                    latestIndices.current = new Map();
                }
                data.forEach((x) => {
                    if (x) {
                        latestIndices.current?.set(x.chatId, x.id);
                    }
                });
            }
        })();
    }, [
        attendeeId,
        conference.slug,
        currentAttendee.id,
        history,
        location.pathname,
        setNotifiedUpTo,
        subscription.data?.chat_Message,
        toast,
    ]);

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
