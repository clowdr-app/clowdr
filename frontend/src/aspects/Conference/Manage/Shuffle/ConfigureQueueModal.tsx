import { gql } from "@apollo/client";
import {
    Box,
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    Tooltip,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import {
    ManageShufflePeriods_SelectAllDocument,
    ManageShufflePeriods_SelectAllQuery,
    ManageShufflePeriods_SelectAllQueryVariables,
    ManageShufflePeriods_ShufflePeriodFragment,
    ManageShufflePeriods_ShufflePeriodFragmentDoc,
    Room_ShuffleAlgorithm_Enum,
    useUpdateShufflePeriodMutation,
} from "../../../../generated/graphql";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";

gql`
    mutation UpdateShufflePeriod($id: uuid!, $object: room_ShufflePeriod_set_input!) {
        update_room_ShufflePeriod_by_pk(pk_columns: { id: $id }, _set: $object) {
            id
            created_at
            updated_at
            conferenceId
            startAt
            endAt
            roomDurationMinutes
            targetAttendeesPerRoom
            maxAttendeesPerRoom
            waitRoomMaxDurationSeconds
            name
            organiserId
            algorithm
        }
    }
`;

export default function ConfigureQueueModal({
    initialQueue,
}: {
    initialQueue: ManageShufflePeriods_ShufflePeriodFragment;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const conference = useConference();

    const [update, updateResponse] = useUpdateShufflePeriodMutation({
        update: (cache, result) => {
            if (result.data?.update_room_ShufflePeriod_by_pk) {
                const data = result.data.update_room_ShufflePeriod_by_pk;
                const existingData = cache.readFragment<ManageShufflePeriods_ShufflePeriodFragment>({
                    fragment: ManageShufflePeriods_ShufflePeriodFragmentDoc,
                    fragmentName: "ManageShufflePeriods_ShufflePeriod",
                    id: cache.identify({
                        __typename: "room_ShufflePeriod",
                        id: data.id,
                    }),
                });
                const newData: ManageShufflePeriods_ShufflePeriodFragment = {
                    ...existingData,
                    ...data,
                    __typename: "room_ShufflePeriod",
                    completedEntries: existingData?.completedEntries ?? {
                        aggregate: {
                            count: 0,
                        },
                    },
                    ongoingEntries: existingData?.ongoingEntries ?? {
                        aggregate: {
                            count: 0,
                        },
                    },
                    waitingEntries: existingData?.waitingEntries ?? {
                        aggregate: {
                            count: 0,
                        },
                    },
                };
                cache.writeFragment<ManageShufflePeriods_ShufflePeriodFragment>({
                    data: newData,
                    fragment: ManageShufflePeriods_ShufflePeriodFragmentDoc,
                    fragmentName: "ManageShufflePeriods_ShufflePeriod",
                    broadcast: true,
                });

                const q = cache.readQuery<
                    ManageShufflePeriods_SelectAllQuery,
                    ManageShufflePeriods_SelectAllQueryVariables
                >({
                    query: ManageShufflePeriods_SelectAllDocument,
                    variables: {
                        conferenceId: conference.id,
                    },
                });

                if (q) {
                    cache.writeQuery<ManageShufflePeriods_SelectAllQuery, ManageShufflePeriods_SelectAllQueryVariables>(
                        {
                            query: ManageShufflePeriods_SelectAllDocument,
                            data: {
                                ...q,
                                room_ShufflePeriod: [
                                    ...q.room_ShufflePeriod.filter((x) => x.id !== newData.id),
                                    newData,
                                ],
                            },
                            variables: {
                                conferenceId: conference.id,
                            },
                        }
                    );
                }
            }
        },
    });

    const [name, setName] = useState<string>(initialQueue.name);
    const [algorithm, setAlgorithm] = useState<Room_ShuffleAlgorithm_Enum>(initialQueue.algorithm);
    const [startAt, setStartAt] = useState<Date>(new Date(initialQueue.startAt));
    const [endAt, setEndAt] = useState<Date>(new Date(initialQueue.endAt));
    const [roomDurationMinutes, setRoomDurationMinutes] = useState<number>(initialQueue.roomDurationMinutes);
    const [targetAttendees, setTargetAttendees] = useState<number>(initialQueue.targetAttendeesPerRoom);
    const [maxAttendees, setMaxAttendees] = useState<number>(initialQueue.maxAttendeesPerRoom);
    const [maxWait, setMaxWait] = useState<number>(initialQueue.waitRoomMaxDurationSeconds);

    const onStartAtChange = useCallback(
        (v: Date | undefined) => {
            if (v) {
                setStartAt(v);
                if (v.getTime() > endAt.getTime() - 5 * 60 * 1000) {
                    setEndAt(new Date(v.getTime() + 5 * 60 * 1000));
                }
            }
        },
        [endAt]
    );
    const onEndAtChange = useCallback(
        (v: Date | undefined) => {
            const now = Date.now();
            const initialEndAt = Date.parse(initialQueue.endAt);
            if (now + 3 * 60 * 1000 <= initialEndAt || now - 1 * 60 * 1000 >= initialEndAt) {
                if (v && v.getTime() >= startAt.getTime() + 5 * 60 * 1000) {
                    setEndAt(v);
                }
            }
        },
        [initialQueue.endAt, startAt]
    );
    const onDurationChange = useCallback((_valStr: string, valueAsNumber: number) => {
        const v = Math.round(valueAsNumber);
        if (v >= 2 && v <= 2 * 60) {
            setRoomDurationMinutes(v);
        }
    }, []);
    const onTargetAttendeesChange = useCallback(
        (_valStr: string, valueAsNumber: number) => {
            const v = Math.round(valueAsNumber);
            if (v >= 2) {
                setTargetAttendees(v);
                if (maxAttendees < v) {
                    setMaxAttendees(v + 1);
                }
            }
        },
        [maxAttendees]
    );
    const onMaxAttendeesChange = useCallback(
        (_valStr: string, valueAsNumber: number) => {
            const v = Math.round(valueAsNumber);
            if (v >= targetAttendees) {
                setMaxAttendees(v);
            }
        },
        [targetAttendees]
    );
    const onMaxWaitChange = useCallback((_valStr: string, valueAsNumber: number) => {
        const v = Math.round(valueAsNumber);
        if (v >= 60 && v <= 300) {
            setMaxWait(v);
        }
    }, []);

    const toast = useToast();
    const onUpdate = useCallback(async () => {
        try {
            await update({
                variables: {
                    id: initialQueue.id,
                    object: {
                        name,
                        algorithm,
                        endAt: endAt.toISOString(),
                        maxAttendeesPerRoom: maxAttendees,
                        roomDurationMinutes,
                        startAt: startAt.toISOString(),
                        targetAttendeesPerRoom: targetAttendees,
                        waitRoomMaxDurationSeconds: maxWait,
                    },
                },
            });

            onClose();
        } catch (e) {
            toast({
                description: e.message ?? e.toString(),
                duration: 12000,
                isClosable: true,
                position: "bottom",
                status: "error",
                title: "Error! Could not update queue",
            });
        }
    }, [
        update,
        initialQueue.id,
        name,
        algorithm,
        endAt,
        maxAttendees,
        roomDurationMinutes,
        startAt,
        targetAttendees,
        maxWait,
        onClose,
        toast,
    ]);

    return (
        <>
            <Tooltip label="Configure">
                <Button size="xs" aria-label="Configure" colorScheme="purple" onClick={onOpen}>
                    <FAIcon iconStyle="s" icon="cog" />
                </Button>
            </Tooltip>
            <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="outside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Update shuffle queue: {initialQueue.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Name</FormLabel>
                                <Input
                                    isDisabled={updateResponse.loading}
                                    min={1}
                                    value={name}
                                    onChange={(ev) => setName(ev.target.value)}
                                />
                                <FormHelperText>
                                    Name of the queue, shown to attendees. For example, a topic or theme.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Automation</FormLabel>
                                <Select
                                    isDisabled={updateResponse.loading}
                                    value={algorithm}
                                    onChange={(ev) =>
                                        setAlgorithm(ev.target.selectedOptions[0].value as Room_ShuffleAlgorithm_Enum)
                                    }
                                >
                                    <option value={Room_ShuffleAlgorithm_Enum.None}>None</option>
                                    <option value={Room_ShuffleAlgorithm_Enum.FcfsFixedRooms}>
                                        First-come, first-served, fixed rooms
                                    </option>
                                    <option value={Room_ShuffleAlgorithm_Enum.Fcfs}>
                                        First-come, first-served, auto-create rooms
                                    </option>
                                </Select>
                                <FormHelperText>
                                    Automation allocates people to rooms and creates new rooms when needed. You can also
                                    manually configure rooms and allocations and let the algorithm handle the rest, or
                                    have no automation and do it all yourself.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Start at</FormLabel>
                                <DateTimePicker
                                    isDisabled={updateResponse.loading}
                                    value={startAt}
                                    onChange={onStartAtChange}
                                />
                                <FormHelperText>
                                    Start time of the queue. Attendees can join the queue up to 5 mins in advance but
                                    automatic allocation only starts at this time.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>End at</FormLabel>
                                <DateTimePicker
                                    isDisabled={updateResponse.loading}
                                    value={endAt}
                                    onChange={onEndAtChange}
                                />
                                <FormHelperText>
                                    End time of the queue. New rooms won&apos;t be generated after this time but any
                                    ongoing rooms will run to completion.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Room duration in minutes</FormLabel>
                                <NumberInput
                                    isDisabled={updateResponse.loading}
                                    min={2}
                                    max={2 * 60}
                                    value={roomDurationMinutes}
                                    onChange={onDurationChange}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <FormHelperText>
                                    Each room generated by the queue runs for exactly this duration. When time runs out,
                                    attendees are returned to the waiting page where they can choose to rejoin the queue
                                    for a new room.
                                </FormHelperText>
                            </FormControl>
                            {algorithm === Room_ShuffleAlgorithm_Enum.Fcfs ||
                            algorithm === Room_ShuffleAlgorithm_Enum.FcfsFixedRooms ? (
                                <>
                                    <FormControl>
                                        <FormLabel>Target attendees per room</FormLabel>
                                        <NumberInput
                                            isDisabled={updateResponse.loading}
                                            min={2}
                                            value={targetAttendees}
                                            onChange={onTargetAttendeesChange}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <FormHelperText>
                                            The target number of attendees per room, typically 3 to 5 works well.
                                        </FormHelperText>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Maximum attendees per room</FormLabel>
                                        <NumberInput
                                            isDisabled={updateResponse.loading}
                                            min={2}
                                            value={maxAttendees}
                                            onChange={onMaxAttendeesChange}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <FormHelperText>
                                            The maximum number of attendees per room, typically up to 8 works well.
                                        </FormHelperText>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Maximum wait time in seconds</FormLabel>
                                        <NumberInput
                                            isDisabled={updateResponse.loading}
                                            min={60}
                                            max={300}
                                            value={maxWait}
                                            onChange={onMaxWaitChange}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <FormHelperText>
                                            When existing rooms reach their Target number of attendees, new queuers wait
                                            for others to form a new room. This field defines the maximum wait time. If
                                            someone waits longer than this, the algorithm attempts to find an existing
                                            room with less than the maximum number of attendees.
                                        </FormHelperText>
                                    </FormControl>
                                </>
                            ) : undefined}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <ButtonGroup>
                            <Button isDisabled={updateResponse.loading} onClick={onClose}>
                                Cancel
                            </Button>
                            <Tooltip label={name.length === 0 ? "Name is required" : undefined}>
                                <Box>
                                    <Button
                                        isLoading={updateResponse.loading}
                                        isDisabled={updateResponse.loading || name.length === 0}
                                        onClick={onUpdate}
                                        colorScheme="purple"
                                    >
                                        Update
                                    </Button>
                                </Box>
                            </Tooltip>
                        </ButtonGroup>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
