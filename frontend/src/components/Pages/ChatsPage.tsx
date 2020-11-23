import { HStack, StackDivider } from "@chakra-ui/react";
import React, { useMemo } from "react";
import ManageIsTyping from "../../hooks/Chats/ManageIsTyping";
import ManageChat from "../../hooks/Chats/ManageChat";
import useUserId from "../../hooks/useUserId";
import ChatFrame from "../ChatFrame/ChatFrame";
import ChatsList from "../ChatsList/ChatsList";
import UsersList from "../UsersList/UsersList";

function ChatFrameWrapper(props: { chatId: string }): JSX.Element {
    return (
        <ManageIsTyping>
            <ManageChat chatId={props.chatId}>
                <ChatFrame />
            </ManageChat>
        </ManageIsTyping>
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
        );
    }
}
