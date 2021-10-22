import {
    Box,
    Button,
    ButtonGroup,
    chakra,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    ListItem,
    OrderedList,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Spinner,
    Switch,
    Text,
    UnorderedList,
    useColorMode,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import { SketchPicker } from "react-color";
import Color from "tinycolor2";
import type {
    ContinuationsEditor_ContinuationFragment,
    ContinuationsEditor_SelectContinuationsQuery,
    ContinuationsEditor_SelectContinuationsQueryVariables,
} from "../../../../generated/graphql";
import {
    ContinuationsEditor_ContinuationFragmentDoc,
    ContinuationsEditor_SelectContinuationsDocument,
    useContinuationsEditor_DeleteMutation,
    useContinuationsEditor_SelectContinuationsQuery,
    useContinuationsEditor_UpdateManyMutation,
    useContinuationsEditor_UpdateMutation,
} from "../../../../generated/graphql";
import { useRestorableState } from "../../../Generic/useRestorableState";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import CreateContinuationModal from "./CreateContinuationModal";

gql`
    fragment ContinuationsEditor_Continuation on schedule_Continuation {
        id
        fromEvent
        fromShuffleQueue
        to
        defaultFor
        isActiveChoice
        priority
        colour
        description
    }

    query ContinuationsEditor_SelectContinuations($fromId: uuid!) {
        schedule_Continuation(
            where: { _or: [{ fromEvent: { _eq: $fromId } }, { fromShuffleQueue: { _eq: $fromId } }] }
        ) {
            ...ContinuationsEditor_Continuation
        }
    }

    mutation ContinuationsEditor_Insert($object: schedule_Continuation_insert_input!) {
        insert_schedule_Continuation_one(object: $object) {
            ...ContinuationsEditor_Continuation
        }
    }

    mutation ContinuationsEditor_Update($id: uuid!, $object: schedule_Continuation_set_input!) {
        update_schedule_Continuation_by_pk(pk_columns: { id: $id }, _set: $object) {
            ...ContinuationsEditor_Continuation
        }
    }

    mutation ContinuationsEditor_UpdateMany($ids: [uuid!]!, $object: schedule_Continuation_set_input!) {
        update_schedule_Continuation(where: { id: { _in: $ids } }, _set: $object) {
            returning {
                ...ContinuationsEditor_Continuation
            }
        }
    }

    mutation ContinuationsEditor_Delete($ids: [uuid!]!) {
        delete_schedule_Continuation(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }
`;

export default function ContinuationsEditor({
    from,
    itemId,
}: {
    from: { eventId: string } | { shufflePeriodId: string };
    itemId?: string;
}): JSX.Element {
    const eventId = "eventId" in from ? from.eventId : undefined;
    const shufflePeriodId = "shufflePeriodId" in from ? from.shufflePeriodId : undefined;
    const fromNoun = "eventId" in from ? "an event" : "a shuffle period";

    const response = useContinuationsEditor_SelectContinuationsQuery({
        variables: {
            fromId: eventId ?? shufflePeriodId,
        },
    });

    const [showExplanation, setShowExplanation] = useRestorableState<boolean>(
        `ContinuationsEditor_${eventId ? "events" : "shufflePeriods"}`,
        true,
        (x) => (x ? "true" : "false"),
        (x) => x === "true"
    );

    const continuations = useMemo(
        () =>
            response.data ? R.sort((x, y) => x.priority - y.priority, response.data.schedule_Continuation) : undefined,
        [response.data]
    );
    const isActiveChoice = useMemo(
        () =>
            continuations !== undefined ? continuations.reduce((acc, x) => acc || x.isActiveChoice, false) : undefined,
        [continuations]
    );

    const [updateMany, updateManyResponse] = useContinuationsEditor_UpdateManyMutation({
        update: (cache, response) => {
            if (response.data?.update_schedule_Continuation) {
                const datas = response.data?.update_schedule_Continuation.returning;
                for (const data of datas) {
                    cache.writeFragment({
                        data,
                        fragment: ContinuationsEditor_ContinuationFragmentDoc,
                        fragmentName: "ContinuationsEditor_Continuation",
                    });
                }

                const fromId = eventId ?? shufflePeriodId;
                const query = cache.readQuery<
                    ContinuationsEditor_SelectContinuationsQuery,
                    ContinuationsEditor_SelectContinuationsQueryVariables
                >({
                    query: ContinuationsEditor_SelectContinuationsDocument,
                    variables: {
                        fromId,
                    },
                });
                if (query) {
                    cache.writeQuery<
                        ContinuationsEditor_SelectContinuationsQuery,
                        ContinuationsEditor_SelectContinuationsQueryVariables
                    >({
                        query: ContinuationsEditor_SelectContinuationsDocument,
                        data: {
                            ...query.schedule_Continuation,
                            schedule_Continuation: query.schedule_Continuation.map(
                                (x) => datas.find((y) => x.id === y.id) ?? x
                            ),
                        },
                        variables: {
                            fromId,
                        },
                    });
                }
            }
        },
    });
    useQueryErrorToast(updateManyResponse.error, false, "Update many continuations");

    return (
        <>
            <VStack alignItems="left" w="100%">
                <Text fontWeight="semibold">
                    Continuations give people a choice of where to go when {fromNoun} ends.
                </Text>
                {showExplanation ? (
                    <>
                        <Text>
                            Continuations are shown to people as a list of options. If a default continuation is
                            specified, it is pre-selected for the specified people. People can select any continuation
                            to follow, or no continuation at all (i.e. stay where they are).
                        </Text>
                        <Text>
                            The choice of continuation can be made either:
                            <UnorderedList>
                                <ListItem> Active - people are required to make a choice, or</ListItem>
                                <ListItem>Passive - people see a popup asking for an optional choice</ListItem>
                            </UnorderedList>
                            <chakra.span fontStyle="italic">Active</chakra.span> is useful at the end of a session to
                            move people into socials. In contrast, <chakra.span fontStyle="italic">Passive</chakra.span>{" "}
                            is useful during a session, to give people an opportunity to continue a conversation about a
                            paper in a discussion room with the authors.
                        </Text>
                        {shufflePeriodId ? (
                            <Text>
                                Shuffle continuations are applied when the whole shuffle period has ended. If no
                                continuations are provided, participants are directed back to the shuffle networking
                                page.
                            </Text>
                        ) : undefined}
                    </>
                ) : undefined}
                <Button
                    size="xs"
                    onClick={() => {
                        setShowExplanation(!showExplanation);
                    }}
                >
                    <FAIcon iconStyle="s" icon={showExplanation ? "arrow-up" : "info"} mr={2} />
                    {showExplanation ? "Hide explanation" : "Show explanation"}
                </Button>
                {response.loading && !response.data ? (
                    <Box>
                        <Spinner label="Loading continuations" />
                        Loading continuations
                    </Box>
                ) : undefined}
                {continuations ? (
                    <>
                        <OrderedList pl={4} spacing={2}>
                            {continuations.map((option, idx) => (
                                <ContinuationOption
                                    key={option.id}
                                    option={option}
                                    previousOption={idx > 0 ? continuations[idx - 1] : undefined}
                                    nextOption={idx < continuations.length - 1 ? continuations[idx + 1] : undefined}
                                    idx={idx}
                                    fromId={eventId ?? shufflePeriodId ?? ""}
                                />
                            ))}
                        </OrderedList>
                        <HStack>
                            <CreateContinuationModal
                                from={from}
                                defaultPriority={
                                    continuations.length > 0 ? continuations[continuations.length - 1].priority + 1 : 0
                                }
                                forceActiveChoice={continuations.length > 0 ? isActiveChoice : undefined}
                                eventItemId={itemId}
                            />
                            <FormControl display="flex" flexDir="row">
                                <FormLabel ml="auto">Choice type:</FormLabel>
                                <HStack fontSize="sm" mb={2}>
                                    <chakra.span>Passive</chakra.span>
                                    <Switch
                                        isDisabled={continuations.length === 0}
                                        isChecked={isActiveChoice}
                                        onChange={(ev) => {
                                            if (ev.target.checked) {
                                                updateMany({
                                                    variables: {
                                                        ids: continuations.map((x) => x.id),
                                                        object: {
                                                            isActiveChoice: true,
                                                        },
                                                    },
                                                });
                                            } else {
                                                updateMany({
                                                    variables: {
                                                        ids: continuations.map((x) => x.id),
                                                        object: {
                                                            isActiveChoice: false,
                                                        },
                                                    },
                                                });
                                            }
                                        }}
                                    />
                                    <chakra.span>Active</chakra.span>
                                </HStack>
                            </FormControl>
                        </HStack>
                    </>
                ) : undefined}
            </VStack>
        </>
    );
}

function ContinuationOption({
    option,
    previousOption,
    nextOption,
    idx,
    fromId,
}: {
    option: ContinuationsEditor_ContinuationFragment;
    previousOption?: ContinuationsEditor_ContinuationFragment;
    nextOption?: ContinuationsEditor_ContinuationFragment;
    idx: number;
    fromId: string;
}): JSX.Element {
    const [update, updateResponse] = useContinuationsEditor_UpdateMutation({
        update: (cache, response) => {
            if (response.data?.update_schedule_Continuation_by_pk) {
                const data = response.data?.update_schedule_Continuation_by_pk;
                cache.writeFragment({
                    data,
                    fragment: ContinuationsEditor_ContinuationFragmentDoc,
                    fragmentName: "ContinuationsEditor_Continuation",
                });

                const query = cache.readQuery<
                    ContinuationsEditor_SelectContinuationsQuery,
                    ContinuationsEditor_SelectContinuationsQueryVariables
                >({
                    query: ContinuationsEditor_SelectContinuationsDocument,
                    variables: {
                        fromId,
                    },
                });
                if (query) {
                    cache.writeQuery<
                        ContinuationsEditor_SelectContinuationsQuery,
                        ContinuationsEditor_SelectContinuationsQueryVariables
                    >({
                        query: ContinuationsEditor_SelectContinuationsDocument,
                        data: {
                            ...query,
                            schedule_Continuation: query.schedule_Continuation.map((x) =>
                                x.id === data.id ? data : x
                            ),
                        },
                        variables: {
                            fromId,
                        },
                    });
                }
            }
        },
    });
    useQueryErrorToast(updateResponse.error, false, "Update continuation");

    const [deleteOp, deleteResponse] = useContinuationsEditor_DeleteMutation({
        update: (cache, response) => {
            if (response.data?.delete_schedule_Continuation) {
                const data = response.data.delete_schedule_Continuation;
                const deletedIds = data.returning.map((x) => x.id);
                deletedIds.forEach((x) => {
                    cache.evict({
                        id: x.id,
                        fieldName: "ContinuationsEditor_Continuation",
                        broadcast: true,
                    });

                    cache.evict({
                        id: x.id,
                        fieldName: "schedule_Continuation",
                        broadcast: true,
                    });
                });

                const query = cache.readQuery<
                    ContinuationsEditor_SelectContinuationsQuery,
                    ContinuationsEditor_SelectContinuationsQueryVariables
                >({
                    query: ContinuationsEditor_SelectContinuationsDocument,
                    variables: {
                        fromId,
                    },
                });
                if (query) {
                    cache.writeQuery<
                        ContinuationsEditor_SelectContinuationsQuery,
                        ContinuationsEditor_SelectContinuationsQueryVariables
                    >({
                        query: ContinuationsEditor_SelectContinuationsDocument,
                        data: {
                            ...query,
                            schedule_Continuation: query.schedule_Continuation.filter(
                                (x) => !deletedIds.includes(x.id)
                            ),
                        },
                        variables: {
                            fromId,
                        },
                    });
                }
            }
        },
    });
    useQueryErrorToast(deleteResponse.error, false, "Delete continuation");

    const toast = useToast();
    const { colorMode } = useColorMode();

    const [localColour, setLocalColour] = useState<string>(option.colour);
    useEffect(() => {
        setLocalColour(option.colour);
    }, [option.colour]);

    const optionTypeStr = useMemo(() => option.to.type.replace(/([A-Z])/g, " $1").trim(), [option.to.type]);

    const colourObj = Color(option.colour);
    return (
        <ListItem key={option.id} w="100%" my={1}>
            <Flex w="100%">
                <ButtonGroup mr={2}>
                    <Button
                        size="xs"
                        isDisabled={!previousOption}
                        onClick={() => {
                            update({
                                variables: {
                                    id: option.id,
                                    object: {
                                        priority: idx - 1,
                                    },
                                },
                            });

                            update({
                                variables: {
                                    id: previousOption?.id,
                                    object: {
                                        priority: idx,
                                    },
                                },
                            });
                        }}
                    >
                        <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                    </Button>
                    <Button
                        size="xs"
                        isDisabled={!nextOption}
                        onClick={() => {
                            update({
                                variables: {
                                    id: option.id,
                                    object: {
                                        priority: idx + 1,
                                    },
                                },
                            });

                            update({
                                variables: {
                                    id: nextOption?.id,
                                    object: {
                                        priority: idx,
                                    },
                                },
                            });
                        }}
                    >
                        <FAIcon iconStyle="s" icon="arrow-alt-circle-down" />
                    </Button>
                </ButtonGroup>
                <VStack flex="1 1 100%" alignItems="flex-start" spacing={0} fontSize="sm">
                    <chakra.span whiteSpace="normal">{option.description}</chakra.span>
                    <chakra.span fontSize="xs">
                        {optionTypeStr}
                        {option.defaultFor !== "None" ? ` (default for ${option.defaultFor.toLowerCase()})` : ""}
                    </chakra.span>
                </VStack>
                <Popover placement="bottom-start" returnFocusOnClose={false} isLazy>
                    <PopoverTrigger>
                        <Button
                            minW={0}
                            color={
                                colourObj.isDark() && !(colorMode === "light" && option.colour === "rgba(0,0,0,0)")
                                    ? "white"
                                    : "black"
                            }
                            bgColor={option.colour}
                            aria-label="Edit colour"
                            size="xs"
                            ml="auto"
                        >
                            <FAIcon iconStyle="s" icon="palette" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <Box color="black">
                            <SketchPicker
                                width="100%"
                                color={localColour}
                                onChange={(c) => {
                                    setLocalColour(`rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},1)`);
                                }}
                                onChangeComplete={(c) => {
                                    const cStr = `rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},1)`;
                                    setLocalColour(cStr);
                                    update({
                                        variables: {
                                            id: option.id,
                                            object: {
                                                colour: cStr,
                                            },
                                        },
                                    });
                                }}
                            />
                        </Box>
                    </PopoverContent>
                </Popover>
                <Button
                    ml={2}
                    aria-label="Delete"
                    colorScheme="red"
                    size="xs"
                    isDisabled={deleteResponse.loading}
                    onClick={async () => {
                        try {
                            deleteOp({
                                variables: {
                                    ids: [option.id],
                                },
                            });
                        } catch (e) {
                            toast({
                                title: "Error deleting continuation",
                                description: e.message ?? e.toString(),
                                isClosable: true,
                                position: "bottom",
                                status: "error",
                            });
                        }
                    }}
                >
                    <FAIcon iconStyle="s" icon="trash-alt" />
                </Button>
            </Flex>
        </ListItem>
    );
}
