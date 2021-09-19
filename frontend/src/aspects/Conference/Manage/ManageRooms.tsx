import { gql, Reference } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    ButtonGroup,
    Center,
    chakra,
    Checkbox,
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
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    Text,
    Tooltip,
    UnorderedList,
    useClipboard,
    useDisclosure,
} from "@chakra-ui/react";
import Papa from "papaparse";
import React, { LegacyRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Permissions_Permission_Enum,
    RoomWithParticipantInfoFragment,
    RoomWithParticipantInfoFragmentDoc,
    Room_ManagementMode_Enum,
    Room_Mode_Enum,
    Room_PersonRole_Enum,
    useCreateRoomMutation,
    useDeleteRoomsMutation,
    useGetIsExternalRtmpBroadcastEnabledQuery,
    useInsertRoomPeopleMutation,
    useManageRooms_SelectGroupRegistrantsQuery,
    useManageRooms_SelectGroupsQuery,
    useManageRooms_SelectItemsQuery,
    useManageRooms_SelectRoomPeopleQuery,
    useSelectAllRoomsWithParticipantsQuery,
    useUpdateRoomsWithParticipantsMutation,
} from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import {
    CheckBoxColumnFilter,
    NumberRangeColumnFilter,
    SelectColumnFilter,
    TextColumnFilter,
} from "../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    DeepWriteable,
    ExtraButton,
    RowSpecification,
    SortDirection,
} from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import FAIcon from "../../Icons/FAIcon";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import ExternalRtmpBroadcastEditor from "./Room/ExternalRtmpBroadcastEditor";

gql`
    fragment RoomParticipantWithRegistrantInfo on room_Participant {
        id
        conferenceId
        registrantId
        roomId

        registrant {
            id
            displayName
        }
    }

    fragment RoomWithParticipantInfo on room_Room {
        id
        created_at
        conferenceId
        name
        currentModeName
        capacity
        priority
        originatingEventId
        originatingItemId
        managementModeName
        isProgramRoom
        participants {
            ...RoomParticipantWithRegistrantInfo
        }
        originatingData {
            ...OriginatingDataInfo
        }
        chat {
            id
            enableMandatoryPin
            enableMandatorySubscribe
            enableAutoPin
            enableAutoSubscribe
        }
    }

    query SelectAllRoomsWithParticipants($conferenceId: uuid!) {
        room_Room(where: { conferenceId: { _eq: $conferenceId }, managementModeName: { _in: [PUBLIC, PRIVATE] } }) {
            ...RoomWithParticipantInfo
        }
    }

    query ManageRooms_SelectGroups($conferenceId: uuid!) {
        permissions_Group(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            name
        }
    }

    query ManageRooms_SelectItems($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            title
        }
    }

    query ManageRooms_SelectGroupRegistrants($groupId: uuid!) {
        permissions_GroupRegistrant(where: { groupId: { _eq: $groupId } }) {
            id
            groupId
            registrantId
        }
    }

    fragment RoomPersonInfo on room_RoomPerson {
        id
        registrant {
            id
            displayName
        }
        personRoleName
    }

    query ManageRooms_SelectRoomPeople($roomId: uuid!) {
        room_RoomPerson(where: { roomId: { _eq: $roomId } }) {
            ...RoomPersonInfo
        }
    }

    mutation CreateRoom($room: room_Room_insert_input!) {
        insert_room_Room_one(object: $room) {
            ...RoomWithParticipantInfo
        }
    }

    mutation UpdateRoomsWithParticipants(
        $id: uuid!
        $name: String!
        $capacity: Int
        $priority: Int!
        $managementModeName: room_ManagementMode_enum!
        $originatingItemId: uuid
        $chatId: uuid!
        $enableMandatoryPin: Boolean!
        $enableAutoPin: Boolean!
        $enableMandatorySubscribe: Boolean!
        $enableAutoSubscribe: Boolean!
    ) {
        update_room_Room_by_pk(
            pk_columns: { id: $id }
            _set: {
                name: $name
                capacity: $capacity
                priority: $priority
                managementModeName: $managementModeName
                originatingItemId: $originatingItemId
            }
        ) {
            ...RoomWithParticipantInfo
        }
        update_chat_Chat(
            where: { id: { _eq: $chatId } }
            _set: {
                enableMandatoryPin: $enableMandatoryPin
                enableAutoPin: $enableAutoPin
                enableMandatorySubscribe: $enableMandatorySubscribe
                enableAutoSubscribe: $enableAutoSubscribe
            }
        ) {
            returning {
                id
                enableMandatoryPin
                enableAutoPin
                enableMandatorySubscribe
                enableAutoSubscribe
            }
        }
    }

    mutation InsertRoomPeople($people: [room_RoomPerson_insert_input!]!) {
        insert_room_RoomPerson(
            objects: $people
            on_conflict: { constraint: RoomPerson_registrantId_roomId_key, update_columns: [] }
        ) {
            returning {
                ...RoomPersonInfo
            }
        }
    }

    query GetIsExternalRtmpBroadcastEnabled($conferenceId: uuid!) {
        conference_Configuration_by_pk(conferenceId: $conferenceId, key: ENABLE_EXTERNAL_RTMP_BROADCAST) {
            conferenceId
            key
            value
        }
    }
`;

function RoomSecondaryEditor({
    room,
    isSecondaryPanelOpen,
    onSecondaryPanelClose,
    externalRtmpBroadcastEnabled,
}: {
    room: RoomWithParticipantInfoFragment | null;
    isSecondaryPanelOpen: boolean;
    onSecondaryPanelClose: () => void;
    externalRtmpBroadcastEnabled: boolean;
}): JSX.Element {
    const conference = useConference();
    const groups = useManageRooms_SelectGroupsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    const people = useManageRooms_SelectRoomPeopleQuery({
        variables: {
            roomId: room?.id,
        },
        skip: !room,
    });
    const groupRegistrantsQ = useManageRooms_SelectGroupRegistrantsQuery({
        skip: true,
    });
    const [insertRoomPeople, insertRoomPeopleResponse] = useInsertRoomPeopleMutation();
    useQueryErrorToast(groupRegistrantsQ.error, false, "ManaheConferenceRoomsPage: ManageRooms_SelectGroupRegistrants");
    useQueryErrorToast(insertRoomPeopleResponse.error, false, "ManaheConferenceRoomsPage: InsertRoomPeople (mutation)");

    const addUsersFromGroup = useCallback(
        async (groupId: string) => {
            if (room) {
                try {
                    const result = await groupRegistrantsQ.refetch({
                        groupId,
                    });
                    if (!result.error && result.data) {
                        insertRoomPeople({
                            variables: {
                                people: result.data.permissions_GroupRegistrant.map((x) => ({
                                    registrantId: x.registrantId,
                                    roomId: room.id,
                                    personRoleName: Room_PersonRole_Enum.Participant,
                                })),
                            },
                        });
                    }
                } catch (e) {
                    console.error("Error inserting room people", e);
                }
            }
        },
        [groupRegistrantsQ, insertRoomPeople, room]
    );

    const { onCopy: onCopyRoomId, hasCopied: hasCopiedRoomId } = useClipboard(room?.id ?? "");
    const createdAt = useMemo(() => (room ? new Date(room.created_at) : new Date()), [room]);

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
                    <DrawerHeader pb={1} pr="3em">
                        <Text fontSize="lg" overflow="wrap">
                            Edit: {room?.name ?? ""}
                        </Text>
                        <Text fontSize="xs" fontWeight="normal" mt={2} mb={1}>
                            Id: <Code fontSize="xs">{room?.id ?? ""}</Code>
                            <Button
                                onClick={onCopyRoomId}
                                size="xs"
                                ml="auto"
                                variant="ghost"
                                p={0}
                                h="auto"
                                minH={0}
                                aria-label="Copy room id"
                            >
                                <FAIcon
                                    iconStyle="s"
                                    icon={hasCopiedRoomId ? "check-circle" : "clipboard"}
                                    m={0}
                                    p={0}
                                />
                            </Button>
                        </Text>
                        <Text fontSize="xs" fontWeight="normal">
                            Created at: {createdAt.toLocaleString()}
                        </Text>
                    </DrawerHeader>
                    <DrawerCloseButton />

                    <DrawerBody>
                        {room ? (
                            <>
                                <ButtonGroup>
                                    <LinkButton
                                        to={`/conference/${conference.slug}/room/${room.id}`}
                                        colorScheme="purple"
                                        mb={4}
                                        isExternal={true}
                                        aria-label={`View ${room.name} as an registrant`}
                                        title={`View ${room.name} as an registrant`}
                                    >
                                        <FAIcon icon="external-link-alt" iconStyle="s" mr={3} />
                                        View room
                                    </LinkButton>
                                    {room.managementModeName === Room_ManagementMode_Enum.Private ? (
                                        <Menu>
                                            <MenuButton
                                                as={Button}
                                                isLoading={
                                                    groupRegistrantsQ.loading || insertRoomPeopleResponse.loading
                                                }
                                            >
                                                <FAIcon iconStyle="s" icon="user-plus" mr={2} />
                                                Add people from group
                                            </MenuButton>
                                            <MenuList>
                                                {groups.data?.permissions_Group.map((group) => (
                                                    <MenuItem
                                                        key={group.id}
                                                        onClick={() => addUsersFromGroup(group.id)}
                                                    >
                                                        {group.name}
                                                    </MenuItem>
                                                ))}
                                            </MenuList>
                                        </Menu>
                                    ) : undefined}
                                </ButtonGroup>
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
                                                            {participant.registrant.displayName}
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

                                    {people.data && room.managementModeName !== Room_ManagementMode_Enum.Public ? (
                                        <AccordionItem>
                                            <AccordionButton>
                                                <Box flex="1" textAlign="left">
                                                    Members
                                                </Box>
                                                <AccordionIcon />
                                            </AccordionButton>
                                            <AccordionPanel pt={4} pb={4}>
                                                {people.data.room_RoomPerson.length === 0 ? (
                                                    "Room has no members."
                                                ) : (
                                                    <UnorderedList>
                                                        {people.data.room_RoomPerson.map((member) => (
                                                            <ListItem key={member.id}>
                                                                {member.registrant.displayName}
                                                            </ListItem>
                                                        ))}
                                                    </UnorderedList>
                                                )}
                                            </AccordionPanel>
                                        </AccordionItem>
                                    ) : undefined}

                                    {externalRtmpBroadcastEnabled ? (
                                        <AccordionItem>
                                            {({ isExpanded }) => (
                                                <>
                                                    <AccordionButton>
                                                        <Box flex="1" textAlign="left">
                                                            External broadcast (RTMP output)
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                    <AccordionPanel>
                                                        {isExpanded ? (
                                                            <ExternalRtmpBroadcastEditor roomId={room.id} />
                                                        ) : undefined}
                                                    </AccordionPanel>
                                                </>
                                            )}
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
    const [updateRoom, updateRoomResponse] = useUpdateRoomsWithParticipantsMutation();

    const externalRtmpBroadcastEnabledResponse = useGetIsExternalRtmpBroadcastEnabledQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    const externalRtmpBroadcastEnabled =
        externalRtmpBroadcastEnabledResponse.data?.conference_Configuration_by_pk?.value === true;

    const items = useManageRooms_SelectItemsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const selectAllRoomsResult = useSelectAllRoomsWithParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    const data = useMemo(
        () =>
            (selectAllRoomsResult.data?.room_Room ?? []).map((x) => ({
                ...x,
                chat: x.chat ? { ...x.chat } : undefined,
            })),
        [selectAllRoomsResult.data?.room_Room]
    );

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingRoom, setEditingRoom] = useState<RoomWithParticipantInfoFragment | null>(null);

    const itemOptions = useMemo(
        () =>
            items.data?.content_Item
                ? [...items.data.content_Item]
                      .sort((x, y) => x.title.localeCompare(y.title))
                      .map((content) => {
                          return (
                              <option key={content.id} value={content.id}>
                                  {content.title}
                              </option>
                          );
                      })
                : undefined,
        [items.data?.content_Item]
    );

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
                header: function NameHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Name{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.name,
                set: (record, value: string) => {
                    record.name = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.name ?? "") === "");
                    } else {
                        return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function EventNameCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
                    return (
                        <Input
                            type="text"
                            value={value ?? ""}
                            onChange={(ev) => onChange?.(ev.target.value)}
                            onBlur={onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                            ref={ref as LegacyRef<HTMLInputElement>}
                        />
                    );
                },
            },
            {
                id: "isProgramRoom",
                header: function IsProgramRoomHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Button size="xs" onClick={onClick}>
                                Is program room?{sortDir !== null ? ` ${sortDir}` : undefined}
                            </Button>
                        );
                    }
                },
                get: (data) => data.isProgramRoom,
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: boolean) => {
                    return rows.filter((row) => row.isProgramRoom === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function InviteSentCell({
                    isInCreate,
                    value,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>, boolean>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Center>
                                <FAIcon iconStyle="s" icon={value ? "check" : "times"} />
                            </Center>
                        );
                    }
                },
            },
            // {
            //     id: "capacity",
            //     header: function CapacityHeader({
            //         isInCreate,
            //         onClick,
            //         sortDir,
            //     }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
            //         return isInCreate ? (
            //             <FormLabel>Capacity</FormLabel>
            //         ) : (
            //             <Button size="xs" onClick={onClick}>
            //                 Capacity{sortDir !== null ? ` ${sortDir}` : undefined}
            //             </Button>
            //         );
            //     },
            //     get: (data) => data.capacity,
            //     set: (record, value: number) => {
            //         record.capacity = value;
            //     },
            //     sort: (x: number, y: number) => x - y,
            //     filterFn: (
            //         rows: Array<RoomWithParticipantInfoFragment>,
            //         filterValue: { min?: number; max?: number }
            //     ) => {
            //         return rows.filter(
            //             (row) =>
            //                 (filterValue.min === undefined && filterValue.max === undefined) ||
            //                 (row.capacity &&
            //                     (filterValue.min === undefined || filterValue.min <= row.capacity) &&
            //                     (filterValue.max === undefined || filterValue.max >= row.capacity))
            //         );
            //     },
            //     filterEl: NumberRangeColumnFilter(0, 3000),
            //     cell: function EventNameCell({
            //         isInCreate,
            //         value,
            //         onChange,
            //         onBlur,
            //         ref
            //     }: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
            //         return (
            //             <NumberInput
            //                 border="1px solid"
            //                 borderColor="rgba(255, 255, 255, 0.16)"
            //                 value={value ?? 3000}
            //                 min={0}
            //                 max={3000}
            //                 onChange={(vStr, v) => onChange?.(vStr === "" ? undefined : v)}
            //                 onBlur={onBlur}
            //             >
            //                 <NumberInputField ref={ref as LegacyRef<HTMLInputElement>} />
            //                 <NumberInputStepper>
            //                     <NumberIncrementStepper aria-label="Increment" />
            //                     <NumberDecrementStepper aria-label="Decrement" />
            //                 </NumberInputStepper>
            //             </NumberInput>
            //         );
            //     },
            // },
            {
                id: "priority",
                header: function PriorityHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Priority</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Priority{sortDir !== null ? ` ${sortDir}` : undefined}
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
                cell: function EventNameCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
                    return (
                        <NumberInput
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                            value={value ?? 3000}
                            min={0}
                            max={3000}
                            onChange={(vStr, v) => onChange?.(vStr === "" ? 10 : v)}
                            onBlur={onBlur}
                        >
                            <NumberInputField ref={ref as LegacyRef<HTMLInputElement>} />
                            <NumberInputStepper>
                                <NumberIncrementStepper aria-label="Increment" />
                                <NumberDecrementStepper aria-label="Decrement" />
                            </NumberInputStepper>
                        </NumberInput>
                    );
                },
            },
            {
                id: "privacy",
                header: function ModeHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Privacy</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Privacy{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.managementModeName,
                set: (row, value) => {
                    row.managementModeName = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows, v: Room_ManagementMode_Enum) => rows.filter((r) => r.managementModeName === v),
                filterEl: SelectColumnFilter([Room_ManagementMode_Enum.Private, Room_ManagementMode_Enum.Public]),
                cell: function EventNameCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>>) {
                    if (value !== Room_ManagementMode_Enum.Private && value !== Room_ManagementMode_Enum.Public) {
                        return <Text>{value}</Text>;
                    } else {
                        const v = value ?? "";
                        return (
                            <Select
                                value={v}
                                onChange={(ev) => onChange?.(ev.target.value as Room_ManagementMode_Enum)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                            >
                                {v === "" ||
                                (v !== Room_ManagementMode_Enum.Public && v !== Room_ManagementMode_Enum.Private) ? (
                                    <option value="">&lt;Error&gt;</option>
                                ) : undefined}
                                <option value={Room_ManagementMode_Enum.Public}>Public</option>
                                <option value={Room_ManagementMode_Enum.Private}>Private</option>
                            </Select>
                        );
                    }
                },
            },
            {
                id: "originatingItemId",
                header: function ContentHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Associated content to discuss (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Content for discussion{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => items.data?.content_Item.find((group) => group.id === data.originatingItemId),
                set: (record, value: { id: string; title: string } | undefined) => {
                    record.originatingItemId = value?.id as any as DeepWriteable<any> | undefined;
                },
                sortType: (rowA: { id: string; title: string }, rowB: { id: string; title: string }) => {
                    const compared = rowA && rowB ? rowA.title.localeCompare(rowB.title) : rowA ? 1 : rowB ? -1 : 0;
                    return compared;
                },
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => !row.originatingItemId);
                    } else {
                        return rows.filter((row) => {
                            return (
                                (row.originatingItemId &&
                                    items.data?.content_Item
                                        .find((group) => group.id === row.originatingItemId)
                                        ?.title.toLowerCase()
                                        .includes(filterValue.toLowerCase())) ??
                                false
                            );
                        });
                    }
                },
                filterEl: TextColumnFilter,
                cell: function ContentCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>, { id: string; title: string } | undefined>) {
                    return (
                        <Select
                            value={value?.id ?? ""}
                            onChange={(ev) =>
                                onChange?.(items.data?.content_Item.find((group) => group.id === ev.target.value))
                            }
                            onBlur={onBlur}
                            ref={ref as LegacyRef<HTMLSelectElement>}
                            maxW={400}
                        >
                            <option value={""}>{"<None selected>"}</option>
                            {itemOptions}
                        </Select>
                    );
                },
            },
            {
                id: "auto-pin",
                header: function AutoPinHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <>
                                <chakra.span fontSize="80%" textAlign="center">
                                    Chat
                                </chakra.span>
                                <Button size="xs" onClick={onClick} h="auto" py={1}>
                                    Auto
                                    <br />
                                    pin?{sortDir !== null ? ` ${sortDir}` : undefined}
                                </Button>
                            </>
                        );
                    }
                },
                get: (data) => (data.chat && !data.chat.enableMandatoryPin ? data.chat.enableAutoPin : undefined),
                set: (data, value: boolean) => {
                    if (data.chat) {
                        data.chat.enableAutoPin = value;
                    }
                },
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.chat?.enableAutoPin === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function AutoPinCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>, boolean>) {
                    if (isInCreate) {
                        return undefined;
                    } else if (value !== undefined) {
                        return (
                            <Center>
                                <Checkbox
                                    isChecked={value ?? false}
                                    onChange={(ev) => onChange?.(ev.target.checked)}
                                    onBlur={onBlur}
                                    ref={ref as LegacyRef<HTMLInputElement>}
                                />
                            </Center>
                        );
                    } else {
                        return <div></div>;
                    }
                },
            },
            {
                id: "mandatory-pin",
                header: function MandatoryPinHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <>
                                <chakra.span fontSize="80%" textAlign="center">
                                    Chat
                                </chakra.span>
                                <Button size="xs" onClick={onClick} h="auto" py={1}>
                                    Mandatory
                                    <br />
                                    pin?{sortDir !== null ? ` ${sortDir}` : undefined}
                                </Button>
                            </>
                        );
                    }
                },
                get: (data) => data.chat && data.chat.enableMandatoryPin,
                set: (data, value: boolean) => {
                    if (data.chat) {
                        data.chat.enableMandatoryPin = value;
                    }
                },
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.chat?.enableMandatoryPin === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function MandatoryPinCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>, boolean>) {
                    if (isInCreate) {
                        return undefined;
                    } else if (value !== undefined) {
                        return (
                            <Center>
                                <Checkbox
                                    isChecked={value ?? false}
                                    onChange={(ev) => onChange?.(ev.target.checked)}
                                    onBlur={onBlur}
                                    ref={ref as LegacyRef<HTMLInputElement>}
                                />
                            </Center>
                        );
                    } else {
                        return <div></div>;
                    }
                },
            },
            {
                id: "auto-subscribe",
                header: function AutoSubscribeHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <>
                                <chakra.span fontSize="80%" textAlign="center">
                                    Chat
                                </chakra.span>
                                <Button size="xs" onClick={onClick} h="auto" py={1}>
                                    Auto
                                    <br />
                                    subscribe?{sortDir !== null ? ` ${sortDir}` : undefined}
                                </Button>
                            </>
                        );
                    }
                },
                get: (data) =>
                    data.chat && !data.chat.enableMandatorySubscribe ? data.chat.enableAutoSubscribe : undefined,
                set: (data, value: boolean) => {
                    if (data.chat) {
                        data.chat.enableAutoSubscribe = value;
                    }
                },
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.chat?.enableAutoSubscribe === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function AutoSubscribeCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>, boolean>) {
                    if (isInCreate) {
                        return undefined;
                    } else if (value !== undefined) {
                        return (
                            <Center>
                                <Checkbox
                                    isChecked={value ?? false}
                                    onChange={(ev) => onChange?.(ev.target.checked)}
                                    onBlur={onBlur}
                                    ref={ref as LegacyRef<HTMLInputElement>}
                                />
                            </Center>
                        );
                    } else {
                        return <div></div>;
                    }
                },
            },
            {
                id: "mandatory-subscribe",
                header: function MandatorySubscribeHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<RoomWithParticipantInfoFragment>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <>
                                <chakra.span fontSize="80%" textAlign="center">
                                    Chat
                                </chakra.span>
                                <Button size="xs" onClick={onClick} h="auto" py={1}>
                                    Mandatory
                                    <br />
                                    subscribe?{sortDir !== null ? ` ${sortDir}` : undefined}
                                </Button>
                            </>
                        );
                    }
                },
                get: (data) => data.chat && data.chat.enableMandatorySubscribe,
                set: (data, value: boolean) => {
                    if (data.chat) {
                        data.chat.enableMandatorySubscribe = value;
                    }
                },
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.chat?.enableMandatorySubscribe === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function MandatorySubscribeCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RoomWithParticipantInfoFragment>, boolean>) {
                    if (isInCreate) {
                        return undefined;
                    } else if (value !== undefined) {
                        return (
                            <Center>
                                <Checkbox
                                    isChecked={value ?? false}
                                    onChange={(ev) => onChange?.(ev.target.checked)}
                                    onBlur={onBlur}
                                    ref={ref as LegacyRef<HTMLInputElement>}
                                />
                            </Center>
                        );
                    } else {
                        return <div></div>;
                    }
                },
            },
        ],
        [items, itemOptions]
    );

    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    useEffect(() => {
        if (insertRoomResponse.error || updateRoomResponse.error || deleteRoomsResponse.error) {
            forceReloadRef.current?.();
        }
    }, [deleteRoomsResponse.error, insertRoomResponse.error, updateRoomResponse.error]);

    const buttons: ExtraButton<RoomWithParticipantInfoFragment>[] = useMemo(
        () => [
            // TODO
            // {
            //     render: function ImportButton(_selectedData) {
            //         return (
            //             <LinkButton colorScheme="purple" to={`/conference/${conference.slug}/manage/import/schedule`}>
            //                 Import
            //             </LinkButton>
            //         );
            //     },
            // },
            {
                render: ({ selectedData }: { selectedData: RoomWithParticipantInfoFragment[] }) => {
                    function doExport(dataToExport: readonly RoomWithParticipantInfoFragment[]) {
                        const csvText = Papa.unparse(
                            dataToExport.map((room) => ({
                                "Conference Id": room.conferenceId,
                                "Room Id": room.id,
                                Name: room.name,
                                "Is program room?": room.isProgramRoom ? "Yes" : "No",
                                Priority: room.priority,
                                Privacy: room.managementModeName,

                                "Externally Sourced Data Id": room.originatingData?.id ?? "",
                                "Associated Content Id": room.originatingItemId ?? "",
                                "Associated Event Id": room.originatingEventId ?? "",

                                "Created At": room.created_at,
                                "Current Mode Name": room.currentModeName,
                                Capacity: room.capacity ?? "Not set",

                                "Chat - Id": room.chat?.id ?? "",
                                "Chat - Enable Auto Pin": room.chat ? (room.chat.enableAutoPin ? "Yes" : "No") : "",
                                "Chat - Enable Mandatory Pin": room.chat
                                    ? room.chat.enableMandatoryPin
                                        ? "Yes"
                                        : "No"
                                    : "",
                                "Chat - Enable Auto Subscribe": room.chat
                                    ? room.chat.enableAutoSubscribe
                                        ? "Yes"
                                        : "No"
                                    : "",
                                "Chat - Enable Mandatory Subscribe": room.chat
                                    ? room.chat.enableMandatorySubscribe
                                        ? "Yes"
                                        : "No"
                                    : "",
                            })),
                            {
                                columns: [
                                    "Conference Id",
                                    "Room Id",
                                    "Name",
                                    "Is program room?",
                                    "Priority",
                                    "Privacy",
                                    "Externally Sourced Data Id",
                                    "Associated Content Id",
                                    "Associated Event Id",
                                    "Created At",
                                    "Current Mode Name",
                                    "Capacity",
                                    "Chat - Id",
                                    "Chat - Enable Auto Pin",
                                    "Chat - Enable Mandatory Pin",
                                    "Chat - Enable Auto Subscribe",
                                    "Chat - Enable Mandatory Subscribe",
                                ],
                            }
                        );

                        const csvData = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
                        let csvURL: string | null = null;
                        const now = new Date();
                        const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
                            .getDate()
                            .toString()
                            .padStart(2, "0")}T${now.getHours().toString().padStart(2, "0")}-${now
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")} - Midspace Rooms.csv`;
                        if (navigator.msSaveBlob) {
                            navigator.msSaveBlob(csvData, fileName);
                        } else {
                            csvURL = window.URL.createObjectURL(csvData);
                        }

                        const tempLink = document.createElement("a");
                        tempLink.href = csvURL ?? "";
                        tempLink.setAttribute("download", fileName);
                        tempLink.click();
                    }

                    const tooltip = (filler: string) => `Exports ${filler}.`;
                    if (selectedData.length === 0) {
                        return (
                            <Menu>
                                <Tooltip label={tooltip("all rooms")}>
                                    <MenuButton as={Button} colorScheme="purple" rightIcon={<ChevronDownIcon />}>
                                        Export
                                    </MenuButton>
                                </Tooltip>
                                <MenuList maxH="400px" overflowY="auto">
                                    <MenuItem
                                        onClick={() => {
                                            if (selectAllRoomsResult.data?.room_Room) {
                                                doExport(selectAllRoomsResult.data.room_Room);
                                            }
                                        }}
                                    >
                                        All rooms
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            if (selectAllRoomsResult.data?.room_Room) {
                                                doExport(
                                                    selectAllRoomsResult.data.room_Room.filter(
                                                        (room) => !!room.isProgramRoom
                                                    )
                                                );
                                            }
                                        }}
                                    >
                                        Program rooms
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            if (selectAllRoomsResult.data?.room_Room) {
                                                doExport(
                                                    selectAllRoomsResult.data.room_Room.filter(
                                                        (room) => !room.isProgramRoom
                                                    )
                                                );
                                            }
                                        }}
                                    >
                                        Non-program rooms
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            if (selectAllRoomsResult.data?.room_Room) {
                                                doExport(
                                                    selectAllRoomsResult.data.room_Room.filter(
                                                        (room) =>
                                                            room.managementModeName === Room_ManagementMode_Enum.Public
                                                    )
                                                );
                                            }
                                        }}
                                    >
                                        Public rooms
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            if (selectAllRoomsResult.data?.room_Room) {
                                                doExport(
                                                    selectAllRoomsResult.data.room_Room.filter(
                                                        (room) =>
                                                            room.managementModeName === Room_ManagementMode_Enum.Private
                                                    )
                                                );
                                            }
                                        }}
                                    >
                                        Private rooms
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        );
                    } else {
                        return (
                            <Tooltip label={tooltip("selected rooms")}>
                                <Box>
                                    <Button
                                        colorScheme="purple"
                                        isDisabled={selectedData.length === 0}
                                        onClick={() => doExport(selectedData)}
                                    >
                                        Export
                                    </Button>
                                </Box>
                            </Tooltip>
                        );
                    }
                },
            },
        ],
        [selectAllRoomsResult.data?.room_Room]
    );

    return (
        <>
            <CRUDTable
                data={!selectAllRoomsResult.loading && (selectAllRoomsResult.data?.room_Room ? data : null)}
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
                        currentModeName: Room_Mode_Enum.VideoChat,
                        name: "New room " + (data.length + 1),
                        participants: [],
                        managementModeName: Room_ManagementMode_Enum.Public,
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
                                    managementModeName: record.managementModeName,
                                    originatingItemId: record.originatingItemId,
                                },
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.insert_room_Room_one) {
                                    const data = _data.insert_room_Room_one;
                                    cache.writeFragment({
                                        data,
                                        fragment: RoomWithParticipantInfoFragmentDoc,
                                        fragmentName: "RoomWithParticipantInfo",
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
                                managementModeName: record.managementModeName,
                                originatingItemId: record.originatingItemId,
                                chatId: record.chat?.id ?? "00000000-00000000-00000000-00000000",
                                enableMandatoryPin: !!record.chat?.enableMandatoryPin,
                                enableAutoPin: !!record.chat?.enableAutoPin,
                                enableMandatorySubscribe: !!record.chat?.enableMandatorySubscribe,
                                enableAutoSubscribe: !!record.chat?.enableAutoSubscribe,
                            },
                            optimisticResponse: {
                                update_room_Room_by_pk: record,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.update_room_Room_by_pk) {
                                    const data = _data.update_room_Room_by_pk;
                                    cache.writeFragment({
                                        data,
                                        fragment: RoomWithParticipantInfoFragmentDoc,
                                        fragmentName: "RoomWithParticipantInfo",
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
                                if (_data?.delete_room_Room) {
                                    const data = _data.delete_room_Room;
                                    const deletedIds = data.returning.map((x) => x.id);
                                    cache.modify({
                                        fields: {
                                            room_Room(existingRefs: Reference[] = [], { readField }) {
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
                                  (deleteRoomsResponse.error?.message.includes(
                                      // eslint-disable-next-line quotes
                                      'Foreign key violation. update or delete on table "Room" violates foreign key constraint "Event_roomId_fkey" on table "Event"'
                                  )
                                      ? "Events are scheduled in this room. Please delete them before deleting this room."
                                      : deleteRoomsResponse.error?.message) ??
                                  "Unknown error",
                          }
                        : undefined
                }
                buttons={buttons}
                forceReload={forceReloadRef}
            />
            <RoomSecondaryEditor
                room={editingRoom}
                isSecondaryPanelOpen={isSecondaryPanelOpen}
                onSecondaryPanelClose={onSecondaryPanelClose}
                externalRtmpBroadcastEnabled={externalRtmpBroadcastEnabled}
            />
        </>
    );
}

export default function ManageRooms(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage rooms at ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Rooms
            </Heading>
            <EditableRoomsCRUDTable />
        </RequireAtLeastOnePermissionWrapper>
    );
}
