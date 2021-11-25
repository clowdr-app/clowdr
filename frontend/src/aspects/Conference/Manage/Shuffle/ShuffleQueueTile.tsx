import {
    Box,
    Button,
    ButtonGroup,
    Flex,
    Heading,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import { formatRelative } from "date-fns";
import React, { useEffect, useMemo } from "react";
import type { ManageShufflePeriods_ShufflePeriodFragment } from "../../../../generated/graphql";
import { useDeleteShufflePeriodMutation } from "../../../../generated/graphql";
import { FAIcon } from "../../../Icons/FAIcon";
import ContinuationsEditor from "../Schedule/ContinuationsEditor";
import ConfigureQueueModal from "./ConfigureQueueModal";

gql`
    mutation DeleteShufflePeriod($id: uuid!) {
        delete_room_ShufflePeriod_by_pk(id: $id) {
            id
        }
    }
`;

function ShuffleQueue_ContinuationsModal({ queueId }: { queueId: string }): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <Tooltip label="Edit continuations">
                <Button size="xs" aria-label="Edit continuations" colorScheme="cyan" onClick={onOpen}>
                    <FAIcon iconStyle="s" icon="running" />
                </Button>
            </Tooltip>
            <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Edit queue continuations</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {isOpen ? <ContinuationsEditor from={{ shufflePeriodId: queueId }} /> : undefined}
                    </ModalBody>
                    <ModalFooter></ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

export default function ShuffleQueueTile({
    queue,
    startLabel,
    endLabel,
}: {
    queue: ManageShufflePeriods_ShufflePeriodFragment;
    startLabel?: string;
    endLabel?: string;
}): JSX.Element {
    const [deletePeriodResponse, deletePeriod] = useDeleteShufflePeriodMutation();

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
                            <Button size="xs" aria-label="Info" colorScheme="pink">
                                <FAIcon iconStyle="s" icon="info" />
                            </Button>
                        </Tooltip>
                        <Tooltip label="Allocate rooms">
                            <Button size="xs" aria-label="Allocate rooms" colorScheme="cyan">
                                <FAIcon iconStyle="s" icon="users" />
                            </Button>
                        </Tooltip> */}
                        <ShuffleQueue_ContinuationsModal queueId={queue.id} />
                        <ConfigureQueueModal initialQueue={queue} />
                        <Tooltip label="Delete">
                            <Button
                                isLoading={deletePeriodResponse.fetching}
                                size="xs"
                                aria-label="Delete"
                                colorScheme="red"
                                onClick={() => {
                                    deletePeriod(
                                        {
                                            id: queue.id,
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                                },
                                            },
                                        }
                                    );
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
