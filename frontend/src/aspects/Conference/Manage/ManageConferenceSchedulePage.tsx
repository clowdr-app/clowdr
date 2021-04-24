import { gql, Reference } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
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
import React, { LegacyRef, Ref, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ContentGroupFullNestedInfoFragment,
    ContentPersonInfoFragment,
    EventInfoFragment,
    EventInfoFragmentDoc,
    HallwayInfoFragment,
    Permission_Enum,
    RoomInfoFragment,
    RoomMode_Enum,
    RoomPrivacy_Enum,
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
import BatchAddEventPeople from "./Schedule/BatchAddEventPeople";
import { EventPersonsModal, requiresEventPeople } from "./Schedule/EventPersonsModal";

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
        $hallwayId: uuid = null
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
                hallwayId: $hallwayId
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
        $hallwayId: uuid = null
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
                hallwayId: $hallwayId
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
    Hallway = "hallway",
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

function areOverlapping(start1: number, end1: number, start2: number, end2: number) {
    return start1 < end2 && start2 < end1;
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
                      .filter(
                          (room) =>
                              !room.originatingContentGroupId &&
                              !room.originatingEventId &&
                              room.roomPrivacyName !== RoomPrivacy_Enum.Dm &&
                              room.roomPrivacyName !== RoomPrivacy_Enum.Managed
                      )
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

    const hallwayOptions = useMemo(
        () =>
            wholeSchedule.data?.Hallway
                ? [...wholeSchedule.data.Hallway]
                      .sort((x, y) => x.name.localeCompare(y.name))
                      .map((hallway) => {
                          return (
                              <option key={hallway.id} value={hallway.id}>
                                  {hallway.name}
                              </option>
                          );
                      })
                : undefined,
        [wholeSchedule.data?.Hallway]
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
                    record.startTime = v.toISOString() as any;
                },
                filterFn: dateTimeFilterFn(["startTime"]),
                filterEl: DateTimeColumnFilter,
                sort: (x: Date, y: Date) => x.getTime() - y.getTime(),
                cell: function StartTimeCell(props: CellProps<Partial<EventInfoFragment>, Date | undefined>) {
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 10 * 60 * 1000;
                    const endLeeway = 1 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                    const past = end < now - endLeeway;
                    const isLivestream = props.staleRecord.intendedRoomModeName
                        ? liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                        : false;

                    return (
                        <HStack>
                            {!props.isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the start time of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <DateTimePicker
                                size="sm"
                                value={props.value}
                                onChange={(v: Date | undefined) => {
                                    props.onChange?.(v);
                                }}
                                onBlur={props.onBlur}
                                isDisabled={!props.isInCreate && (past || ongoing) && isLivestream}
                                ref={props.ref as Ref<HTMLInputElement>}
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
                    const start = record.startTime ? Date.parse((record.startTime as unknown) as string) : Date.now();
                    record.durationSeconds = Math.max(60, Math.round((v.getTime() - start) / 1000));
                },
                filterFn: dateTimeFilterFn(["endTime"]),
                filterEl: DateTimeColumnFilter,
                sort: (x: Date, y: Date) => x.getTime() - y.getTime(),
                cell: function EndTimeCell(props: CellProps<Partial<EventInfoFragment>, Date | undefined>) {
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 10 * 60 * 1000;
                    const endLeeway = 1 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                    const past = end < now - endLeeway;
                    const isLivestream = props.staleRecord.intendedRoomModeName
                        ? liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                        : false;

                    return (
                        <HStack>
                            {!props.isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the end time of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <DateTimePicker
                                size="sm"
                                value={props.value}
                                onChange={(v: Date | undefined) => {
                                    props.onChange?.(v);
                                }}
                                onBlur={props.onBlur}
                                isDisabled={!props.isInCreate && (past || ongoing) && isLivestream}
                                ref={props.ref as Ref<HTMLInputElement>}
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
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 10 * 60 * 1000;
                    const endLeeway = 1 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                    const past = end < now - endLeeway;
                    const isLivestream = props.staleRecord.intendedRoomModeName
                        ? liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                        : false;

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
                            {!props.isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the room of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={props.value?.id ?? ""}
                                onChange={(ev) =>
                                    props.onChange?.(
                                        wholeSchedule.data?.Room.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={props.onBlur}
                                isDisabled={!props.isInCreate && (ongoing || past) && isLivestream}
                                ref={props.ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                {roomOptions}
                                {props.value &&
                                !roomOptions?.some((option) => option.props.value === props.value?.id) ? (
                                    <option key={props.value.id} value={props.value.id}>
                                        {wholeSchedule.data?.Room.find((x) => x.id === props.value?.id)?.name}
                                    </option>
                                ) : undefined}
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
                    record.intendedRoomModeName = v;
                },
                filterFn: (rows, v: RoomMode_Enum) => rows.filter((r) => r.intendedRoomModeName === v),
                filterEl: SelectColumnFilter(Object.values(RoomMode_Enum)),
                sort: (x: RoomMode_Enum, y: RoomMode_Enum) => x.localeCompare(y),
                cell: function RoomModeCell(props: CellProps<Partial<EventInfoFragment>, RoomMode_Enum | undefined>) {
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 10 * 60 * 1000;
                    const endLeeway = 1 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                    const past = end < now - endLeeway;
                    const isLivestream = props.staleRecord.intendedRoomModeName
                        ? liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                        : false;

                    return (
                        <HStack>
                            {now < start ? (
                                <Tooltip label="Live-stream modes must be set at least 10 minutes in advance of an event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            {!props.isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the mode of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={props.value ?? ""}
                                onChange={(ev) => props.onChange?.(ev.target.value as RoomMode_Enum)}
                                onBlur={props.onBlur}
                                isDisabled={!props.isInCreate && (ongoing || past) && isLivestream}
                                ref={props.ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
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
                            ref={props.ref as LegacyRef<HTMLInputElement>}
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
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 10 * 60 * 1000;
                    const endLeeway = 1 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                    const past = end < now - endLeeway;
                    const isLivestream = props.staleRecord.intendedRoomModeName
                        ? liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                        : false;

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
                            {!props.isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the content of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={props.value?.id ?? ""}
                                onChange={(ev) =>
                                    props.onChange?.(
                                        wholeSchedule.data?.ContentGroup.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={props.onBlur}
                                isDisabled={!props.isInCreate && (ongoing || past) && isLivestream}
                                ref={props.ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                <option value={""}>{"<None selected>"}</option>
                                {contentGroupOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.Hallway,
                header: function HallwayHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Exhibition (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Exhibition{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => wholeSchedule.data?.Hallway.find((hallway) => hallway.id === data.hallwayId),
                set: (record, value: HallwayInfoFragment | undefined) => {
                    record.hallwayId = value?.id;
                },
                sortType: (rowA: HallwayInfoFragment, rowB: HallwayInfoFragment) => {
                    const compared = rowA && rowB ? rowA.name.localeCompare(rowB.name) : rowA ? 1 : rowB ? -1 : 0;
                    return compared;
                },
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => {
                        return (
                            (row.hallwayId &&
                                wholeSchedule.data?.Hallway.find((hallway) => hallway.id === row.hallwayId)
                                    ?.name.toLowerCase()
                                    .includes(filterValue.toLowerCase())) ??
                            false
                        );
                    });
                },
                filterEl: TextColumnFilter,
                cell: function HallwayCell(
                    props: CellProps<Partial<EventInfoFragment>, HallwayInfoFragment | undefined>
                ) {
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 10 * 60 * 1000;
                    const endLeeway = 1 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                    const past = end < now - endLeeway;
                    const isLivestream = props.staleRecord.intendedRoomModeName
                        ? liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                        : false;

                    return (
                        <HStack>
                            {props.value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`/conference/${conference.slug}/hallway/${props.value.id}`}
                                    size="xs"
                                    aria-label="Go to hallway in new tab"
                                >
                                    <Tooltip label="Go to hallway in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            {!props.isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the hallway of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={props.value?.id ?? ""}
                                onChange={(ev) =>
                                    props.onChange?.(
                                        wholeSchedule.data?.Hallway.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={props.onBlur}
                                isDisabled={!props.isInCreate && (ongoing || past) && isLivestream}
                                ref={props.ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                <option value={""}>{"<None selected>"}</option>
                                {hallwayOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
        ],
        [
            conference.slug,
            contentGroupOptions,
            hallwayOptions,
            roomModeOptions,
            roomOptions,
            wholeSchedule.data?.ContentGroup,
            wholeSchedule.data?.Room,
            wholeSchedule.data?.Hallway,
        ]
    );

    const yellow = useColorModeValue("yellow.300", "yellow.700");
    const row: RowSpecification<EventInfoFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            colour: (record) => (rowWarning(record) ? yellow : undefined),
            warning: (record) => rowWarning(record),
            invalid: (record, isNew, dependentData) => {
                const start = record.startTime ? Date.parse(record.startTime) : Date.now();
                const end = start + 1000 * (record.durationSeconds ?? 300);
                const now = Date.now();
                const startLeeway = 10 * 60 * 1000;
                const endLeeway = 1 * 60 * 1000;
                const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                const past = end < now - endLeeway;
                const isLivestream = record.intendedRoomModeName
                    ? liveStreamRoomModes.includes(record.intendedRoomModeName)
                    : false;
                if (isNew && isLivestream && (ongoing || past)) {
                    return {
                        reason: "Cannot create a livestream event that is already ongoing or in the past.",
                        columnId: ColumnId.StartTime,
                    };
                }

                if (!record.name && !record.contentGroupId && !record.hallwayId) {
                    return {
                        reason: "Event must have a name, content or hallway.",
                        columnId: ColumnId.Name,
                    };
                }

                if (record.roomId) {
                    const eventsInSameRoom = [...dependentData.entries()].filter(
                        ([id, x]) => x[ColumnId.Room]?.id === record.roomId && id !== record.id
                    );
                    if (
                        eventsInSameRoom.some(([_, event]) => {
                            const startE = event.startTime.getTime();
                            const endE = event.endTime.getTime();
                            return areOverlapping(start, end, startE, endE);
                        })
                    ) {
                        return {
                            reason: "Events in a room cannot overlap.",
                            columnId: ColumnId.StartTime,
                        };
                    }
                }

                return false;
            },
            canSelect: (record) => {
                const start = record.startTime ? Date.parse(record.startTime) : Date.now();
                const end = start + 1000 * (record.durationSeconds ?? 300);
                const now = Date.now();
                const startLeeway = 10 * 60 * 1000;
                const endLeeway = 1 * 60 * 1000;
                const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                const isLivestream = record.intendedRoomModeName
                    ? liveStreamRoomModes.includes(record.intendedRoomModeName)
                    : false;
                return !(ongoing && isLivestream) ? true : "Cannot delete an ongoing livestream event.";
            },
            canDelete: (record) => {
                const start = record.startTime ? Date.parse(record.startTime) : Date.now();
                const end = start + 1000 * (record.durationSeconds ?? 300);
                const now = Date.now();
                const startLeeway = 10 * 60 * 1000;
                const endLeeway = 1 * 60 * 1000;
                const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);
                const isLivestream = record.intendedRoomModeName
                    ? liveStreamRoomModes.includes(record.intendedRoomModeName)
                    : false;
                return !(ongoing && isLivestream) ? true : "Cannot delete an ongoing livestream event.";
            },
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

    useEffect(() => {
        if (insertEventResponse.error || updateEventResponse.error || deleteEventsResponse.error) {
            forceReloadRef.current?.();
        }
    }, [deleteEventsResponse.error, insertEventResponse.error, updateEventResponse.error]);

    const edit:
        | {
              open: (key: string) => void;
          }
        | undefined = useMemo(
        () => ({
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
        }),
        [onSecondaryPanelClose, onSecondaryPanelOpen, wholeSchedule.data?.Event]
    );

    const insert:
        | {
              generateDefaults: () => Partial<EventInfoFragment>;
              makeWhole: (partialRecord: Partial<EventInfoFragment>) => EventInfoFragment | undefined;
              start: (record: EventInfoFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () =>
            roomOptions && roomOptions.length > 0
                ? {
                      ongoing: insertEventResponse.loading,
                      generateDefaults: () => ({
                          id: uuidv4(),
                          durationSeconds: 300,
                          conferenceId: conference.id,
                          intendedRoomModeName: RoomMode_Enum.Breakout,
                          name: "Innominate event",
                          roomId: roomOptions[0].props.value,
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
                          hallwayId: null,
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
                  }
                : undefined,
        [conference.id, insertEvent, insertEventResponse.loading, roomOptions]
    );

    const update:
        | {
              start: (record: EventInfoFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
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
        }),
        [updateEvent, updateEventResponse.loading]
    );

    const deleteProps:
        | {
              start: (keys: string[]) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
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
                            deletedIds.forEach((x) => {
                                cache.evict({
                                    id: x.id,
                                    fieldName: "EventInfo",
                                    broadcast: true,
                                });
                            });
                        }
                    },
                });
            },
        }),
        [deleteEvents, deleteEventsResponse.loading]
    );

    const batchAddPeopleDisclosure = useDisclosure();

    const pageSizes = useMemo(() => [5, 10, 15, 20], []);

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
                <Button onClick={batchAddPeopleDisclosure.onOpen}>Add people to events (batch)</Button>
            </HStack>
            <VisuallyHidden>Timezone is {localTimeZone}</VisuallyHidden>
            {wholeSchedule.data?.Room && wholeSchedule.data.Room.length === 0 ? (
                <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>No rooms</AlertTitle>
                    <AlertDescription>Please create a room first.</AlertDescription>
                </Alert>
            ) : undefined}
            <CRUDTable
                tableUniqueName="ManageConferenceSchedule"
                data={!wholeSchedule.loading && (wholeSchedule.data?.Event ? data : null)}
                columns={columns}
                row={row}
                edit={edit}
                insert={insert}
                update={update}
                delete={deleteProps}
                pageSizes={pageSizes}
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
                contentPeople={wholeSchedule.data?.ContentPerson ?? []}
                events={wholeSchedule.data?.Event ?? []}
                index={editingIndex}
                isSecondaryPanelOpen={isSecondaryPanelOpen}
                onSecondaryPanelClose={() => {
                    onSecondaryPanelClose();
                    setEditingIndex(null);
                    forceReloadRef.current?.();
                }}
            />
            <BatchAddEventPeople events={data} rooms={wholeSchedule.data?.Room ?? []} {...batchAddPeopleDisclosure} />
        </>
    );
}

export default function ManageConferenceSchedulePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage schedule of ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="2xl" fontStyle="italic">
                Events
            </Heading>
            <EditableScheduleTable />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function EventSecondaryEditor({
    events,
    contentPeople,
    isSecondaryPanelOpen,
    onSecondaryPanelClose,
    index,
    yellowC,
}: {
    events: readonly EventInfoFragment[];
    contentPeople: readonly ContentPersonInfoFragment[];
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
                                        <EventPeopleEditorModal
                                            yellowC={yellowC}
                                            event={event}
                                            contentPeople={contentPeople}
                                        />
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
    contentPeople,
    yellowC,
}: {
    event: EventInfoFragment;
    contentPeople: readonly ContentPersonInfoFragment[];
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
            contentPeople={contentPeople}
        />
    );
    return accordionContents;
}
