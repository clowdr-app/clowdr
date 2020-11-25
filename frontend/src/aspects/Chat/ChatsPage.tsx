import { HStack, StackDivider } from "@chakra-ui/react";
import React, { useMemo } from "react";
import useUserId from "../Auth/useUserId";
import UsersList from "../Users/AllUsers/UsersList";
import UsersProvider from "../Users/AllUsers/UsersProvider";
import ChatsList from "./AllChats/ChatsList";
import ChatsProvider from "./AllChats/ChatsProvider";
import ChatFrame from "./SingleChat/ChatFrame";

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
                            <ChatFrame chatId={props.chatId} />
                        ) : undefined}
                    </HStack>
                </ChatsProvider>
            </UsersProvider>
        );
    }
}
