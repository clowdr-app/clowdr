import { gql } from "@apollo/client";
import {
    Box,
    Button,
    ButtonGroup,
    Flex,
    Heading,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import React, { useEffect, useMemo } from "react";
import {
    ManageShufflePeriods_SelectAllDocument,
    ManageShufflePeriods_SelectAllQuery,
    ManageShufflePeriods_SelectAllQueryVariables,
    ManageShufflePeriods_ShufflePeriodFragment,
    useDeleteShufflePeriodMutation,
} from "../../../../generated/graphql";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import ConfigureQueueModal from "./ConfigureQueueModal";

gql`
    mutation DeleteShufflePeriod($id: uuid!) {
        delete_room_ShufflePeriod_by_pk(id: $id) {
            id
        }
    }
`;

export default function ShuffleQueueTile({
    queue,
    startLabel,
    endLabel,
}: {
    queue: ManageShufflePeriods_ShufflePeriodFragment;
    startLabel?: string;
    endLabel?: string;
}): JSX.Element {
    const conference = useConference();

    const [deletePeriod, deletePeriodResponse] = useDeleteShufflePeriodMutation({
        variables: {
            id: queue.id,
        },
        update: (cache, result) => {
            if (result.data?.delete_room_ShufflePeriod_by_pk?.id) {
                cache.evict({
                    id: cache.identify({
                        __typename: "room_ShufflePeriod",
                        id: result.data?.delete_room_ShufflePeriod_by_pk?.id,
                    }),
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
                                room_ShufflePeriod: q.room_ShufflePeriod.filter(
                                    (x) => x.id !== result.data?.delete_room_ShufflePeriod_by_pk?.id
                                ),
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

    const toast = useToast();
    useEffect(() => {
        if (deletePeriodResponse.error) {
            if (
                deletePeriodResponse.error.message.includes("Foreign key violation") &&
                deletePeriodResponse.error.message.includes("foreign key constraint") &&
                deletePeriodResponse.error.message.includes("ShuffleRoom_shufflePeriodId_fkey")
            ) {
                toast({
                    description: "Cannot delete a queue that has rooms.",
                    duration: 12000,
                    isClosable: true,
                    position: "bottom",
                    status: "error",
                    title: "Error! Could not delete queue",
                });
            } else {
                toast({
                    description: deletePeriodResponse.error.message,
                    duration: 12000,
                    isClosable: true,
                    position: "bottom",
                    status: "error",
                    title: "Error! Could not delete queue",
                });
            }
        }
    }, [deletePeriodResponse.error, toast]);

    const bgColor = useColorModeValue("gray.200", "gray.700");
    const startTimeStr = useMemo(() => formatRelative(new Date(queue.startAt), new Date()), [queue.startAt]);
    const endTimeStr = useMemo(() => formatRelative(new Date(queue.endAt), new Date()), [queue.endAt]);
    return (
        <Box m={4} h="auto" fontSize="sm" backgroundColor={bgColor} borderRadius="md">
            <VStack m={3}>
                <Flex w="100%">
                    <Heading mr="auto" as="h4" fontSize="md" mb={2} whiteSpace="normal" wordBreak="break-word">
                        {queue.name}
                    </Heading>
                    <ButtonGroup ml={2} isAttached variant="outline">
                        {/* <Tooltip label="Info">
                            <Button size="xs" aria-label="Info" colorScheme="blue">
                                <FAIcon iconStyle="s" icon="info" />
                            </Button>
                        </Tooltip>
                        <Tooltip label="Allocate rooms">
                            <Button size="xs" aria-label="Allocate rooms" colorScheme="cyan">
                                <FAIcon iconStyle="s" icon="users" />
                            </Button>
                        </Tooltip> */}
                        <ConfigureQueueModal initialQueue={queue} />
                        <Tooltip label="Delete">
                            <Button
                                isLoading={deletePeriodResponse.loading}
                                size="xs"
                                aria-label="Delete"
                                colorScheme="red"
                                onClick={() => {
                                    deletePeriod();
                                }}
                            >
                                <FAIcon iconStyle="s" icon="trash-alt" />
                            </Button>
                        </Tooltip>
                    </ButtonGroup>
                </Flex>
                {startLabel ? (
                    <Text textAlign="left" w="100%">
                        {startLabel} {startTimeStr}
                    </Text>
                ) : undefined}
                {endLabel ? (
                    <Text textAlign="left" w="100%">
                        {endLabel} {endTimeStr}
                    </Text>
                ) : undefined}
                <Table size="sm">
                    <Thead>
                        <Tr>
                            <Th>Waiting</Th>
                            <Th>Ongoing</Th>
                            <Th>Completed</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        <Tr>
                            <Td textAlign="center">{queue.waitingEntries.aggregate?.count ?? "Unknown"}</Td>
                            <Td textAlign="center">{queue.ongoingEntries.aggregate?.count ?? "Unknown"}</Td>
                            <Td textAlign="center">{queue.completedEntries.aggregate?.count ?? "Unknown"}</Td>
                        </Tr>
                    </Tbody>
                </Table>
            </VStack>
        </Box>
    );
}
