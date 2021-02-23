import { Box, BoxProps, Button, Center, Flex, Heading, Spinner, useColorModeValue } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { MessageState } from "../ChatGlobalState";
import { useChatConfiguration } from "../Configuration";
import MessageBox from "./MessageBox";
import { useReceiveMessageQueries } from "./ReceiveMessageQueries";

interface MessageListProps {
    chatId: string;
    isLoading: boolean;
    fetchMore: () => void;
    initMessagesRef: React.MutableRefObject<((messages: MessageState[]) => void) | null>;
    insertMessagesRef: React.MutableRefObject<((messages: MessageState[], areNew: boolean) => void) | null>;
    deleteMessagesRef: React.MutableRefObject<((messageIds: number[]) => void) | null>;
    setHasReachedEndRef: React.MutableRefObject<((value: boolean) => void) | null>;
}

export function ChatMessageList(props: BoxProps): JSX.Element {
    const initMessages = React.useRef<((messages: MessageState[]) => void) | null>(null);
    const insertMessages = React.useRef<((messages: MessageState[], areNew: boolean) => void) | null>(null);
    const deleteMessages = React.useRef<((messageIds: number[]) => void) | null>(null);
    const setHasReachedEnd = React.useRef<((value: boolean) => void) | null>(null);

    // const [selectMessagesPage, selectMessagesPageResponse] = useSelectMessagesPageLazyQuery();
    // const [selectFirstMessagesPage, selectFirstMessagesPageResponse] = useSelectFirstMessagesPageLazyQuery();

    const config = useChatConfiguration();
    const chatId = config.state.Id;
    const pageSize = config.messageBatchSize ?? 30;

    // const nextMessageSub = useNewMessagesSubscription({
    //     variables: {
    //         chatId,
    //     },
    // });

    const fetchMore = useCallback(() => {
        config.state.loadMoreMessages(pageSize);
    }, [config.state, pageSize]);

    // useEffect(() => {
    //     if (selectMessagesPageResponse.data) {
    //         prevLastMessageId.current = lastMessageId.current;
    //         lastMessageId.current = Math.min(
    //             lastMessageId.current,
    //             selectMessagesPageResponse.data.chat_Message[selectMessagesPageResponse.data.chat_Message.length - 1]
    //                 ?.id ?? -1
    //         );
    //         if (prevLastMessageId.current === lastMessageId.current && setHasReachedEnd.current) {
    //             setHasReachedEnd.current(true);
    //         }
    //         insertMessages.current?.([...selectMessagesPageResponse.data.chat_Message], !requestedNextPage.current);
    //         requestedNextPage.current = false;
    //     }
    // }, [selectMessagesPageResponse.data]);

    // useEffect(() => {
    //     if (selectFirstMessagesPageResponse.data) {
    //         prevLastMessageId.current = lastMessageId.current;
    //         lastMessageId.current = Math.min(
    //             lastMessageId.current,
    //             selectFirstMessagesPageResponse.data.chat_Message[
    //                 selectFirstMessagesPageResponse.data.chat_Message.length - 1
    //             ]?.id ?? -1
    //         );
    //         insertMessages.current?.(
    //             [...selectFirstMessagesPageResponse.data.chat_Message],
    //             !requestedFirstPage.current
    //         );
    //         requestedFirstPage.current = false;

    //         if (selectFirstMessagesPageResponse.data.chat_Message.length < batchSize && setHasReachedEnd.current) {
    //             setHasReachedEnd.current(true);
    //         }
    //     }
    // }, [batchSize, selectFirstMessagesPageResponse.data]);

    // useEffect(() => {
    //     if (nextMessageSub.data) {
    //         insertMessages.current?.(
    //             nextMessageSub.data.chat_Message.map((msg) => ({
    //                 ...msg,
    //                 reactions: [],
    //             })),
    //             true
    //         );
    //     }
    // }, [nextMessageSub.data]);

    const receiveMessageQueries = useReceiveMessageQueries();
    useEffect(() => {
        deleteMessages.current?.([...receiveMessageQueries.deletedItems.values()]);
    }, [receiveMessageQueries.deletedItems]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    useEffect(() => {
        return config.state.IsLoadingMessages.subscribe(setIsLoading);
    }, [config.state.IsLoadingMessages]);
    useEffect(() => {
        return config.state.MightHaveMoreMessages.subscribe((v) => {
            setHasReachedEnd.current?.(!v);
        });
    }, [config.state.MightHaveMoreMessages]);
    useEffect(() => {
        return config.state.Messages.subscribe((update) => {
            switch (update.op) {
                case "initial":
                    initMessages.current?.(update.messages);
                    break;
                case "loaded_historic":
                    insertMessages.current?.(update.messages, false);
                    break;
                case "loaded_new":
                    insertMessages.current?.(update.messages, true);
                    break;
                case "deleted":
                    deleteMessages.current?.(update.messageIds);
                    break;
            }
        });
    }, [config.state.Messages]);

    return (
        <MessageList
            chatId={chatId}
            initMessagesRef={initMessages}
            insertMessagesRef={insertMessages}
            deleteMessagesRef={deleteMessages}
            setHasReachedEndRef={setHasReachedEnd}
            isLoading={isLoading}
            fetchMore={fetchMore}
            {...props}
        />
    );
}

const reactionsBoundary = 5;

function MessageList({
    chatId,
    isLoading,
    initMessagesRef,
    insertMessagesRef,
    deleteMessagesRef,
    setHasReachedEndRef,
    fetchMore,
    ...rest
}: MessageListProps & BoxProps): JSX.Element {
    const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
    const [messageElements, setMessageElements] = useState<JSX.Element[] | null>(null);

    useEffect(() => {
        setHasReachedEnd(false);
        setMessageElements(null);
    }, [chatId]);

    const scrollbarColour = useColorModeValue("gray.500", "gray.200");
    const scrollbarBackground = useColorModeValue("gray.200", "gray.500");

    const ref = React.useRef<HTMLDivElement | null>(null);
    const shouldAutoScroll = React.useRef<boolean>(true);

    const initMessages = useCallback((messages: MessageState[]) => {
        setHasReachedEnd(false);
        setMessageElements(
            messages.map((msg, idx) => (
                <MessageBox key={msg.id} message={msg} subscribeToReactions={idx < reactionsBoundary} />
            ))
        );
    }, []);
    const insertMessages = useCallback((messages: MessageState[], areNew: boolean) => {
        setMessageElements((oldEls) => {
            // Yes, double equals not triple - React does something weird to the keys which changes their type
            const nonDuplicates = messages.filter((msg) => !oldEls?.some((el) => el.key == msg.id));
            // Yes, double equals not triple - React does something weird to the keys which changes their type
            const duplicates = messages.filter((msg) => !nonDuplicates?.some((msg2) => msg2.id == msg.id));
            const newMessageElements = nonDuplicates
                .sort((x, y) => y.Id - x.Id)
                .map((msg, idx) => (
                    <MessageBox
                        key={msg.id}
                        message={msg}
                        subscribeToReactions={(areNew || !oldEls) && idx < reactionsBoundary}
                    />
                ));
            let output;
            if (oldEls) {
                if (areNew) {
                    output = [
                        ...newMessageElements,
                        ...oldEls.map((el, idx) => {
                            // Yes, double equals not triple - React does something weird to the keys which changes their type
                            const newMsgIdx = duplicates.findIndex((x) => x.id == el.key);

                            if (newMsgIdx !== -1) {
                                const newMsg = duplicates[newMsgIdx];
                                duplicates.splice(newMsgIdx, 1);
                                return (
                                    <MessageBox
                                        key={el.key}
                                        message={newMsg}
                                        subscribeToReactions={idx + newMessageElements.length < reactionsBoundary}
                                    />
                                );
                            } else if (
                                idx < reactionsBoundary &&
                                idx + newMessageElements.length >= reactionsBoundary
                            ) {
                                return (
                                    <MessageBox key={el.key} message={el.props.message} subscribeToReactions={false} />
                                );
                            } else {
                                return el;
                            }
                        }),
                    ];
                } else {
                    output = [
                        ...oldEls.map((el, idx) => {
                            // Yes, double equals not triple - React does something weird to the keys which changes their type
                            const newMsgIdx = duplicates.findIndex((x) => x.id == el.key);

                            if (newMsgIdx !== -1) {
                                const newMsg = duplicates[newMsgIdx];
                                duplicates.splice(newMsgIdx, 1);
                                return (
                                    <MessageBox
                                        key={el.key}
                                        message={newMsg}
                                        subscribeToReactions={idx < reactionsBoundary}
                                    />
                                );
                            } else {
                                return el;
                            }
                        }),
                        ...newMessageElements,
                    ];
                }
            } else {
                output = newMessageElements.map((el, idx) => {
                    // Yes, double equals not triple - React does something weird to the keys which changes their type
                    const newMsgIdx = duplicates.findIndex((x) => x.id == el.key);

                    if (newMsgIdx !== -1) {
                        const newMsg = duplicates[newMsgIdx];
                        duplicates.splice(newMsgIdx, 1);
                        return (
                            <MessageBox key={el.key} message={newMsg} subscribeToReactions={idx < reactionsBoundary} />
                        );
                    } else {
                        return el;
                    }
                });
            }

            if (shouldAutoScroll.current) {
                ref.current?.scroll({
                    behavior: "smooth",
                    top: 0,
                });
            }

            return output;
        });
    }, []);

    const deleteMessages = useCallback((messageIds: number[]) => {
        setMessageElements((oldEls) => {
            if (oldEls) {
                const ids = messageIds.map((x) => x.toString());
                return oldEls.filter((el) => !ids.includes(el.key as string));
            }
            return null;
        });
    }, []);

    initMessagesRef.current = initMessages;
    insertMessagesRef.current = insertMessages;
    deleteMessagesRef.current = deleteMessages;
    setHasReachedEndRef.current = setHasReachedEnd;

    const topEl = useMemo(() => {
        return isLoading ? (
            <Center py={5} mb={1}>
                <Spinner message="Loading messages" />
            </Center>
        ) : hasReachedEnd ? (
            <Heading
                py={5}
                mb={1}
                as="h4"
                fontSize="0.8em"
                fontStyle="italic"
                borderBottomWidth={1}
                borderBottomStyle="solid"
                borderBottomColor="gray.400"
            >
                (No more messages)
            </Heading>
        ) : (
            <Observer
                onChange={(props) => {
                    if (props.intersectionRatio > 0) {
                        fetchMore();
                    }
                }}
            >
                <Center
                    py={5}
                    mb={1}
                    h="auto"
                    fontStyle="italic"
                    borderBottomWidth={1}
                    borderBottomStyle="solid"
                    borderBottomColor="gray.400"
                >
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                            fetchMore();
                        }}
                        fontSize="90%"
                        h="auto"
                        p={2}
                        lineHeight="130%"
                    >
                        Infinite scroller not working?
                        <br />
                        Click to load more messages.
                    </Button>
                </Center>
            </Observer>
        );
    }, [fetchMore, hasReachedEnd, isLoading]);

    const bottomEl = useMemo(() => {
        return (
            <Observer
                onChange={(ev) => {
                    shouldAutoScroll.current = ev.intersectionRatio > 0;
                }}
            >
                <Box m={0} p={0} h={0} w="100%"></Box>
            </Observer>
        );
    }, []);

    // CHAT_TODO
    // const readUpTo = useReadUpToIndex();
    // useEffect(() => {
    //     if (messageElements && messageElements.length > 0) {
    //         const latestId = messageElements[0].props.message.id;
    //         if (readUpTo.readUpToId === undefined || readUpTo.readUpToId < latestId) {
    //             readUpTo.setReadUpTo(latestId);
    //         }
    //     }
    // }, [messageElements, readUpTo]);

    return (
        <Box {...rest}>
            {messageElements === null ? (
                <Center h="100%">
                    <Box>
                        <Spinner aria-label="Loading messages" />
                    </Box>
                </Center>
            ) : (
                <Flex w="100%" h="100%" overflowX="hidden" overflowY="auto" flexDir="column" justifyContent="flex-end">
                    <Flex
                        role="list"
                        w="100%"
                        h="auto"
                        overflowX="hidden"
                        overflowY="scroll"
                        flexDir="column-reverse"
                        minH="100%"
                        css={{
                            ["scrollbarWidth"]: "thin",
                            ["scrollbarColor"]: `${scrollbarColour} ${scrollbarBackground}`,
                        }}
                        ref={ref}
                    >
                        {bottomEl}
                        {messageElements}
                        {topEl}
                    </Flex>
                </Flex>
            )}
        </Box>
    );
}
