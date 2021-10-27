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
import type { ContinuationsEditor_ContinuationFragment } from "../../../../generated/graphql";
import {
    useContinuationsEditor_DeleteMutation,
    useContinuationsEditor_SelectContinuationsQuery,
    useContinuationsEditor_UpdateManyMutation,
    useContinuationsEditor_UpdateMutation,
} from "../../../../generated/graphql";
import { useRestorableState } from "../../../Generic/useRestorableState";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useShieldedHeaders } from "../../../GQL/useShieldedHeaders";
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

    const context = useShieldedHeaders({
        "X-Auth-Role": "organizer",
    });
    const [response] = useContinuationsEditor_SelectContinuationsQuery({
        variables: {
            fromId: eventId ?? shufflePeriodId,
        },
        context,
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

    const [updateManyResponse, updateMany] = useContinuationsEditor_UpdateManyMutation();
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
                {response.fetching && !response.data ? (
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
                                                updateMany(
                                                    {
                                                        ids: continuations.map((x) => x.id),
                                                        object: {
                                                            isActiveChoice: true,
                                                        },
                                                    },
                                                    {
                                                        fetchOptions: {
                                                            headers: {
                                                                "X-Auth-Role": "organizer",
                                                            },
                                                        },
                                                    }
                                                );
                                            } else {
                                                updateMany(
                                                    {
                                                        ids: continuations.map((x) => x.id),
                                                        object: {
                                                            isActiveChoice: false,
                                                        },
                                                    },
                                                    {
                                                        fetchOptions: {
                                                            headers: {
                                                                "X-Auth-Role": "organizer",
                                                            },
                                                        },
                                                    }
                                                );
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
}: {
    option: ContinuationsEditor_ContinuationFragment;
    previousOption?: ContinuationsEditor_ContinuationFragment;
    nextOption?: ContinuationsEditor_ContinuationFragment;
    idx: number;
    fromId: string;
}): JSX.Element {
    const [updateResponse, update] = useContinuationsEditor_UpdateMutation();
    useQueryErrorToast(updateResponse.error, false, "Update continuation");

    const [deleteResponse, deleteOp] = useContinuationsEditor_DeleteMutation();
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
                            update(
                                {
                                    id: option.id,
                                    object: {
                                        priority: idx - 1,
                                    },
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            "X-Auth-Role": "organizer",
                                        },
                                    },
                                }
                            );

                            update(
                                {
                                    id: previousOption?.id,
                                    object: {
                                        priority: idx,
                                    },
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            "X-Auth-Role": "organizer",
                                        },
                                    },
                                }
                            );
                        }}
                    >
                        <FAIcon iconStyle="s" icon="arrow-alt-circle-up" />
                    </Button>
                    <Button
                        size="xs"
                        isDisabled={!nextOption}
                        onClick={() => {
                            update(
                                {
                                    id: option.id,
                                    object: {
                                        priority: idx + 1,
                                    },
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            "X-Auth-Role": "organizer",
                                        },
                                    },
                                }
                            );

                            update(
                                {
                                    id: nextOption?.id,
                                    object: {
                                        priority: idx,
                                    },
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            "X-Auth-Role": "organizer",
                                        },
                                    },
                                }
                            );
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
                                    update(
                                        {
                                            id: option.id,
                                            object: {
                                                colour: cStr,
                                            },
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    "X-Auth-Role": "organizer",
                                                },
                                            },
                                        }
                                    );
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
                    isDisabled={deleteResponse.fetching}
                    onClick={async () => {
                        try {
                            deleteOp(
                                {
                                    ids: [option.id],
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            "X-Auth-Role": "organizer",
                                        },
                                    },
                                }
                            );
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
