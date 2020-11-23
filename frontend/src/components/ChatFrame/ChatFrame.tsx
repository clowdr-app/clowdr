import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Spinner,
    Stack,
    StackDivider,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import type {
    ChatMessage,
    ChatReaction,
    SelectUsersQuery,
} from "../../generated/graphql";
import useChat from "../../hooks/Chats/useChat";
import useUsers from "../../hooks/Users/useUsers";
import FAIcon from "../fontawesome/FAIcon";

type LiveChatMessage = { __typename?: "ChatMessage" } & Pick<
    ChatMessage,
    | "content"
    | "createdAt"
    | "id"
    | "index"
    | "isHighlighted"
    | "senderId"
    | "updatedAt"
> & {
        reactions: Array<
            { __typename?: "ChatReaction" } & Pick<
                ChatReaction,
                "id" | "createdAt" | "reaction" | "reactorId"
            >
        >;
    };

function Message(props: {
    message: LiveChatMessage;
    users: SelectUsersQuery;
}): JSX.Element {
    const senderEl = useMemo(() => {
        const sender = props.users.user.find(
            (user) => user.id === props.message.senderId
        );
        if (sender) {
            return (
                <Text>
                    {sender.firstName} {sender.lastName}
                </Text>
            );
        }
        return undefined;
    }, [props.message.senderId, props.users.user]);

    const sentAt = new Date(props.message.createdAt);
    return (
        <Box width="100%">
            {senderEl}
            <Text>
                {sentAt.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                })}{" "}
                {sentAt.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </Text>
            <Text>{props.message.content}</Text>
        </Box>
    );
}

export default function ChatFrame(): JSX.Element {
    const _chat = useChat();
    const users = useUsers();
    if (_chat.chat && _chat.live && users) {
        const chat = _chat.chat.Chat[0];
        const liveData = _chat.live.Chat[0];

        return (
            <VStack justify="start" align="start" width="100%" height="100%">
                <Heading as="h3" fontSize="170%">
                    {chat.name}
                </Heading>
                {chat.description && (
                    <Text fontSize="120%">{chat.description}</Text>
                )}
                {<Text>{liveData.viewers.length} people here now</Text>}
                <StackDivider borderColor="gray.500" borderTopWidth={1} />
                <Flex
                    height="100%"
                    width="100%"
                    direction="column-reverse"
                    wrap="nowrap"
                    overflowX="hidden"
                    overflowY="auto"
                >
                    <Stack
                        direction="column-reverse"
                        justify="end"
                        align="start"
                        divider={<StackDivider borderColor="gray.700" />}
                    >
                        {liveData.messages.map((message) => (
                            <Message
                                key={message.index}
                                message={message}
                                users={users}
                            />
                        ))}
                    </Stack>
                </Flex>
                <HStack width="100%">
                    <Textarea
                        placeholder="Type a message [Enter to send, Shift+Enter for newline]"
                        height="100%"
                        width="100%"
                        resize="none"
                    />
                    <Flex flexDirection="column">
                        <Button>
                            <FAIcon icon="smile" iconStyle="s" />
                        </Button>
                        <Button>
                            <FAIcon icon="paper-plane" iconStyle="s" />
                        </Button>
                    </Flex>
                </HStack>
            </VStack>
        );
    } else {
        return <Spinner />;
    }
}
