import { gql } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, HStack, Spinner, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useGetItemChatIdQuery } from "../../../../../generated/graphql";
import { Chat } from "../../../../Chat/Chat";
import type { ChatState } from "../../../../Chat/ChatGlobalState";
import { useGlobalChatState } from "../../../../Chat/GlobalChatStateProvider";
import FAIcon from "../../../../Icons/FAIcon";

gql`
    query GetItemChatId($itemOrExhibitionId: uuid!) {
        content_Item(
            where: {
                _or: [
                    { id: { _eq: $itemOrExhibitionId } }
                    { descriptionOfExhibitions: { id: { _eq: $itemOrExhibitionId } } }
                ]
            }
        ) {
            id
            title
            chatId
        }
    }
`;

export function ItemChatPanel({
    itemOrExhibitionId,
    confSlug,
    onChatIdLoaded,
    setUnread,
    setPageChatAvailable,
    isVisible,
}: {
    itemOrExhibitionId: string;
    confSlug: string;
    onChatIdLoaded: (chatId: string) => void;
    setUnread: (v: string) => void;
    setPageChatAvailable: (isAvailable: boolean) => void;
    isVisible: boolean;
}): JSX.Element {
    const { loading, error, data } = useGetItemChatIdQuery({
        variables: {
            itemOrExhibitionId,
        },
    });
    const chatId = useMemo(() => data?.content_Item.find((x) => x?.chatId)?.chatId, [data?.content_Item]);

    const globalChatState = useGlobalChatState();
    const [chat, setChat] = useState<ChatState | null | undefined>();
    useEffect(() => {
        let unsubscribe: undefined | (() => void);
        if (chatId) {
            unsubscribe = globalChatState.observeChatId(chatId, setChat);
        } else {
            setChat(null);
        }
        return () => {
            unsubscribe?.();
        };
    }, [chatId, globalChatState]);

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

    const isVisibleRef = React.useRef<boolean>(false);
    useEffect(() => {
        const _isVisible = isVisible;
        isVisibleRef.current = _isVisible;
        if (_isVisible) {
            chat?.fixUnreadCountToZero();
        }
        return () => {
            if (_isVisible) {
                chat?.unfixUnreadCountToZero();
            }
        };
    }, [chat, isVisible]);

    const history = useHistory();

    useEffect(() => {
        setPageChatAvailable(!error && chat !== null);
    }, [chat, chatId, error, setPageChatAvailable]);

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
                    <Tooltip key="room-button" label="Go to video room">
                        <Button
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
            isVisible={isVisibleRef}
        />
    );
}
