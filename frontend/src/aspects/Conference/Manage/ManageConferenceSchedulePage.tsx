import { gql, Reference } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Center,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    FormLabel,
    Heading,
    HStack,
    Input,
    Select,
    Text,
    Tooltip,
    useColorModeValue,
    useDisclosure,
    VisuallyHidden,
} from "@chakra-ui/react";
import { DateTime } from "luxon";
import React, { useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    AttendeeInfoFragment,
    ContentGroupFullNestedInfoFragment,
    EventInfoFragment,
    EventInfoFragmentDoc,
    Permission_Enum,
    RoomInfoFragment,
    RoomMode_Enum,
    useDeleteEventInfosMutation,
    useInsertEventInfoMutation,
    useSelectWholeScheduleQuery,
    useUpdateEventInfoMutation,
} from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { DateTimePicker } from "../../CRUDTable/DateTimePicker";
import {
    DateTimeColumnFilter,
    dateTimeFilterFn,
    formatEnumValue,
    SelectColumnFilter,
    TextColumnFilter,
} from "../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import { useRealTime } from "../../Generic/useRealTime";
import FAIcon from "../../Icons/FAIcon";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { EventPersonsModal, requiresEventPeople } from "./Schedule/EventPersonsModal";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    mutation InsertEventInfo(
        $id: uuid!
        $roomId: uuid!
        $conferenceId: uuid!
        $intendedRoomModeName: RoomMode_enum!
        $originatingDataId: uuid = null
        $name: String!
        $startTime: timestamptz!
        $durationSeconds: Int!
        $contentGroupId: uuid = null
    ) {
        insert_Event_one(
            object: {
                id: $id
                roomId: $roomId
                conferenceId: $conferenceId
                intendedRoomModeName: $intendedRoomModeName
                originatingDataId: $originatingDataId
                name: $name
                startTime: $startTime
                durationSeconds: $durationSeconds
                contentGroupId: $contentGroupId
            }
        ) {
            ...EventInfo
        }
    }

    mutation UpdateEventInfo(
        $eventId: uuid!
        $roomId: uuid!
        $intendedRoomModeName: RoomMode_enum!
        $originatingDataId: uuid = null
        $name: String!
        $startTime: timestamptz!
        $durationSeconds: Int!
        $contentGroupId: uuid = null
    ) {
        update_Event_by_pk(
            pk_columns: { id: $eventId }
            _set: {
                roomId: $roomId
                intendedRoomModeName: $intendedRoomModeName
                originatingDataId: $originatingDataId
                name: $name
                startTime: $startTime
                durationSeconds: $durationSeconds
                contentGroupId: $contentGroupId
            }
        ) {
            ...EventInfo
        }
    }

    mutation DeleteEventInfos($eventIds: [uuid!]!) {
        delete_Event(where: { id: { _in: $eventIds } }) {
            returning {
                id
            }
        }
    }
`;

enum ColumnId {
    StartTime = "startTime",
    EndTime = "endTime",
    Room = "room",
    RoomMode = "roomMode",
    Name = "name",
    Content = "content",
}

function rowWarning(row: EventInfoFragment) {
    if (requiresEventPeople(row)) {
        return "This event will be live streamed but no Event People have been assigned to manage it.";
    }
    return undefined;
}

function isOngoing(now: number, startLeeway: number, endLeeway: number, start: number, end: number): boolean {
    return start - startLeeway <= now && now <= end + endLeeway;
}

const liveStreamRoomModes: RoomMode_Enum[] = [
    RoomMode_Enum.Prerecorded,
    RoomMode_Enum.Presentation,
    RoomMode_Enum.QAndA,
];

function EditableScheduleTable(): JSX.Element {
    const conference = useConference();
    const wholeSchedule = useSelectWholeScheduleQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
    });
    const data = useMemo(() => [...(wholeSchedule.data?.Event ?? [])], [wholeSchedule.data?.Event]);

    const roomOptions = useMemo(
        () =>
            wholeSchedule.data?.Room
                ? [...wholeSchedule.data.Room]
                      .sort((x, y) => x.name.localeCompare(y.name))
                      .map((room) => {
                          return (
                              <option key={room.id} value={room.id}>
                                  {room.name}
                              </option>
                          );
                      })
                : undefined,
        [wholeSchedule.data?.Room]
    );

    const roomModeOptions = useMemo(
        () =>
            Object.keys(RoomMode_Enum)
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (RoomMode_Enum as any)[x];
                    return { value: v, label: formatEnumValue(v) };
                }),
        []
    );

    const contentGroupOptions = useMemo(
        () =>
            wholeSchedule.data?.ContentGroup
                ? [...wholeSchedule.data.ContentGroup]
                      .sort((x, y) => x.title.localeCompare(y.title))
                      .map((content) => {
                          return (
                              <option key={content.id} value={content.id}>
                                  {content.title}
                              </option>
                          );
                      })
                : undefined,
        [wholeSchedule.data?.ContentGroup]
    );

    const {
        isOpen: isSecondaryPanelOpen,
        onOpen: onSecondaryPanelOpen,
        onClose: onSecondaryPanelClose,
    } = useDisclosure();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [insertEvent, insertEventResponse] = useInsertEventInfoMutation();
    const [updateEvent, updateEventResponse] = useUpdateEventInfoMutation();
    const [deleteEvents, deleteEventsResponse] = useDeleteEventInfosMutation();

    const columns: Array<ColumnSpecification<EventInfoFragment>> = React.useMemo(
        () => [
            {
                id: ColumnId.StartTime,
                isDataDependency: true,
                defaultSortDirection: SortDirection.Asc,
                header: function StartTimeHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Start time</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Start Time{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (record) => (record.startTime ? new Date(record.startTime) : new Date()),
                set: (record, v: Date) => {
                    // TODO: Make this match updateMyData
                    record.startTime = v.toISOString() as any;
                },
                filterFn: dateTimeFilterFn(["startTime"]),
                filterEl: DateTimeColumnFilter,
                sort: (x: Date, y: Date) => x.getTime() - y.getTime(),
                cell: function StartTimeCell(props: CellProps<Partial<EventInfoFragment>, Date | undefined>) {
                    const now = useRealTime(10000);
                    const start = props.value?.getTime() ?? Date.now();
                    const ongoing = isOngoing(
                        now,
                        1 * 60 * 1000,
                        1 * 60 * 1000,
                        start,
                        start + 1000 * (props.staleRecord.durationSeconds ?? 300)
                    );

                    return (
                        <HStack>
                            {ongoing &&
                            props.staleRecord.intendedRoomModeName &&
                            liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName) ? (
                                <Tooltip label="You cannot edit the start time of an ongoing live-stream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <DateTimePicker
                                size="sm"
                                value={props.value}
                                onChange={(v: Date) => props.onChange?.(v)}
                                onBlur={() => props.onBlur?.()}
                                isDisabled={
                                    ongoing &&
                                    props.staleRecord.intendedRoomModeName &&
                                    liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                                }
                            />
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.EndTime,
                isDataDependency: true,
                header: function EndTimeHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>End time</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            End Time{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (record) =>
                    record.startTime
                        ? new Date(Date.parse(record.startTime) + 1000 * (record.durationSeconds ?? 300))
                        : new Date(Date.now() + 1000 * (record.durationSeconds ?? 300)),
                set: (record, v: Date) => {
                    // TODO: Make this match updateMyData
                    const start = record.startTime ? Date.parse((record.startTime as unknown) as string) : Date.now();
                    record.durationSeconds = Math.max(60, Math.round((v.getTime() - start) / 1000));
                },
                filterFn: dateTimeFilterFn(["endTime"]),
                filterEl: DateTimeColumnFilter,
                sort: (x: Date, y: Date) => x.getTime() - y.getTime(),
                cell: function EndTimeCell(props: CellProps<Partial<EventInfoFragment>, Date>) {
                    const now = useRealTime(10000);
                    const ongoing = isOngoing(
                        now,
                        1 * 60 * 1000,
                        1 * 60 * 1000,
                        Date.parse(props.staleRecord.startTime),
                        props.value.getTime()
                    );

                    return (
                        <HStack>
                            {ongoing &&
                            props.staleRecord.intendedRoomModeName &&
                            liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName) ? (
                                <Tooltip label="You cannot edit the end time of an ongoing live-stream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <DateTimePicker
                                size="sm"
                                value={props.value}
                                onChange={(v: Date) => props.onChange?.(v)}
                                onBlur={() => props.onBlur?.()}
                                isDisabled={
                                    ongoing &&
                                    props.staleRecord.intendedRoomModeName &&
                                    liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                                }
                            />
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.Room,
                isDataDependency: true,
                header: function EndTimeHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Room</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Room{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => wholeSchedule.data?.Room.find((room) => room.id === data.roomId),
                set: (record, v: RoomInfoFragment | undefined) => {
                    // TODO: Make this match updateMyData
                    record.roomId = v?.id;
                },
                sort: (x: RoomInfoFragment | undefined, y: RoomInfoFragment | undefined) => {
                    return x && y ? x.name.localeCompare(y.name) : x ? 1 : y ? -1 : 0;
                },
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => {
                        return (
                            wholeSchedule.data?.Room.find((room) => room.id === row.roomId)
                                ?.name.toLowerCase()
                                .includes(filterValue.toLowerCase()) ?? false
                        );
                    });
                },
                filterEl: TextColumnFilter,
                cell: function RoomCell(props: CellProps<Partial<EventInfoFragment>, RoomInfoFragment | undefined>) {
                    return (
                        <HStack>
                            {props.value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`/conference/${conference.slug}/room/${props.value.id}`}
                                    size="xs"
                                    aria-label="Go to room in new tab"
                                >
                                    <Tooltip label="Go to room in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            <Select
                                value={props.value?.id ?? ""}
                                onChange={(ev) =>
                                    props.onChange?.(
                                        wholeSchedule.data?.Room.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={props.onBlur}
                            >
                                {roomOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.RoomMode,
                header: function EndTimeHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Mode</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Mode{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.intendedRoomModeName,
                set: (record, v: RoomMode_Enum) => {
                    // TODO: Make this match updateMyData
                    record.intendedRoomModeName = v;
                },
                filterFn: (rows, v: RoomMode_Enum) => rows.filter((r) => r.intendedRoomModeName === v),
                filterEl: SelectColumnFilter(Object.values(RoomMode_Enum)),
                sort: (x: RoomMode_Enum, y: RoomMode_Enum) => x.localeCompare(y),
                cell: function RoomModeCell(props: CellProps<Partial<EventInfoFragment>, RoomMode_Enum | undefined>) {
                    const now = useRealTime(10000);
                    const start = Date.parse(props.staleRecord.startTime);
                    const ongoing = isOngoing(
                        now,
                        5 * 60 * 1000,
                        1 * 60 * 1000,
                        start,
                        start + 1000 * (props.staleRecord.durationSeconds ?? 300)
                    );

                    return (
                        <HStack>
                            {ongoing ? (
                                <Tooltip label="Live-stream modes must be set at least 10 minutes in advance of an event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={props.value ?? ""}
                                onChange={(ev) => props.onChange?.(ev.target.value as RoomMode_Enum)}
                                onBlur={props.onBlur}
                            >
                                {roomModeOptions.map((option) => {
                                    return (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                            disabled={
                                                ongoing &&
                                                liveStreamRoomModes.includes(option.value) &&
                                                option.value !== props.value
                                                    ? true
                                                    : undefined
                                            }
                                        >
                                            {option.label}
                                        </option>
                                    );
                                })}
                            </Select>
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.Name,
                header: function EventNameHeader(props: ColumnHeaderProps<EventInfoFragment>) {
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
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function EventNameCell(props: CellProps<Partial<EventInfoFragment>>) {
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
                id: ColumnId.Content,
                header: function ContentHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Content (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Content{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => wholeSchedule.data?.ContentGroup.find((room) => room.id === data.contentGroupId),
                set: (record, value: ContentGroupFullNestedInfoFragment | undefined) => {
                    record.contentGroupId = value?.id;
                },
                sortType: (rowA: ContentGroupFullNestedInfoFragment, rowB: ContentGroupFullNestedInfoFragment) => {
                    const compared = rowA && rowB ? rowA.title.localeCompare(rowB.title) : rowA ? 1 : rowB ? -1 : 0;
                    return compared;
                },
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => {
                        return (
                            (row.contentGroupId &&
                                wholeSchedule.data?.ContentGroup.find((room) => room.id === row.contentGroupId)
                                    ?.title.toLowerCase()
                                    .includes(filterValue.toLowerCase())) ??
                            false
                        );
                    });
                },
                filterEl: TextColumnFilter,
                cell: function ContentCell(
                    props: CellProps<Partial<EventInfoFragment>, ContentGroupFullNestedInfoFragment | undefined>
                ) {
                    return (
                        <HStack>
                            {props.value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`/conference/${conference.slug}/item/${props.value.id}`}
                                    size="xs"
                                    aria-label="Go to content in new tab"
                                >
                                    <Tooltip label="Go to content in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            <Select
                                value={props.value?.id ?? ""}
                                onChange={(ev) =>
                                    props.onChange?.(
                                        wholeSchedule.data?.ContentGroup.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={props.onBlur}
                            >
                                <option value={""}>{"<None selected>"}</option>
                                {contentGroupOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
        ],
        [
            conference.slug,
            contentGroupOptions,
            roomModeOptions,
            roomOptions,
            wholeSchedule.data?.ContentGroup,
            wholeSchedule.data?.Room,
        ]
    );

    // const updateMyData = (rowIndex: number, columnId: ColumnId, value: any) => {
    //     let finalValue = value;
    //     if (wholeSchedule.data) {
    //         const original = wholeSchedule.data.Event[rowIndex];
    //         const updated = { ...original };
    //         let hasChanged = false;
    //         switch (columnId) {
    //             case ColumnId.StartTime:
    //                 {
    //                     const originalStart = Date.parse(original.startTime);
    //                     const originalEnd = originalStart + 1000 * original.durationSeconds;
    //                     updated.startTime = new Date(value).toISOString();
    //                     if (value < originalEnd) {
    //                         updated.durationSeconds = Math.max(Math.round((originalEnd - value) / 1000), 30);
    //                     }
    //                     // Make sure we're comparing numeric timestamp, because
    //                     // string formats differ between client side and server side.
    //                     hasChanged = value !== originalStart;
    //                 }
    //                 break;
    //             case ColumnId.EndTime:
    //                 {
    //                     const origStartTime = Date.parse(updated.startTime);
    //                     let startTime = origStartTime;
    //                     if (value < startTime) {
    //                         startTime = value - 1000 * updated.durationSeconds;
    //                         updated.startTime = new Date(startTime).toISOString();
    //                     } else {
    //                         updated.durationSeconds = Math.max(Math.round((value - startTime) / 1000), 30);
    //                     }
    //                     hasChanged =
    //                         updated.durationSeconds !== original.durationSeconds || origStartTime !== startTime;
    //                     finalValue = startTime + 1000 * updated.durationSeconds;
    //                 }
    //                 break;
    //         }
    //     }
    // };

    // return (
    //     <>
    //         {wholeSchedule.error ? (
    //             <Alert status="error">
    //                 <AlertTitle>Error</AlertTitle>
    //                 <AlertDescription>
    //                     <Text>Error loading data.</Text>
    //                     <Code>{wholeSchedule.error.message}</Code>
    //                 </AlertDescription>
    //             </Alert>
    //         ) : undefined}
    //         {insertEventResponse.error ? (
    //             <Alert status="error">
    //                 <AlertTitle>Error</AlertTitle>
    //                 <AlertDescription>
    //                     <Text>Error creating event.</Text>
    //                     <Code>{insertEventResponse.error.message}</Code>
    //                 </AlertDescription>
    //             </Alert>
    //         ) : undefined}
    //         {updateEventResponse.error ? (
    //             <Alert status="error">
    //                 <AlertTitle>Error</AlertTitle>
    //                 <AlertDescription>
    //                     <Text>Error saving changes.</Text>
    //                     <Code>{updateEventResponse.error.message}</Code>
    //                 </AlertDescription>
    //             </Alert>
    //         ) : undefined}
    //         {deleteEventResponse.error ? (
    //             <Alert status="error">
    //                 <AlertTitle>Error</AlertTitle>
    //                 <AlertDescription>
    //                     <Text>Error deleting event.</Text>
    //                     <Code>{deleteEventResponse.error.message}</Code>
    //                 </AlertDescription>
    //             </Alert>
    //         ) : undefined}
    //         {deleteEventsResponse.error ? (
    //             <Alert status="error">
    //                 <AlertTitle>Error</AlertTitle>
    //                 <AlertDescription>
    //                     <Text>Error deleting events.</Text>
    //                     <Code>{deleteEventsResponse.error.message}</Code>
    //                 </AlertDescription>
    //             </Alert>
    //         ) : undefined}
    //         <HStack>
    //             <Center borderStyle="solid" borderWidth={1} borderColor={grey} borderRadius={5} p={2}>
    //                 <FAIcon icon="clock" iconStyle="s" mr={2} />
    //                 <Text as="span">Timezone: {localTimeZone}</Text>
    //             </Center>
    //             <LinkButton
    //                 linkProps={{ m: "3px" }}
    //                 to={`/conference/${conference.slug}/manage/rooms`}
    //                 colorScheme="yellow"
    //             >
    //                 Manage Rooms
    //             </LinkButton>
    //         </HStack>
    //         <VisuallyHidden>Timezone is {localTimeZone}</VisuallyHidden>
    //         <Table
    //             {...tableProps}
    //             display="block"
    //             maxWidth="100%"
    //             width="auto"
    //             size="sm"
    //             variant="striped"
    //             overflow="auto"
    //         >
    //             <Thead>
    //                 {headerGroups.map((headerGroup) => (
    //                     // eslint-disable-next-line react/jsx-key
    //                     <Tr {...headerGroup.getHeaderGroupProps()}>
    //                         {headerGroup.headers.map((column) => (
    //                             // eslint-disable-next-line react/jsx-key
    //                             <Th
    //                             >
    //                                 <VStack alignItems="flex-start" h="100%">
    //                                     <HStack
    //                                         h="100%"
    //                                         w="100%"
    //                                         spacing={2}
    //                                         alignItems="center"
    //                                     >
    //                                         {column.canGroupBy ? (
    //                                             // If the column can be grouped, let's add a toggle
    //                                             <Box {...column.getGroupByToggleProps()}>
    //                                                 {column.isGrouped ? (
    //                                                     <FAIcon iconStyle="s" icon="object-ungroup" />
    //                                                 ) : (
    //                                                     <FAIcon iconStyle="s" icon="object-group" />
    //                                                 )}
    //                                             </Box>
    //                                         ) : null}
    //                                         {/* Use column.getResizerProps to hook up the events correctly */}
    //                                         {column.canResize && (
    //                                             <>
    //                                                 <Spacer />
    //                                                 <Box
    //                                                     {...column.getResizerProps()}
    //                                                     style={{ touchAction: "none" }}
    //                                                     userSelect="none"
    //                                                     cursor="pointer"
    //                                                     color={column.isResizing ? "blue.400" : undefined}
    //                                                 >
    //                                                     <FAIcon iconStyle="s" icon="arrows-alt-h" />
    //                                                 </Box>
    //                                             </>
    //                                         )}
    //                                     </HStack>
    //                                 </VStack>
    //                             </Th>
    //                         ))}
    //                     </Tr>
    //                 ))}
    //             </Thead>
    //             <Tbody>
    //                 {page.map((row) => {
    //                     return (
    //                         // eslint-disable-next-line react/jsx-key
    //                         <Tr {...row.getRowProps()}>
    //                             {row.cells.map((cell) => {
    //                                 const bgColour = rowWarning(row) ? yellow : undefined;
    //                                 const cellProps = cell.getCellProps();
    //                                 if (bgColour) {
    //                                     cellProps.style = {
    //                                         ...(cellProps.style ?? {}),
    //                                         backgroundColor: bgColour ?? cellProps.style?.backgroundColor,
    //                                     };
    //                                 }
    //                                 return (
    //                                     // eslint-disable-next-line react/jsx-key
    //                                     <Td
    //                                         {...cellProps}
    //                                     >
    //                                         {cell.isGrouped ? (
    //                                             // If it's a grouped cell, add an expander and row count
    //                                             <HStack>
    //                                                 <chakra.span minW="min-content">({row.subRows.length})</chakra.span>
    //                                                 <chakra.span {...row.getToggleRowExpandedProps()}>
    //                                                     {row.isExpanded ? (
    //                                                         <FAIcon iconStyle="s" icon="caret-down" />
    //                                                     ) : (
    //                                                         <FAIcon iconStyle="s" icon="caret-right" />
    //                                                     )}
    //                                                 </chakra.span>{" "}
    //                                                 {cell.render("Cell", { editable: false })}
    //                                             </HStack>
    //                                         ) : cell.isAggregated ? (
    //                                             // If the cell is aggregated, use the Aggregated
    //                                             // renderer for cell
    //                                             cell.render("Aggregated")
    //                                         ) : cell.isPlaceholder ? null : ( // For cells with repeated values, render null
    //                                             // Otherwise, just render the regular cell
    //                                             cell.render("Cell", { editable: true })
    //                                         )}
    //                                     </Td>
    //                                 );
    //                             })}
    //                         </Tr>
    //                     );
    //                 })}
    //             </Tbody>
    //         </Table>

    const yellow = useColorModeValue("yellow.300", "yellow.700");
    const row: RowSpecification<EventInfoFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            colour: (record) => (rowWarning(record) ? yellow : undefined),
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
        }),
        [yellow]
    );

    const localTimeZone = useMemo(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }, []);

    const grey = useColorModeValue("gray.200", "gray.600");
    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    return (
        <>
            <HStack>
                <Center borderStyle="solid" borderWidth={1} borderColor={grey} borderRadius={5} p={2}>
                    <FAIcon icon="clock" iconStyle="s" mr={2} />
                    <Text as="span">Timezone: {localTimeZone}</Text>
                </Center>
                <LinkButton
                    linkProps={{ m: "3px" }}
                    to={`/conference/${conference.slug}/manage/rooms`}
                    colorScheme="yellow"
                >
                    Manage Rooms
                </LinkButton>
            </HStack>
            <VisuallyHidden>Timezone is {localTimeZone}</VisuallyHidden>
            <CRUDTable
                tableUniqueName="ManageConferenceSchedule"
                data={!wholeSchedule.loading && (wholeSchedule.data?.Event ? data : null)}
                columns={columns}
                row={row}
                edit={{
                    open: (key) => {
                        const idx = wholeSchedule.data?.Event.findIndex((event) => event.id === key);
                        const newIdx = idx !== undefined && idx !== -1 ? idx : null;
                        setEditingIndex(newIdx);
                        if (newIdx !== null) {
                            onSecondaryPanelOpen();
                        } else {
                            onSecondaryPanelClose();
                        }
                    },
                }}
                insert={{
                    ongoing: insertEventResponse.loading,
                    generateDefaults: () => ({
                        id: uuidv4(),
                        durationSeconds: 300,
                        conferenceId: conference.id,
                        intendedRoomModeName: RoomMode_Enum.Breakout,
                        name: "Innominate event",
                        roomId: wholeSchedule.data?.Room[0].id,
                        startTime: DateTime.local()
                            .plus({
                                minutes: 10,
                            })
                            .endOf("hour")
                            .plus({
                                milliseconds: 1,
                            })
                            .toISO(),
                        contentGroupId: null,
                        originatingDataId: null,
                    }),
                    makeWhole: (d) => d as EventInfoFragment,
                    start: (record) => {
                        insertEvent({
                            variables: record,
                            update: (cache, { data: _data }) => {
                                if (_data?.insert_Event_one) {
                                    const data = _data.insert_Event_one;
                                    cache.modify({
                                        fields: {
                                            Event(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data: {
                                                        ...data,
                                                        endTime: new Date(
                                                            Date.parse(data.startTime) + 1000 * data.durationSeconds
                                                        ).toISOString(),
                                                    },
                                                    fragment: EventInfoFragmentDoc,
                                                    fragmentName: "EventInfo",
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
                    ongoing: updateEventResponse.loading,
                    start: (record) => {
                        const variables: any = {
                            ...record,
                            eventId: record.id,
                        };
                        delete variables.id;
                        delete variables.endTime;
                        delete variables.eventPeople;
                        delete variables.eventTags;
                        delete variables.conferenceId;
                        delete variables.__typename;
                        updateEvent({
                            variables,
                            optimisticResponse: {
                                update_Event_by_pk: record,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.update_Event_by_pk) {
                                    const data = _data.update_Event_by_pk;
                                    cache.modify({
                                        fields: {
                                            Event(existingRefs: Reference[] = [], { readField }) {
                                                const newRef = cache.writeFragment({
                                                    data,
                                                    fragment: EventInfoFragmentDoc,
                                                    fragmentName: "EventInfo",
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
                    ongoing: deleteEventsResponse.loading,
                    start: (keys) => {
                        deleteEvents({
                            variables: {
                                eventIds: keys,
                            },
                            update: (cache, { data: _data }) => {
                                if (_data?.delete_Event) {
                                    const data = _data.delete_Event;
                                    const deletedIds = data.returning.map((x) => x.id);
                                    cache.modify({
                                        fields: {
                                            Event(existingRefs: Reference[] = [], { readField }) {
                                                deletedIds.forEach((x) => {
                                                    cache.evict({
                                                        id: x.id,
                                                        fieldName: "EventInfo",
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
                    insertEventResponse.error || updateEventResponse.error || deleteEventsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertEventResponse.error?.message ??
                                  updateEventResponse.error?.message ??
                                  deleteEventsResponse.error?.message ??
                                  "Unknown error",
                          }
                        : undefined
                }
                forceReload={forceReloadRef}
            />
            <EventSecondaryEditor
                yellowC={yellow}
                attendees={wholeSchedule.data?.Attendee ?? []}
                events={wholeSchedule.data?.Event ?? []}
                index={editingIndex}
                isSecondaryPanelOpen={isSecondaryPanelOpen}
                onSecondaryPanelClose={() => {
                    onSecondaryPanelClose();
                    setEditingIndex(null);
                }}
            />
        </>
    );
}

export default function ManageConferenceSchedulePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage schedule of ${conference.shortName}`);
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
                Events
            </Heading>
            <EditableScheduleTable />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function EventSecondaryEditor({
    events,
    attendees,
    isSecondaryPanelOpen,
    onSecondaryPanelClose,
    index,
    yellowC,
}: {
    events: readonly EventInfoFragment[];
    attendees: readonly AttendeeInfoFragment[];
    isSecondaryPanelOpen: boolean;
    onSecondaryPanelClose: () => void;
    index: number | null;
    yellowC: string;
}): JSX.Element {
    const event = index !== null ? events[index] : null;

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
                        {event ? (
                            <Accordion defaultIndex={[0]}>
                                <AccordionItem key="people">
                                    <AccordionButton>
                                        <Box flex="1" textAlign="left">
                                            People
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel>
                                        <EventPeopleEditorModal yellowC={yellowC} event={event} attendees={attendees} />
                                    </AccordionPanel>
                                </AccordionItem>
                            </Accordion>
                        ) : (
                            <>No event found.</>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </DrawerOverlay>
        </Drawer>
    );
}

function EventPeopleEditorModal({
    event,
    attendees,
    yellowC,
}: {
    event: EventInfoFragment;
    attendees: readonly AttendeeInfoFragment[];
    yellowC: string;
}) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const accordionContents = (
        <EventPersonsModal
            yellow={yellowC}
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            event={event}
            attendees={attendees}
        />
    );
    return accordionContents;
}
