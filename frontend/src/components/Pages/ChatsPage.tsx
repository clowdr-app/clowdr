import { HStack, StackDivider } from "@chakra-ui/react";
import React, { useMemo } from "react";
import ChatProvider from "../../hooks/Chats/ChatProvider";
import ChatsProvider from "../../hooks/Chats/ChatsProvider";
import IsTypingProvider from "../../hooks/Chats/IsTypingProvider";
import UsersProvider from "../../hooks/Users/UsersProvider";
import useUserId from "../../hooks/useUserId";
import ChatFrame from "../ChatFrame/ChatFrame";
import ChatsList from "../ChatsList/ChatsList";
import UsersList from "../UsersList/UsersList";

function ChatFrameWrapper(props: { chatId: string }): JSX.Element {
    return (
        <IsTypingProvider>
            <ChatProvider chatId={props.chatId}>
                <ChatFrame />
            </ChatProvider>
        </IsTypingProvider>
    );
}

export default function ChatsPage(props: { chatId?: string }): JSX.Element {
    const userId = useUserId();
    const usersListEl = useMemo(() => <UsersList />, []);
    const chatsListEl = useMemo(() => <ChatsList />, []);

    if (!userId) {
        return <>Please log in to view this page.</>;
    } else {
        return (
            <UsersProvider>
                <ChatsProvider>
                    <HStack
                        divider={<StackDivider borderColor="gray.500" />}
                        width="100%"
                        height="100%"
                        align="start"
                        spacing={["0em", "1em"]}
                        overflow="auto"
                    >
                        {usersListEl}
                        {chatsListEl}
                        {props.chatId ? (
                            <ChatFrameWrapper chatId={props.chatId} />
                        ) : undefined}
                    </HStack>
                </ChatsProvider>
            </UsersProvider>
        );
    }
}
