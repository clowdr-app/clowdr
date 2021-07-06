import { gql } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, AlertTitle, HStack, Spinner } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useGetRoomChatIdQuery } from "../../../../generated/graphql";
import { Chat } from "../../../Chat/Chat";
import type { ChatState } from "../../../Chat/ChatGlobalState";
import { useGlobalChatState } from "../../../Chat/GlobalChatStateProvider";

gql`
    query GetRoomChatId($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            chatId
            name
        }
    }
`;

export function RoomChatPanel({
    roomId,
    onChatIdLoaded,
    setUnread,
}: {
    roomId: string;
    onChatIdLoaded: (chatId: string) => void;
    setUnread: (v: string) => void;
}): JSX.Element {
    const { loading, error, data } = useGetRoomChatIdQuery({
        variables: {
            roomId,
        },
    });

    const globalChatState = useGlobalChatState();
    const [chat, setChat] = useState<ChatState | null | undefined>();
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (!loading) {
            if (data?.room_Room_by_pk?.chatId) {
                unsubscribe = globalChatState.observeChatId(data?.room_Room_by_pk?.chatId, setChat);
            } else {
                setChat(null);
            }
        }
        return () => {
            unsubscribe?.();
        };
    }, [data?.room_Room_by_pk?.chatId, globalChatState, loading]);

    useEffect(() => {
        if (chat?.Id) {
            onChatIdLoaded(chat.Id);
        }
    }, [onChatIdLoaded, chat?.Id]);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (chat) {
            unsubscribe = chat.UnreadCount.subscribe(setUnread);
        }
        return () => {
            unsubscribe?.();
        };
    }, [chat, setUnread]);

    const isVisible = React.useRef<boolean>(true);

    if (loading || chat === undefined) {
        return <Spinner label="Loading room chat" />;
    }

    if (error) {
        return (
            <Alert
                status="error"
                variant="top-accent"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                textAlign="left"
            >
                <HStack my={2}>
                    <AlertIcon />
                    <AlertTitle>Error loading room chat</AlertTitle>
                </HStack>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    if (chat === null) {
        return (
            <Alert
                status="info"
                variant="top-accent"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="flex-start"
                textAlign="left"
            >
                <HStack my={2}>
                    <AlertIcon />
                    <AlertTitle>This room does not have a chat.</AlertTitle>
                </HStack>
            </Alert>
        );
    }

    return <Chat chat={chat} isVisible={isVisible} />;
}
