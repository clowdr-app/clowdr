import { gql, Reference } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Code,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    FormLabel,
    Heading,
    Input,
    ListItem,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Text,
    UnorderedList,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Permission_Enum,
    RoomMode_Enum,
    RoomWithParticipantInfoFragment,
    RoomWithParticipantInfoFragmentDoc,
    useCreateRoomMutation,
    useDeleteRoomsMutation,
    useSelectAllRoomsWithParticipantsQuery,
    useUpdateRoomMutation,
} from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { NumberRangeColumnFilter, SelectColumnFilter, TextColumnFilter } from "../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import FAIcon from "../../Icons/FAIcon";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    fragment RoomParticipantWithAttendeeInfo on RoomParticipant {
        id
        conferenceId
        attendeeId
        roomId

        attendee {
            displayName
        }
    }

    fragment RoomWithParticipantInfo on Room {
        id
        conferenceId
        name
        currentModeName
        capacity
        priority
        participants {
            ...RoomParticipantWithAttendeeInfo
        }
        originatingData {
            ...OriginatingDataInfo
        }
    }

    query SelectAllRoomsWithParticipants($conferenceId: uuid!) {
        Room(where: { conferenceId: { _eq: $conferenceId } }) {
            ...RoomWithParticipantInfo
        }
    }

    mutation CreateRoom($room: Room_insert_input!) {
        insert_Room_one(object: $room) {
            ...RoomWithParticipantInfo
        }
    }

    mutation UpdateRoomsWithParticipants($id: uuid!, $name: String!, $capacity: Int!, $priority: Int!) {
        update_Room_by_pk(pk_columns: { id: $id }, _set: { name: $name, capacity: $capacity, priority: $priority }) {
            ...RoomWithParticipantInfo
        }
    }
`;

function RoomSecondaryEditor({
    room,
    isSecondaryPanelOpen,
    onSecondaryPanelClose,
}: {
    room: RoomWithParticipantInfoFragment | null;
    isSecondaryPanelOpen: boolean;
    onSecondaryPanelClose: () => void;
}): JSX.Element {
    const conference = useConference();
    return (
        <Drawer
            isOpen={isSecondaryPanelOpen}
            placement="right"
            onClose={onSecondaryPanelClose}
            // finalFocusRef={btnRef} // TODO: Ref to the edit button
            size="lg"
        >
            <DrawerOverlay>
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Edit</DrawerHeader>

                    <DrawerBody>
                        {room ? (
                            <>
                                <LinkButton
                                    to={`/conference/${conference.slug}/room/${room.id}`}
                                    colorScheme="green"
                                    mb={4}
                                    isExternal={true}
                                    aria-label={`View ${room.name} as an attendee`}
                                    title={`View ${room.name} as an attendee`}
                                >
                                    <FAIcon icon="external-link-alt" iconStyle="s" mr={3} />
                                    View room
                                </LinkButton>
                                <Accordion>
                                    <AccordionItem>
                                        <AccordionButton>
                                            <Box flex="1" textAlign="left">
                                                Participants
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel pt={4} pb={4}>
                                            {room.participants.length === 0 ? (
                                                "Room is currently empty."
                                            ) : (
                                                <UnorderedList>
                                                    {room.participants.map((participant) => (
                                                        <ListItem key={participant.id}>
                                                            {participant.attendee.displayName}
                                                        </ListItem>
                                                    ))}
                                                </UnorderedList>
                                            )}
                                        </AccordionPanel>
                                    </AccordionItem>

                                    {room.originatingData ? (
                                        <AccordionItem>
                                            <AccordionButton>
                                                <Box flex="1" textAlign="left">
                                                    Section 2 title
                                                </Box>
                                                <AccordionIcon />
                                            </AccordionButton>
                                            <AccordionPanel pt={4} pb={4}>
                                                <>
                                                    <Text>
                                                        The following shows the raw data received when this room was
                                                        imported.
                                                    </Text>
                                                    <Text
                                                        as="pre"
                                                        w="100%"
                                                        overflowWrap="break-word"
                                                        whiteSpace="pre-wrap"
                                                        mt={2}
                                                    >
                                                        <Code w="100%" p={2}>
                                                            Source Ids:{" "}
                                                            {JSON.stringify(
                                                                room.originatingData.sourceId.split("¬"),
                                                                null,
                                                                2
                                                            )}
                                                        </Code>
                                                    </Text>
                                                    <Text
                                                        as="pre"
                                                        w="100%"
                                                        overflowWrap="break-word"
                                                        whiteSpace="pre-wrap"
                                                        mt={2}
                                                    >
                                                        <Code w="100%" p={2}>
                                                            {JSON.stringify(room.originatingData.data, null, 2)}
                                                        </Code>
                                                    </Text>
                                                </>
                                            </AccordionPanel>
                                        </AccordionItem>
                                    ) : undefined}
                                </Accordion>
                            </>
                        ) : (
                            <>No room found.</>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    );
}

function EditableRoomsCRUDTable() {
    const conference = useConference();
    const [insertRoom, insertRoomResponse] = useCreateRoomMutation();
    const [deleteRooms, deleteRoomsResponse] = useDeleteRoomsMutation();
    const [updateRoom, updateRoomResponse] = useUpdateRoomMutation();

    const selectAllRoomsResult = useSelectAllRoomsWithParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    const data = useMemo(() => [...(selectAllRoomsResult.data?.Room ?? [])], [selectAllRoomsResult.data?.Room]);

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingRoom, setEditingRoom] = useState<RoomWithParticipantInfoFragment | null>(null);

    const row: RowSpecification<RoomWithParticipantInfoFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
        }),
        []
    );

    const columns: ColumnSpecification<RoomWithParticipantInfoFragment>[] = useMemo(
        () => [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader(props: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Name{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.name,
                set: (record, value: string) => {
                    record.name = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function EventNameCell(props: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                        />
                    );
                },
            },
            {
                id: "capacity",
                header: function CapacityHeader(props: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Capacity</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Capacity{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.capacity,
                set: (record, value: number) => {
                    record.capacity = value;
                },
                sort: (x: number, y: number) => x - y,
                filterFn: (
                    rows: Array<RoomWithParticipantInfoFragment>,
                    filterValue: { min?: number; max?: number }
                ) => {
                    return rows.filter(
                        (row) =>
                            (filterValue.min === undefined && filterValue.max === undefined) ||
                            (row.capacity &&
                                (filterValue.min === undefined || filterValue.min <= row.capacity) &&
                                (filterValue.max === undefined || filterValue.max >= row.capacity))
                    );
                },
                filterEl: NumberRangeColumnFilter(0, 3000),
                cell: function EventNameCell(props: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
                    return (
                        <NumberInput
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                            value={props.value ?? 3000}
                            min={0}
                            max={3000}
                            onChange={(vStr, v) => props.onChange?.(vStr === "" ? undefined : v)}
                            onBlur={props.onBlur}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    );
                },
            },
            {
                id: "priority",
                header: function PriorityHeader(props: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Priority</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Priority{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.priority,
                set: (record, value: number) => {
                    record.priority = value;
                },
                sort: (x: number, y: number) => x - y,
                filterFn: (
                    rows: Array<RoomWithParticipantInfoFragment>,
                    filterValue: { min?: number; max?: number }
                ) => {
                    return rows.filter(
                        (row) =>
                            (filterValue.min === undefined && filterValue.max === undefined) ||
                            (row.priority &&
                                (filterValue.min === undefined || filterValue.min <= row.priority) &&
                                (filterValue.max === undefined || filterValue.max >= row.priority))
                    );
                },
                filterEl: NumberRangeColumnFilter(0, 3000),
                cell: function EventNameCell(props: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
                    return (
                        <NumberInput
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                            value={props.value ?? 3000}
                            min={0}
                            max={3000}
                            onChange={(vStr, v) => props.onChange?.(vStr === "" ? 10 : v)}
                            onBlur={props.onBlur}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    );
                },
            },
            {
                id: "mode",
                header: function ModeHeader(props: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Current mode</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Current mode{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.currentModeName,
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows, v: RoomMode_Enum) => rows.filter((r) => r.currentModeName === v),
                filterEl: SelectColumnFilter(Object.values(RoomMode_Enum)),
                cell: function EventNameCell(props: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
                    return <Text>{props.value}</Text>;
                },
            },
        ],
        []
    );

    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    useEffect(() => {
        if (insertRoomResponse.error || updateRoomResponse.error || deleteRoomsResponse.error) {
            forceReloadRef.current?.();
        }
    }, [deleteRoomsResponse.error, insertRoomResponse.error, updateRoomResponse.error]);

    return (
        <>
            <CRUDTable
                data={!selectAllRoomsResult.loading && (selectAllRoomsResult.data?.Room ? data : null)}
                tableUniqueName="ManageConferenceRooms"
                row={row}
                columns={columns}
                edit={{
                    open: (key) => {
                        setEditingRoom(data.find((x) => x.id === key) ?? null);
                        onSecondaryPanelOpen();
                    },
                }}
                insert={{
                    ongoing: insertRoomResponse.loading,
                    generateDefaults: () => ({
                        id: uuidv4(),
                        conferenceId: conference.id,
                        capacity: undefined,
                        priority: 10,
                        currentModeName: RoomMode_Enum.Breakout,
                        name: "New room " + (data.length + 1),
                        participants: [],
                    }),
                    makeWhole: (d) => d as RoomWithParticipantInfoFragment,
                    start: (record) => {
                        insertRoom({
                            variables: {
                                room: {
                                    id: record.id,
                                    conferenceId: record.conferenceId,
                                    capacity: record.capacity,
                                    priority: record.priority,
                                    currentModeName: record.currentModeName,
                                    name: record.name,
                                },
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.insert_Room_one) {
                                    const data = _data.insert_Room_one;
                                    cache.modify({
                                        fields: {
                                            Room(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data: {
                                                        ...data,
                                                    },
                                                    fragment: RoomWithParticipantInfoFragmentDoc,
                                                    fragmentName: "RoomWithParticipantInfo",
                                                });
                                                if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                                    return existingRefs;
                                                }

                                                return [...existingRefs, newRef];
                                            },
                                        },
                                    });
                                }
                            },
                        });
                    },
                }}
                update={{
                    ongoing: updateRoomResponse.loading,
                    start: (record) => {
                        updateRoom({
                            variables: {
                                id: record.id,
                                name: record.name,
                                priority: record.priority,
                                capacity: record.capacity,
                            },
                            optimisticResponse: {
                                update_Room_by_pk: record,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.update_Room_by_pk) {
                                    const data = _data.update_Room_by_pk;
                                    cache.modify({
                                        fields: {
                                            Room(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data,
                                                    fragment: RoomWithParticipantInfoFragmentDoc,
                                                    fragmentName: "RoomWithParticipantInfo",
                                                });
                                                if (existingRefs.some((ref) => readField("id", ref) === data.id)) {
                                                    return existingRefs;
                                                }
                                                return [...existingRefs, newRef];
                                            },
                                        },
                                    });
                                }
                            },
                        });
                    },
                }}
                delete={{
                    ongoing: deleteRoomsResponse.loading,
                    start: (keys) => {
                        deleteRooms({
                            variables: {
                                deleteRoomIds: keys,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.delete_Room) {
                                    const data = _data.delete_Room;
                                    const deletedIds = data.returning.map((x) => x.id);
                                    cache.modify({
                                        fields: {
                                            Room(existingRefs: Reference[] = [], { readField }) {
                                                deletedIds.forEach((x) => {
                                                    cache.evict({
                                                        id: x.id,
                                                        fieldName: "RoomWithParticipantInfo",
                                                        broadcast: true,
                                                    });
                                                });
                                                return existingRefs.filter(
                                                    (ref) => !deletedIds.includes(readField("id", ref))
                                                );
                                            },
                                        },
                                    });
                                }
                            },
                        });
                    },
                }}
                alert={
                    insertRoomResponse.error || updateRoomResponse.error || deleteRoomsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertRoomResponse.error?.message ??
                                  updateRoomResponse.error?.message ??
                                  deleteRoomsResponse.error?.message.includes(
                                      // eslint-disable-next-line quotes
                                      'Foreign key violation. update or delete on table "Room" violates foreign key constraint "Event_roomId_fkey" on table "Event"'
                                  )
                                      ? "Events are scheduled in this room. Please delete them before deleting this room."
                                      : deleteRoomsResponse.error?.message ?? "Unknown error",
                          }
                        : undefined
                }
                forceReload={forceReloadRef}
            />
            <RoomSecondaryEditor
                room={editingRoom}
                isSecondaryPanelOpen={isSecondaryPanelOpen}
                onSecondaryPanelClose={onSecondaryPanelClose}
            />
        </>
    );
}

export default function ManageConferenceRoomsPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage rooms at ${conference.shortName}`);

    useDashboardPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Rooms
            </Heading>
            <EditableRoomsCRUDTable />
        </RequireAtLeastOnePermissionWrapper>
    );
}
