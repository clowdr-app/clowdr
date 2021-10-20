import type { BoxProps} from "@chakra-ui/react";
import { Box, Button, Center, Flex, Heading, useColorModeValue, useToken } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import assert from "assert";
import type { RefObject} from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CenteredSpinner from "../../Chakra/CenteredSpinner";
import { Observable } from "../../Observable";
import type { MessageState } from "../ChatGlobalState";
import { useChatConfiguration } from "../Configuration";
import MessageBox from "./MessageBox";

interface MessageListProps {
    chatId: string;
    isLoading: boolean;
    isVisible: RefObject<boolean>;
    fetchMore: () => void;
    initMessagesRef: React.MutableRefObject<((messages: MessageState[]) => void) | null>;
    insertMessagesRef: React.MutableRefObject<((messages: MessageState[], areNew: boolean) => void) | null>;
    deleteMessagesRef: React.MutableRefObject<((messageSIds: string[]) => void) | null>;
    setHasReachedEndRef: React.MutableRefObject<((value: boolean) => void) | null>;
}

export function ChatMessageList(props: { isVisible: RefObject<boolean> } & BoxProps): JSX.Element {
    const initMessages = React.useRef<((messages: MessageState[]) => void) | null>(null);
    const insertMessages = React.useRef<((messages: MessageState[], areNew: boolean) => void) | null>(null);
    const deleteMessages = React.useRef<((messageSIds: string[]) => void) | null>(null);
    const setHasReachedEnd = React.useRef<((value: boolean) => void) | null>(null);

    const config = useChatConfiguration();
    assert(config.state, "config.state is null. Chat state is not available in the current context.");

    const chatId = config.state.Id;
    const pageSize = config.messageBatchSize ?? 30;

    useEffect(() => {
        assert(config.state, "config.state is null. Chat state is not available in the current context.");
        config.state.connect();

        return () => {
            assert(config.state, "config.state is null. Chat state is not available in the current context.");
            config.state.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId]);

    const fetchMore = useCallback(() => {
        assert(config.state, "config.state is null. Chat state is not available in the current context.");
        config.state.loadMoreMessages(pageSize);
    }, [config.state, pageSize]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    useEffect(() => {
        assert(
            config.state?.IsLoadingMessages !== undefined,
            "config.state is null. Chat state is not available in the current context."
        );
        return config.state.IsLoadingMessages.subscribe(setIsLoading);
    }, [config.state.IsLoadingMessages]);
    useEffect(() => {
        assert(
            config.state?.MightHaveMoreMessages !== undefined,
            "config.state is null. Chat state is not available in the current context."
        );
        return config.state.MightHaveMoreMessages.subscribe((v) => {
            setHasReachedEnd.current?.(!v);
        });
    }, [config.state.MightHaveMoreMessages]);
    useEffect(() => {
        assert(
            config.state?.Messages !== undefined,
            "config.state is null. Chat state is not available in the current context."
        );
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
                    deleteMessages.current?.(update.messageSIds);
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
    isVisible,
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
    const positionObservables = React.useRef<Map<string, Observable<number>>>(new Map());

    const config = useChatConfiguration();

    useEffect(() => {
        setHasReachedEnd(false);
        messageElements.current = null;
        setLastRenderTime(-1);
    }, [chatId]);

    const scrollbarColour = useColorModeValue(
        "ChatMessageList.scrollbarHandleColor-light",
        "ChatMessageList.scrollbarHandleColor-dark"
    );
    const scrollbarBackground = useColorModeValue(
        "ChatMessageList.scrollbarBackgroundColor-light",
        "ChatMessageList.scrollbarBackgroundColor-dark"
    );
    const scrollbarColourT = useToken("colors", scrollbarColour);
    const scrollbarBackgroundT = useToken("colors", scrollbarBackground);

    const ref = React.useRef<HTMLDivElement | null>(null);
    const shouldAutoScroll = React.useRef<boolean>(true);

    const initMessages = useCallback(
        (messages: MessageState[]) => {
            assert(config.state, "config.state is null. Chat state is not available in the current context.");

            setHasReachedEnd(false);
            positionObservables.current = new Map();
            messageElements.current = [];
            messages.forEach((msg) => {
                const obs = new Observable<number>((observer) => {
                    const idx = messageElements.current?.findIndex((el) => (el.key as string) === msg.sId);
                    if (idx !== undefined && idx !== -1) {
                        observer(idx);
                    }
                });
                positionObservables.current.set(msg.sId, obs);
                messageElements.current?.push(<MessageBox key={msg.sId} message={msg} positionObservable={obs} />);
            });

            if (isVisible.current && messageElements.current.length > 0) {
                const latest = messageElements.current[0].props.message as MessageState;
                config.state.setAllMessagesRead(latest.sId);
            }

            setLastRenderTime(Date.now());
        },
        [config.state, isVisible]
    );
    const insertMessages = useCallback(
        (messages: MessageState[], areNew: boolean) => {
            assert(config.state, "config.state is null. Chat state is not available in the current context.");

            const newMessageElements: JSX.Element[] = [];
            messages.forEach((msg) => {
                const obs = new Observable<number>((observer) => {
                    const idx = messageElements.current?.findIndex((el) => (el.key as string) === msg.sId);
                    if (idx !== undefined && idx !== -1) {
                        observer(idx);
                    }
                });
                positionObservables.current.set(msg.sId, obs);
                newMessageElements.push(<MessageBox key={msg.sId} message={msg} positionObservable={obs} />);
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

                if (isVisible.current && messageElements.current && messageElements.current.length > 0) {
                    const latest = messageElements.current[0].props.message as MessageState;
                    config.state.setAllMessagesRead(latest.sId);
                }
            }

            setLastRenderTime(Date.now());
        },
        [config.state, isVisible]
    );

    const deleteMessages = useCallback((messageSIds: string[]) => {
        if (messageElements.current) {
            messageElements.current = messageElements.current.filter((el) => !messageSIds.includes(el.key as string));
            setLastRenderTime(Date.now());
        }
    }, []);

    initMessagesRef.current = initMessages;
    insertMessagesRef.current = insertMessages;
    deleteMessagesRef.current = deleteMessages;
    setHasReachedEndRef.current = setHasReachedEnd;

    const topEl = useMemo(() => {
        return isLoading ? (
            <CenteredSpinner centerProps={{ py: 5, mb: 1 }} spinnerProps={{ label: "Loading messages" }} />
        ) : hasReachedEnd ? (
            <Heading
                py={5}
                mb={1}
                as="h4"
                fontSize="0.8em"
                fontStyle="italic"
                borderBottomWidth={1}
                borderBottomStyle="solid"
                borderBottomColor="ChatMessageList.endReachedBorderColor"
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
                    borderBottomColor="ChatMessageList.endReachedBorderColor"
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
                    shouldAutoScroll.current = !!isVisible.current && ev.intersectionRatio > 0;

                    if (
                        isVisible.current &&
                        shouldAutoScroll.current &&
                        messageElements.current &&
                        messageElements.current.length > 0
                    ) {
                        const latest = messageElements.current[0].props.message as MessageState;
                        assert(
                            config.state,
                            "config.state is null. Chat state is not available in the current context."
                        );
                        config.state.setAllMessagesRead(latest.sId);
                    }
                }}
            >
                <Box m={0} p={0} h="1px" w="100%"></Box>
            </Observer>
        );
    }, [config.state, isVisible]);

    return (
        <Box {...rest}>
            {messageElements.current === null ? (
                <CenteredSpinner spinnerProps={{ label: "Loading messages" }} />
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
                            scrollbarWidth: "thin",
                            scrollbarColor: `${scrollbarColour} ${scrollbarBackground}`,
                            "&::-webkit-scrollbar": {
                                width: "6px",
                                height: "6px",
                            },
                            "&::-webkit-scrollbar-track": {
                                width: "8px",
                                height: "8px",
                                background: scrollbarBackgroundT,
                            },
                            "&::-webkit-scrollbar-thumb": {
                                background: scrollbarColourT,
                                borderRadius: "24px",
                            },
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
