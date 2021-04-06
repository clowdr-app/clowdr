import { Box, BoxProps, Button, Center, Flex, Heading, Spinner, useColorModeValue } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { MessageState } from "../ChatGlobalState";
import { Observable } from "../ChatGlobalState";
import { useChatConfiguration } from "../Configuration";
import MessageBox from "./MessageBox";

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

    const config = useChatConfiguration();
    const chatId = config.state.Id;
    const pageSize = config.messageBatchSize ?? 30;

    useEffect(() => {
        config.state.subscribe();

        return () => {
            config.state.unsubscribe();
        };
    }, [config.state]);

    const fetchMore = useCallback(() => {
        config.state.loadMoreMessages(pageSize);
    }, [config.state, pageSize]);

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
    const [_lastRenderTime, setLastRenderTime] = useState<number>(-1);
    const messageElements = React.useRef<JSX.Element[] | null>(null);
    const positionObservables = React.useRef<Map<number, Observable<number>>>(new Map());

    const config = useChatConfiguration();

    useEffect(() => {
        setHasReachedEnd(false);
        messageElements.current = null;
        setLastRenderTime(-1);
    }, [chatId]);

    const scrollbarColour = useColorModeValue("gray.500", "gray.200");
    const scrollbarBackground = useColorModeValue("gray.200", "gray.500");

    const ref = React.useRef<HTMLDivElement | null>(null);
    const shouldAutoScroll = React.useRef<boolean>(true);

    const initMessages = useCallback(
        (messages: MessageState[]) => {
            setHasReachedEnd(false);
            positionObservables.current = new Map();
            messageElements.current = [];
            messages.forEach((msg) => {
                const obs = new Observable<number>((observer) => {
                    const idx = messageElements.current?.findIndex((el) => (el.key as string) === msg.id.toString());
                    if (idx !== undefined && idx !== -1) {
                        observer(idx);
                    }
                });
                positionObservables.current.set(msg.id, obs);
                messageElements.current?.push(<MessageBox key={msg.id} message={msg} positionObservable={obs} />);
            });

            if (messageElements.current.length > 0) {
                const latest = messageElements.current[0].props.message as MessageState;
                config.state.setAllMessagesRead(latest.id);
            }

            setLastRenderTime(Date.now());
        },
        [config.state]
    );
    const insertMessages = useCallback(
        (messages: MessageState[], areNew: boolean) => {
            const newMessageElements: JSX.Element[] = [];
            messages.forEach((msg) => {
                const obs = new Observable<number>((observer) => {
                    const idx = messageElements.current?.findIndex((el) => (el.key as string) === msg.id.toString());
                    if (idx !== undefined && idx !== -1) {
                        observer(idx);
                    }
                });
                positionObservables.current.set(msg.id, obs);
                newMessageElements.push(<MessageBox key={msg.id} message={msg} positionObservable={obs} />);
            });

            if (messageElements.current) {
                if (areNew) {
                    messageElements.current = [...newMessageElements, ...messageElements.current];
                } else {
                    messageElements.current = [...messageElements.current, ...newMessageElements];
                }
            } else {
                messageElements.current = newMessageElements;
            }
            positionObservables.current.forEach((observable, k) => {
                const kStr = k.toString();
                const idx = messageElements.current?.findIndex((el) => el.key === kStr);
                if (idx !== undefined && idx !== -1) {
                    observable.publish(idx);
                }
            });

            if (shouldAutoScroll.current) {
                setTimeout(() => {
                    ref.current?.scroll({
                        behavior: "auto",
                        top: 0,
                    });
                }, 50);

                if (messageElements.current && messageElements.current.length > 0) {
                    const latest = messageElements.current[0].props.message as MessageState;
                    config.state.setAllMessagesRead(latest.id);
                }
            }

            setLastRenderTime(Date.now());
        },
        [config.state]
    );

    const deleteMessages = useCallback((messageIds: number[]) => {
        if (messageElements.current) {
            const ids = messageIds.map((id) => id.toString());
            messageElements.current = messageElements.current.filter((el) => !ids.includes(el.key as string));
            setLastRenderTime(Date.now());
        }
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

                    if (shouldAutoScroll.current && messageElements.current && messageElements.current.length > 0) {
                        const latest = messageElements.current[0].props.message as MessageState;
                        config.state.setAllMessagesRead(latest.id);
                    }
                }}
            >
                <Box m={0} p={0} h="1px" w="100%"></Box>
            </Observer>
        );
    }, [config.state]);

    return (
        <Box {...rest}>
            {messageElements.current === null ? (
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
                        {messageElements.current}
                        {topEl}
                        {/* <Box hidden={true}>{lastRenderTime}</Box> */}
                    </Flex>
                </Flex>
            )}
        </Box>
    );
}
