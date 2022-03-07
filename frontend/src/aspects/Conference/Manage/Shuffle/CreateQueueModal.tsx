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
    Tooltip,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useState } from "react";
import { Room_ShuffleAlgorithm_Enum, useInsertShufflePeriodMutation } from "../../../../generated/graphql";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import { roundUpToNearest } from "../../../Utils/MathUtils";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";

gql`
    mutation InsertShufflePeriod($object: room_ShufflePeriod_insert_input!) {
        insert_room_ShufflePeriod_one(object: $object) {
            id
            created_at
            updated_at
            conferenceId
            startAt
            endAt
            roomDurationMinutes
            targetRegistrantsPerRoom
            maxRegistrantsPerRoom
            waitRoomMaxDurationSeconds
            name
            organiserId
            algorithm
        }
    }
`;

export default function CreateQueueModal(): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const conference = useConference();
    const registrant = useCurrentRegistrant();

    const [insertResponse, insert] = useInsertShufflePeriodMutation();

    const [name, setName] = useState<string>("");
    const [algorithm, setAlgorithm] = useState<Room_ShuffleAlgorithm_Enum>(Room_ShuffleAlgorithm_Enum.Fcfs);
    const [startAt, setStartAt] = useState<Date>(new Date(roundUpToNearest(Date.now(), 5 * 60 * 1000)));
    const [endAt, setEndAt] = useState<Date>(new Date(startAt.getTime() + 30 * 60 * 1000));
    const [roomDurationMinutes, setRoomDurationMinutes] = useState<number>(6);
    const [targetRegistrants, setTargetRegistrants] = useState<number>(3);
    const [maxRegistrants, setMaxRegistrants] = useState<number>(5);
    const [maxWait, setMaxWait] = useState<number>(90);

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
            if (v && v.getTime() >= startAt.getTime() + 5 * 60 * 1000) {
                setEndAt(v);
            }
        },
        [startAt]
    );
    const onDurationChange = useCallback((_valStr: string, valueAsNumber: number) => {
        const v = Math.round(valueAsNumber);
        if (v >= 2 && v <= 2 * 60) {
            setRoomDurationMinutes(v);
        }
    }, []);
    const onTargetRegistrantsChange = useCallback(
        (_valStr: string, valueAsNumber: number) => {
            const v = Math.round(valueAsNumber);
            if (v >= 2) {
                setTargetRegistrants(v);
                if (maxRegistrants < v) {
                    setMaxRegistrants(v + 1);
                }
            }
        },
        [maxRegistrants]
    );
    const onMaxRegistrantsChange = useCallback(
        (_valStr: string, valueAsNumber: number) => {
            const v = Math.round(valueAsNumber);
            if (v >= targetRegistrants) {
                setMaxRegistrants(v);
            }
        },
        [targetRegistrants]
    );
    const onMaxWaitChange = useCallback((_valStr: string, valueAsNumber: number) => {
        const v = Math.round(valueAsNumber);
        if (v >= 60 && v <= 300) {
            setMaxWait(v);
        }
    }, []);

    const reset = useCallback(() => {
        setName("");
        setAlgorithm(Room_ShuffleAlgorithm_Enum.Fcfs);
        const startAt = new Date(roundUpToNearest(Date.now(), 5 * 60 * 1000));
        setStartAt(startAt);
        setEndAt(new Date(startAt.getTime() + 30 * 60 * 1000));
        setRoomDurationMinutes(6);
        setTargetRegistrants(3);
        setMaxRegistrants(5);
        setMaxWait(90);
    }, []);

    const toast = useToast();
    const onCreate = useCallback(async () => {
        try {
            await insert(
                {
                    object: {
                        name,
                        algorithm,
                        conferenceId: conference.id,
                        endAt: endAt.toISOString(),
                        maxRegistrantsPerRoom: maxRegistrants,
                        roomDurationMinutes,
                        startAt: startAt.toISOString(),
                        targetRegistrantsPerRoom: targetRegistrants,
                        waitRoomMaxDurationSeconds: maxWait,
                        organiserId: registrant.id,
                    },
                },
                {
                    fetchOptions: {
                        headers: {
                            [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                        },
                    },
                }
            );

            reset();
            onClose();
        } catch (e: any) {
            toast({
                description: e.message ?? e.toString(),
                duration: 12000,
                isClosable: true,
                position: "bottom",
                status: "error",
                title: "Error! Could not create queue",
            });
        }
    }, [
        algorithm,
        registrant.id,
        conference.id,
        endAt,
        insert,
        maxRegistrants,
        maxWait,
        name,
        onClose,
        reset,
        roomDurationMinutes,
        startAt,
        targetRegistrants,
        toast,
    ]);

    return (
        <>
            <Button colorScheme="purple" mb={2} onClick={onOpen}>
                New queue
            </Button>
            <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="outside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create shuffle queue</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Name</FormLabel>
                                <Input
                                    isDisabled={insertResponse.fetching}
                                    min={1}
                                    value={name}
                                    onChange={(ev) => setName(ev.target.value)}
                                />
                                <FormHelperText>
                                    Name of the queue, shown to registrants. For example, a topic or theme.
                                </FormHelperText>
                            </FormControl>
                            {/* <FormControl>
                                <FormLabel>Automation</FormLabel>
                                <Select
                                    isDisabled={insertResponse.fetching}
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
                            </FormControl> */}
                            <FormControl>
                                <FormLabel>Start at</FormLabel>
                                <DateTimePicker
                                    isDisabled={insertResponse.fetching}
                                    value={startAt}
                                    onChange={onStartAtChange}
                                />
                                <FormHelperText>
                                    Start time of the queue. Registrants can join the queue up to 5 mins in advance but
                                    automatic allocation only starts at this time.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>End at</FormLabel>
                                <DateTimePicker
                                    isDisabled={insertResponse.fetching}
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
                                    isDisabled={insertResponse.fetching}
                                    min={2}
                                    max={2 * 60}
                                    value={roomDurationMinutes}
                                    onChange={onDurationChange}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper aria-label="Increment" />
                                        <NumberDecrementStepper aria-label="Decrement" />
                                    </NumberInputStepper>
                                </NumberInput>
                                <FormHelperText>
                                    Each room generated by the queue runs for exactly this duration. When time runs out,
                                    registrants are returned to the waiting page where they can choose to rejoin the
                                    queue for a new room.
                                </FormHelperText>
                            </FormControl>
                            {algorithm === Room_ShuffleAlgorithm_Enum.Fcfs ||
                            algorithm === Room_ShuffleAlgorithm_Enum.FcfsFixedRooms ? (
                                <>
                                    <FormControl>
                                        <FormLabel>Target registrants per room</FormLabel>
                                        <NumberInput
                                            isDisabled={insertResponse.fetching}
                                            min={2}
                                            value={targetRegistrants}
                                            onChange={onTargetRegistrantsChange}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper aria-label="Increment" />
                                                <NumberDecrementStepper aria-label="Decrement" />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <FormHelperText>
                                            The target number of registrants per room, typically 3 to 5 works well.
                                        </FormHelperText>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Maximum registrants per room</FormLabel>
                                        <NumberInput
                                            isDisabled={insertResponse.fetching}
                                            min={2}
                                            value={maxRegistrants}
                                            onChange={onMaxRegistrantsChange}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper aria-label="Increment" />
                                                <NumberDecrementStepper aria-label="Decrement" />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <FormHelperText>
                                            The maximum number of registrants per room, typically up to 8 works well.
                                        </FormHelperText>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Maximum wait time in seconds</FormLabel>
                                        <NumberInput
                                            isDisabled={insertResponse.fetching}
                                            min={60}
                                            max={300}
                                            value={maxWait}
                                            onChange={onMaxWaitChange}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper aria-label="Increment" />
                                                <NumberDecrementStepper aria-label="Decrement" />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        <FormHelperText>
                                            When existing rooms reach their Target number of registrants, new queuers
                                            wait for others to form a new room. This field defines the maximum wait
                                            time. If someone waits longer than this, the algorithm attempts to find an
                                            existing room with less than the maximum number of registrants.
                                        </FormHelperText>
                                    </FormControl>
                                </>
                            ) : undefined}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <ButtonGroup>
                            <Button isDisabled={insertResponse.fetching} onClick={onClose}>
                                Cancel
                            </Button>
                            <Tooltip label={name.length === 0 ? "Name is required" : undefined}>
                                <Box>
                                    <Button
                                        isLoading={insertResponse.fetching}
                                        isDisabled={insertResponse.fetching || name.length === 0}
                                        onClick={onCreate}
                                        colorScheme="purple"
                                    >
                                        Create
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
