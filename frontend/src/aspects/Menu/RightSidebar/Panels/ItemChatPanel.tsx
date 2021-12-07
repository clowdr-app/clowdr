import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, HStack, Spinner, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { gql } from "urql";
import { useGetConferenceLandingPageItemIdQuery, useGetItemChatIdQuery } from "../../../../generated/graphql";
import { Chat } from "../../../Chat/Chat";
import type { ChatState } from "../../../Chat/ChatGlobalState";
import { useGlobalChatState } from "../../../Chat/GlobalChatStateProvider";
import { useConference } from "../../../Conference/useConference";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import FAIcon from "../../../Icons/FAIcon";

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

    query GetConferenceLandingPageItemId($conferenceId: uuid!) {
        content_Item(where: { typeName: { _eq: LANDING_PAGE }, conferenceId: { _eq: $conferenceId } }, limit: 1) {
            id
            typeName
            conferenceId
        }
    }
`;

export function ItemChatPanel({
    itemOrExhibitionId,
    ...props
}: {
    itemOrExhibitionId: string;
    onChatIdLoaded: (chatId: string) => void;
    setUnread?: (v: string) => void;
    setPageChatAvailable?: (isAvailable: boolean) => void;
    isVisible: boolean;
}): JSX.Element {
    if (itemOrExhibitionId === "LANDING_PAGE") {
        return <LandingPageChatPanel {...props} />;
    } else {
        return <ItemChatPanelInner itemOrExhibitionId={itemOrExhibitionId} {...props} />;
    }
}

function LandingPageChatPanel({
    setPageChatAvailable,
    ...props
}: {
    onChatIdLoaded: (chatId: string) => void;
    setUnread?: (v: string) => void;
    setPageChatAvailable?: (isAvailable: boolean) => void;
    isVisible: boolean;
}) {
    const conference = useConference();
    const [response] = useGetConferenceLandingPageItemIdQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    useEffect(() => {
        if (!response.fetching && !response.data?.content_Item?.length) {
            setPageChatAvailable?.(false);
        }
    }, [response.data?.content_Item?.length, response.fetching, setPageChatAvailable]);

    if (response.data?.content_Item?.length) {
        return (
            <ItemChatPanelInner
                itemOrExhibitionId={response.data.content_Item[0].id}
                setPageChatAvailable={setPageChatAvailable}
                {...props}
            />
        );
    } else {
        return <></>;
    }
}

function ItemChatPanelInner({
    itemOrExhibitionId,
    onChatIdLoaded,
    setUnread,
    setPageChatAvailable,
    isVisible,
}: {
    itemOrExhibitionId: string;
    onChatIdLoaded: (chatId: string) => void;
    setUnread?: (v: string) => void;
    setPageChatAvailable?: (isAvailable: boolean) => void;
    isVisible: boolean;
}): JSX.Element {
    const [{ fetching: loading, error, data }] = useGetItemChatIdQuery({
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
        if (chat && setUnread) {
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
    const { conferencePath } = useAuthParameters();

    useEffect(() => {
        setPageChatAvailable?.(!error && chat !== null);
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
                            colorScheme="PrimaryActionButton"
                            onClick={() => history.push(`${conferencePath}/room/${chat.RoomId}`)}
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
