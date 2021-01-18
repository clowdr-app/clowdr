import { Box, Button, Center, Flex, FlexProps, Heading, Spinner, useColorModeValue, useToken } from "@chakra-ui/react";
import Observer from "@researchgate/react-intersection-observer";
import "intersection-observer"; // optional polyfill
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useReadUpToIndex } from "./ReadUpToIndexProvider";

interface LazyLoadingScrollerProps<T> {
    fixedBatchSize: number;
    load: (
        index: number | null,
        count: number
    ) => Promise<{ nextIndex: number | null; newItems: Map<number, T> } | false>;
    isEqual: (x: T, y: T) => boolean;
    renderItem: (item: T) => React.ReactNode;
    monitoredItems: Map<number, T> | null;
    deletedItems: Set<number> | null;
}

interface ReducerState<T> {
    stateName: "loading" | "idle" | "end-of-feed";
    loadOnIdle: boolean;
    nextIndex: number | null;
    items: Map<number, T> | null;
    lastError: string | null;
    renderedItems: Map<number, { sourceItem: T; node: React.ReactNode }>;
}

type ReducerActions<T> =
    | { name: "start-load" }
    | {
          name: "render-items";
          newItems: Map<number, T>;
          isEqual: (x: T, y: T) => boolean;
          renderItem: (item: T) => React.ReactNode;
          nextIndex: number | null;
      }
    | {
          name: "monitored-items";
          batchSize: number;
          items: Map<number, T>;
          isEqual: (x: T, y: T) => boolean;
          renderItem: (item: T) => React.ReactNode;
      }
    | {
          name: "deleted-items";
          items: Set<number>;
      }
    | { name: "error"; nextError: string };

function reduce<T>(oldState: ReducerState<T>, action: ReducerActions<T>) {
    const newState = { ...oldState, items: oldState.items ?? new Map() };

    if (action.name === "error") {
        newState.lastError = action.nextError;
    }

    if (newState.stateName === "idle" && action.name === "start-load") {
        newState.stateName = "loading";
        newState.lastError = null;
    } else if (action.name === "render-items") {
        if (action.newItems.size > 0) {
            newState.stateName = "idle";
            newState.lastError = null;
            newState.nextIndex = action.nextIndex;
            newState.renderedItems = new Map(newState.renderedItems ?? []);
            action.newItems.forEach((item, key) => {
                newState.items.set(key, item);

                let shouldRender = true;
                const existingItem = newState.renderedItems.get(key);
                if (existingItem) {
                    shouldRender = !action.isEqual(existingItem.sourceItem, item);
                }

                if (shouldRender) {
                    newState.renderedItems.set(key, {
                        sourceItem: item,
                        node: action.renderItem(item),
                    });
                }
            });
        } else {
            newState.stateName = "end-of-feed";
            newState.lastError = null;
            newState.nextIndex = action.nextIndex;
        }
    } else if (newState.stateName !== "idle" && action.name === "start-load") {
        newState.loadOnIdle = true;
    } else if (action.name === "monitored-items") {
        if (action.items.size > 0) {
            newState.renderedItems = new Map(newState.renderedItems ?? []);
            action.items.forEach((item, key) => {
                newState.items.set(key, item);

                let shouldRender = true;
                const existingItem = newState.renderedItems.get(key);
                if (existingItem) {
                    shouldRender = !action.isEqual(existingItem.sourceItem, item);
                }

                if (shouldRender) {
                    newState.renderedItems.set(key, {
                        sourceItem: item,
                        node: action.renderItem(item),
                    });
                }
            });
        }

        if (action.items.size < action.batchSize) {
            newState.stateName = "end-of-feed";
        }
    } else if (action.name === "deleted-items") {
        if (action.items.size > 0) {
            newState.renderedItems = new Map(newState.renderedItems ?? []);
            action.items.forEach((key) => {
                newState.items.delete(key);
                newState.renderedItems.delete(key);
            });
        }
    }

    if (newState.stateName === "idle" && newState.loadOnIdle) {
        newState.loadOnIdle = false;
        newState.stateName = "loading";
    }

    return newState;
}

function isInRange(offset: number, clientHeight: number): boolean {
    return Math.abs(offset) < 10 || Math.abs(offset - clientHeight) < 10;
}

export default function LazyLoadingScroller<T>({
    fixedBatchSize,
    load,
    isEqual,
    renderItem,
    monitoredItems,
    deletedItems,
    ...props
}: LazyLoadingScrollerProps<T> & FlexProps): JSX.Element {
    const [batchSize] = useState<number>(fixedBatchSize);
    const [state, act] = useReducer<React.Reducer<ReducerState<T>, ReducerActions<T>>>(reduce, {
        stateName: "loading",
        loadOnIdle: false,
        nextIndex: null,
        items: null,
        lastError: null,
        renderedItems: new Map(),
    });
    const runningStateRef = React.useRef<{
        isRunning: boolean;
    }>({
        isRunning: false,
    });

    const readUpToIndex = useReadUpToIndex();

    useEffect(() => {
        if (state.stateName === "loading" && !runningStateRef.current.isRunning) {
            runningStateRef.current.isRunning = true;

            (async () => {
                try {
                    const next = await load(state.nextIndex, batchSize);
                    if (next) {
                        const newItems = next.newItems;
                        const nextIndex = next.nextIndex;

                        if (
                            newItems.size === 0 ||
                            (nextIndex !== null &&
                                readUpToIndex.readUpToId !== undefined &&
                                nextIndex <= readUpToIndex.readUpToId)
                        ) {
                            readUpToIndex.readUpToMarkerSeen();
                        }

                        act({
                            name: "render-items",
                            isEqual,
                            newItems,
                            nextIndex,
                            renderItem,
                        });
                    }
                } catch (e) {
                    act({
                        name: "error",
                        nextError: e.message ?? e.toString(),
                    });
                } finally {
                    runningStateRef.current.isRunning = false;
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batchSize, isEqual, load, renderItem, state.nextIndex, state.stateName]);

    useEffect(() => {
        if (monitoredItems) {
            act({
                name: "monitored-items",
                isEqual,
                items: monitoredItems,
                renderItem,
                batchSize,
            });
        }
    }, [batchSize, isEqual, monitoredItems, renderItem]);

    useEffect(() => {
        if (deletedItems) {
            act({
                name: "deleted-items",
                items: deletedItems,
            });
        }
    }, [isEqual, deletedItems, renderItem]);

    const innerRef = React.useRef<HTMLDivElement | null>(null);
    const elements = useMemo(() => {
        if (innerRef.current) {
            const c = innerRef.current;
            if (Math.abs(c.scrollTop) < 130) {
                setTimeout(() => {
                    c.scroll({
                        behavior: "smooth",
                        top: 0,
                    });
                }, 100);
            }
        }

        return [...state.renderedItems.keys()]
            .sort((x, y) => y - x)
            .map((key) => {
                const renderedItem = state.renderedItems.get(key);
                if (renderedItem) {
                    return renderedItem.node;
                }
            });
    }, [state.renderedItems]);

    // TODO: Display error

    const [gray200, gray500] = useToken("colors", ["gray.200", "gray.500"]);
    const scrollbarColour = useColorModeValue(gray500, gray200);
    const scrollbarBackground = useColorModeValue(gray200, gray500);

    return state.items === null ? (
        <Center h="100%">
            <Box>
                <Spinner aria-label="Loading messages" />
            </Box>
        </Center>
    ) : (
        <Flex w="100%" h="100%" overflowX="hidden" overflowY="auto" flexDir="column" justifyContent="flex-end">
            <Flex
                role="list"
                {...props}
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
                ref={innerRef}
            >
                {elements}
                {state.stateName === "loading" ? (
                    <Center py={5} mb={1}>
                        <Spinner message="Loading messages" />
                    </Center>
                ) : state.stateName === "end-of-feed" ? (
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
                                act({
                                    name: "start-load",
                                });
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
                                    act({
                                        name: "start-load",
                                    });
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
                )}
            </Flex>
        </Flex>
    );
}
