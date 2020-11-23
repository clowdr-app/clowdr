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
import React, { useEffect, useMemo, useState } from "react";
import type {
    ChatMessage,
    ChatReaction,
    SelectUsersQuery,
} from "../../generated/graphql";
import useChat from "../../hooks/Chats/useChat";
import useIsTyping from "../../hooks/Chats/useIsTyping";
import useQueryErrorToast from "../../hooks/useQueryErrorToast";
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

function MessageList({
    messages,
    users,
}: {
    messages: LiveChatMessage[];
    users?: SelectUsersQuery;
}): JSX.Element {
    return (
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
                {users && messages.map((message) => (
                    <Message
                        key={message.index}
                        message={message}
                        users={users}
                    />
                ))}
            </Stack>
        </Flex>
    );
}

export default function ChatFrame(): JSX.Element {
    const _chat = useChat();
    const users = useUsers();
    const [newMessageText, setNewMessageText] = useState<string>();
    const [wasTyping, setWasTyping] = useState<number | null>(null);

    // TODO: Delete other people who were typing but have not updated for a while

    const {
        isTyping,
        isNotTyping,
        loading: isTypingLoading,
        error: isTypingError,
    } = useIsTyping(_chat.chatId);
    useEffect(() => {
        return () => {
            isNotTyping();
        };
    }, [isNotTyping]);

    useQueryErrorToast(isTypingError);

    const newMessageTextChanged = (isFocused: boolean, value?: string) => {
        if (value !== undefined) {
            setNewMessageText(value);
        }

        const oldValue = newMessageText?.trim() ?? "";
        const newValue = (value ?? oldValue).trim();
        const isNowTyping = isFocused && newValue.length > 0;

        const now = Date.now();
        if (isNowTyping && (wasTyping === null || now - wasTyping > 20000)) {
            setWasTyping(now);
            if (!isTypingLoading) {
                isTyping();
            }
        } else if (!isNowTyping && wasTyping !== null) {
            setWasTyping(null);
            if (!isTypingLoading) {
                isNotTyping();
            }
        }
    };

    const { count: typersCount, str: typersStr } = useMemo(
        () =>
            users && _chat.live && _chat.live.Chat[0]
                ? _chat.live.Chat[0].typers.reduce(
                      (acc, typer) => {
                          const now = Date.now();
                          if (
                              now - new Date(typer.updatedAt).getTime() <
                              20000
                          ) {
                              const user = users.user.find(
                                  (x) => x.id === typer.userId
                              );
                              if (user) {
                                  return {
                                      count: acc.count + 1,
                                      str:
                                          acc.str +
                                          ", " +
                                          user.firstName +
                                          " " +
                                          user.lastName,
                                  };
                              }
                          }
                          return acc;
                      },
                      { count: 0, str: "" }
                  )
                : { count: 0, str: "" },
        [_chat.live, users]
    );

    const messageListEl = useMemo(() =>
        <MessageList messages={_chat.live ? _chat.live.Chat[0].messages : []} users={users ? users : undefined} />
        , [_chat.live, users]);

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
                {messageListEl}
                <StackDivider borderColor="gray.500" borderTopWidth={1} />
                <VStack width="100%" align="start">
                    <Box fontSize="80%" minHeight="3ex" color="gray.500">
                        {typersCount > 1 ? (
                            <Text as="span">
                                {typersStr.substr(2)} are typing...
                            </Text>
                        ) : typersCount > 0 ? (
                            <Text as="span">
                                {typersStr.substr(2)} is typing...
                            </Text>
                        ) : undefined}
                    </Box>
                    <HStack width="100%" align="end" spacing={"0.4rem"}>
                        <Textarea
                            placeholder="Type a message [Enter to send, Shift+Enter for newline]"
                            height="100%"
                            width="100%"
                            resize="none"
                            value={newMessageText}
                            // onFocus={() => newMessageTextChanged(true)}
                            // onBlur={() => newMessageTextChanged(false)}
                            onChange={(ev) =>
                                newMessageTextChanged(true, ev.target.value)
                            }
                            onKeyDown={(ev) => {
                                if (ev.key === "Enter" && !ev.shiftKey) {
                                    _chat.sendMessage(newMessageText);
                                    // TODO: Only reset if no error
                                    setNewMessageText("");
                                }
                            }}
                            disabled={!!_chat.sendMessageError || _chat.sendingMessage}
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
            </VStack>
        );
    } else {
        return <Spinner />;
    }
}
