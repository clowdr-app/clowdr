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
    Flex,
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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import Papa from "papaparse";
import * as R from "ramda";
import type { LegacyRef } from "react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "urql";
import { v4 as uuidv4 } from "uuid";
import type {
    ManageRooms_SelectGroupRegistrantsQuery,
    ManageRooms_SelectGroupRegistrantsQueryVariables,
    RoomWithParticipantInfoFragment,
} from "../../../generated/graphql";
import {
    ManageRooms_SelectGroupRegistrantsDocument,
    Room_ManagementMode_Enum,
    Room_Mode_Enum,
    Room_PersonRole_Enum,
    useCreateRoomMutation,
    useDeleteRoomPersonMutation,
    useDeleteRoomsMutation,
    useGetIsExternalRtmpEnabledQuery,
    useInsertRoomPeopleMutation,
    useManageRooms_SelectGroupsQuery,
    useManageRooms_SelectItemsQuery,
    useManageRooms_SelectRoomPeopleQuery,
    useSelectAllRoomsWithParticipantsQuery,
    useUpdateRoomsWithParticipantsMutation,
} from "../../../generated/graphql";
import FAIcon from "../../Chakra/FAIcon";
import { LinkButton } from "../../Chakra/LinkButton";
import {
    CheckBoxColumnFilter,
    NumberRangeColumnFilter,
    SelectColumnFilter,
    TextColumnFilter,
} from "../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    DeepWriteable,
    ExtraButton,
    RowSpecification,
} from "../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import { useAuthParameters } from "../../GQL/AuthParameters";
import { makeContext } from "../../GQL/make-context";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useTitle } from "../../Hooks/useTitle";
import RequireRole from "../RequireRole";
import { useConference } from "../useConference";
import ExternalRtmpBroadcastEditor from "./Room/ExternalRtmpBroadcastEditor";
import ExternalRtmpInputEditor from "./Room/ExternalRtmpInputEditor";

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
        itemId
        managementModeName
        isProgramRoom
        participants {
            ...RoomParticipantWithRegistrantInfo
        }
        chatId
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
        registrant_Group(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            name
            conferenceId
        }
    }

    query ManageRooms_SelectItems($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            title
            conferenceId
        }
    }

    query ManageRooms_SelectGroupRegistrants($groupId: uuid!) {
        registrant_GroupRegistrant(where: { groupId: { _eq: $groupId } }) {
            id
            groupId
            registrantId
        }
    }

    fragment RoomPersonInfo on room_RoomMembership {
        id
        roomId
        registrant {
            id
            displayName
        }
        personRoleName
    }

    query ManageRooms_SelectRoomPeople($roomId: uuid!) {
        room_RoomMembership(where: { roomId: { _eq: $roomId } }) {
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
        $itemId: uuid
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
                itemId: $itemId
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

    mutation InsertRoomPeople($people: [room_RoomMembership_insert_input!]!) {
        insert_room_RoomMembership(
            objects: $people
            on_conflict: { constraint: RoomPerson_registrantId_roomId_key, update_columns: [] }
        ) {
            returning {
                ...RoomPersonInfo
            }
        }
    }

    mutation DeleteRooms($deleteRoomIds: [uuid!]!) {
        delete_room_Room(where: { id: { _in: $deleteRoomIds } }) {
            returning {
                id
            }
        }
    }

    mutation DeleteRoomPerson($id: uuid!) {
        delete_room_RoomMembership(where: { id: { _eq: $id } }) {
            returning {
                id
            }
        }
    }

    query GetIsExternalRtmpEnabled($conferenceId: uuid!) {
        broadcast: conference_Configuration_by_pk(conferenceId: $conferenceId, key: ENABLE_EXTERNAL_RTMP_BROADCAST) {
            conferenceId
            key
            value
        }
        input: conference_Configuration_by_pk(conferenceId: $conferenceId, key: ENABLE_EXTERNAL_RTMP_INPUT) {
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
    externalRtmpInputEnabled,
}: {
    room: RoomWithParticipantInfoFragment | null;
    isSecondaryPanelOpen: boolean;
    onSecondaryPanelClose: () => void;
    externalRtmpBroadcastEnabled: boolean;
    externalRtmpInputEnabled: boolean;
}): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [groups] = useManageRooms_SelectGroupsQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const [people, refetchPeople] = useManageRooms_SelectRoomPeopleQuery({
        variables: {
            roomId: room?.id,
        },
        pause: !room,
        requestPolicy: "network-only",
        context,
    });
    const [insertRoomPeopleResponse, insertRoomPeople] = useInsertRoomPeopleMutation();
    const [deleteRoomPersonResponse, deleteRoomPerson] = useDeleteRoomPersonMutation();
    useQueryErrorToast(insertRoomPeopleResponse.error, false, "ManageConferenceRoomsPage: InsertRoomPeople (mutation)");
    useQueryErrorToast(deleteRoomPersonResponse.error, false, "ManageConferenceRoomsPage: DeleteRoomPerson (mutation)");

    const [groupRegistrantsQFetching, setGroupRegistrantsQFetching] = useState<boolean>(false);

    const client = useClient();
    const addUsersFromGroup = useCallback(
        async (groupId: string) => {
            if (room) {
                try {
                    setGroupRegistrantsQFetching(true);
                    const result = await client
                        .query<
                            ManageRooms_SelectGroupRegistrantsQuery,
                            ManageRooms_SelectGroupRegistrantsQueryVariables
                        >(
                            ManageRooms_SelectGroupRegistrantsDocument,
                            {
                                groupId,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        )
                        .toPromise();
                    setGroupRegistrantsQFetching(false);
                    if (!result.error && result.data) {
                        await insertRoomPeople(
                            {
                                people: result.data.registrant_GroupRegistrant.map((x) => ({
                                    registrantId: x.registrantId,
                                    roomId: room.id,
                                    personRoleName: Room_PersonRole_Enum.Participant,
                                })),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        );
                        refetchPeople();
                    }
                } catch (e) {
                    setGroupRegistrantsQFetching(false);
                    console.error("Error inserting room people", e);
                }
            }
        },
        [client, insertRoomPeople, refetchPeople, room]
    );

    const { onCopy: onCopyRoomId, hasCopied: hasCopiedRoomId } = useClipboard(room?.id ?? "");
    const createdAt = useMemo(() => (room ? new Date(room.created_at) : new Date()), [room]);

    const sortedParticipants = useMemo(
        () => (room?.participants ? R.sortBy((x) => x.registrant?.displayName, room.participants) : []),
        [room?.participants]
    );
    const sortedMembers = useMemo(
        () =>
            people.data?.room_RoomMembership
                ? R.sortBy((x) => x.registrant?.displayName, people.data.room_RoomMembership)
                : [],
        [people.data?.room_RoomMembership]
    );

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
                                        to={`${conferencePath}/room/${room.id}`}
                                        colorScheme="purple"
                                        mb={4}
                                        isExternal={true}
                                        aria-label={`View ${room.name} as an registrant`}
                                        title={`View ${room.name} as an registrant`}
                                    >
                                        <FAIcon icon="external-link-alt" iconStyle="s" mr={3} />
                                        View room
                                    </LinkButton>
                                    {/* TODO: Add individuals
                                        TODO: Add by role?
                                    TODO: Add by subconference? */}
                                    {room.managementModeName === Room_ManagementMode_Enum.Private ? (
                                        <Menu>
                                            <MenuButton
                                                as={Button}
                                                isLoading={
                                                    groupRegistrantsQFetching || insertRoomPeopleResponse.fetching
                                                }
                                            >
                                                <FAIcon iconStyle="s" icon="user-plus" mr={2} />
                                                Add people from group
                                            </MenuButton>
                                            <MenuList maxH="max(250px, min(400px, 100vh - 25ex))" overflow="auto">
                                                {groups.data?.registrant_Group.map((group) => (
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
                                            {sortedParticipants.length === 0 ? (
                                                "Room is currently empty."
                                            ) : (
                                                <UnorderedList>
                                                    {sortedParticipants.map((participant) => (
                                                        <ListItem key={participant.id}>
                                                            {participant.registrant.displayName}
                                                        </ListItem>
                                                    ))}
                                                </UnorderedList>
                                            )}
                                        </AccordionPanel>
                                    </AccordionItem>

                                    {sortedMembers && room.managementModeName !== Room_ManagementMode_Enum.Public ? (
                                        <AccordionItem>
                                            <AccordionButton>
                                                <Box flex="1" textAlign="left">
                                                    Members
                                                </Box>
                                                <AccordionIcon />
                                            </AccordionButton>
                                            <AccordionPanel pt={4} pb={4}>
                                                {sortedMembers.length === 0 ? (
                                                    "Room has no members."
                                                ) : (
                                                    <UnorderedList spacing={1}>
                                                        {sortedMembers.map((member) => (
                                                            <ListItem
                                                                key={member.id}
                                                                _hover={{
                                                                    bgColor: "rgba(0, 0, 0, 0.25)",
                                                                }}
                                                                p={1}
                                                            >
                                                                <Flex>
                                                                    {member.registrant.displayName}
                                                                    <Button
                                                                        ml="auto"
                                                                        size="xs"
                                                                        colorScheme="DestructiveActionButton"
                                                                        aria-label="Remove room member"
                                                                        isDisabled={deleteRoomPersonResponse.fetching}
                                                                        onClick={async () => {
                                                                            try {
                                                                                await deleteRoomPerson({
                                                                                    id: member.id,
                                                                                });
                                                                                refetchPeople();
                                                                            } catch (e) {
                                                                                console.error(
                                                                                    "Unable to delete room person",
                                                                                    e
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <FAIcon iconStyle="s" icon="trash-alt" />
                                                                    </Button>
                                                                </Flex>
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

                                    {externalRtmpInputEnabled ? (
                                        <AccordionItem>
                                            {({ isExpanded }) => (
                                                <>
                                                    <AccordionButton>
                                                        <Box flex="1" textAlign="left">
                                                            Hybrid room (RTMP input)
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                    <AccordionPanel>
                                                        {isExpanded ? (
                                                            <ExternalRtmpInputEditor roomId={room.id} />
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
    const [insertRoomResponse, insertRoom] = useCreateRoomMutation();
    const [deleteRoomsResponse, deleteRooms] = useDeleteRoomsMutation();
    const [updateRoomResponse, updateRoom] = useUpdateRoomsWithParticipantsMutation();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [externalRtmpEnabledResponse] = useGetIsExternalRtmpEnabledQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const externalRtmpBroadcastEnabled = externalRtmpEnabledResponse.data?.broadcast?.value === true;
    const externalRtmpInputEnabled = externalRtmpEnabledResponse.data?.input?.value === true;

    const [items] = useManageRooms_SelectItemsQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });

    const [selectAllRoomsResult] = useSelectAllRoomsWithParticipantsQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
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
                id: "itemId",
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
                get: (data) => items.data?.content_Item.find((group) => group.id === data.itemId),
                set: (record, value: { id: string; title: string } | undefined) => {
                    record.itemId = value?.id as any as DeepWriteable<any> | undefined;
                },
                sortType: (rowA: { id: string; title: string }, rowB: { id: string; title: string }) => {
                    const compared = rowA && rowB ? rowA.title.localeCompare(rowB.title) : rowA ? 1 : rowB ? -1 : 0;
                    return compared;
                },
                filterFn: (rows: Array<RoomWithParticipantInfoFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => !row.itemId);
                    } else {
                        return rows.filter((row) => {
                            return (
                                (row.itemId &&
                                    items.data?.content_Item
                                        .find((group) => group.id === row.itemId)
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
            //             <LinkButton colorScheme="purple" to={`${conferencePath}/manage/import/schedule`}>
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

                                "Associated Content Id": room.itemId ?? "",

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

                        csvURL = window.URL.createObjectURL(csvData);

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
                data={!selectAllRoomsResult.fetching && (selectAllRoomsResult.data?.room_Room ? data : null)}
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
                    ongoing: insertRoomResponse.fetching,
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
                        insertRoom(
                            {
                                room: {
                                    id: record.id,
                                    conferenceId: record.conferenceId,
                                    capacity: record.capacity,
                                    priority: record.priority,
                                    currentModeName: record.currentModeName,
                                    name: record.name,
                                    managementModeName: record.managementModeName,
                                    itemId: record.itemId,
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
                    },
                }}
                update={{
                    ongoing: updateRoomResponse.fetching,
                    start: (record) => {
                        updateRoom(
                            {
                                id: record.id,
                                name: record.name,
                                priority: record.priority,
                                capacity: record.capacity,
                                managementModeName: record.managementModeName,
                                itemId: record.itemId,
                                chatId: record.chat?.id ?? "00000000-00000000-00000000-00000000",
                                enableMandatoryPin: !!record.chat?.enableMandatoryPin,
                                enableAutoPin: !!record.chat?.enableAutoPin,
                                enableMandatorySubscribe: !!record.chat?.enableMandatorySubscribe,
                                enableAutoSubscribe: !!record.chat?.enableAutoSubscribe,
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
                                    },
                                },
                            }
                        );
                    },
                }}
                delete={{
                    ongoing: deleteRoomsResponse.fetching,
                    start: (keys) => {
                        deleteRooms(
                            {
                                deleteRoomIds: keys,
                            },
                            context
                        );
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
                externalRtmpInputEnabled={externalRtmpInputEnabled}
            />
        </>
    );
}

export default function ManageRooms(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage rooms at ${conference.shortName}`);

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Heading mt={4} as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Rooms
            </Heading>
            <EditableRoomsCRUDTable />
        </RequireRole>
    );
}
