import { gql } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, HStack, Spinner, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useGetItemChatIdQuery } from "../../../../../generated/graphql";
import { Chat } from "../../../../Chat/Chat";
import type { ChatState } from "../../../../Chat/ChatGlobalState";
import { useGlobalChatState } from "../../../../Chat/GlobalChatStateProvider";
import FAIcon from "../../../../Icons/FAIcon";

gql`
    query GetItemChatId($itemId: uuid!) {
        content_Item_by_pk(id: $itemId) {
            id
            title
            chatId
        }
    }
`;

export function ItemChatPanel({
    itemId,
    confSlug,
    onChatIdLoaded,
    setUnread,
}: {
    itemId: string;
    confSlug: string;
    onChatIdLoaded: (chatId: string) => void;
    setUnread: (v: string) => void;
}): JSX.Element {
    const { loading, error, data } = useGetItemChatIdQuery({
        variables: {
            itemId,
        },
    });

    const globalChatState = useGlobalChatState();
    const [chat, setChat] = useState<ChatState | null | undefined>();
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (!loading) {
            if (data?.content_Item_by_pk?.chatId) {
                unsubscribe = globalChatState.observeChatId(data.content_Item_by_pk.chatId, setChat);
            } else {
                setChat(null);
            }
        }
        return () => {
            unsubscribe?.();
        };
    }, [data?.content_Item_by_pk?.chatId, globalChatState, loading]);

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

    const history = useHistory();

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
                    <AlertTitle>Error loading item chat</AlertTitle>
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
                    <AlertTitle>This item does not have a chat.</AlertTitle>
                </HStack>
            </Alert>
        );
    }

    return (
        <Chat
            customHeadingElements={[
                chat.RoomId ? (
                    <Tooltip key="back-button" label="Go to video room">
                        <Button
                            key="room-button"
                            size="xs"
                            colorScheme="blue"
                            onClick={() => history.push(`/conference/${confSlug}/room/${chat.RoomId}`)}
                            aria-label="Go to video room for this chat"
                        >
                            <FAIcon iconStyle="s" icon="video" />
                        </Button>
                    </Tooltip>
                ) : undefined,
            ]}
            chat={chat}
        />
    );
}
