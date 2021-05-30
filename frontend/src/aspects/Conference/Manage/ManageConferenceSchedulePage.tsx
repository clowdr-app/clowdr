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
    Code,
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
    useClipboard,
    useColorModeValue,
    useDisclosure,
    VisuallyHidden,
} from "@chakra-ui/react";
import { DateTime } from "luxon";
import React, { LegacyRef, Ref, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Content_ItemType_Enum,
    EventInfoFragment,
    EventInfoFragmentDoc,
    ExhibitionInfoFragment,
    ItemFullNestedInfoFragment,
    Permissions_Permission_Enum,
    ProgramPersonInfoFragment,
    RoomInfoFragment,
    Room_ManagementMode_Enum,
    Room_Mode_Enum,
    ShufflePeriodInfoFragment,
    useDeleteEventInfosMutation,
    useInsertEventInfoMutation,
    useManageSchedule_ShufflePeriodsQuery,
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
import { EventProgramPersonsModal, requiresEventPeople } from "./Schedule/EventProgramPersonsModal";

gql`
    query ManageSchedule_ShufflePeriods($conferenceId: uuid!, $now: timestamptz!) {
        room_ShufflePeriod(where: { conferenceId: { _eq: $conferenceId }, endAt: { _gt: $now } }) {
            ...ShufflePeriodInfo
        }
    }

    fragment ShufflePeriodInfo on room_ShufflePeriod {
        id
        name
    }

    mutation InsertEventInfo(
        $id: uuid!
        $roomId: uuid!
        $conferenceId: uuid!
        $intendedRoomModeName: room_Mode_enum!
        $originatingDataId: uuid = null
        $name: String!
        $startTime: timestamptz!
        $durationSeconds: Int!
        $itemId: uuid = null
        $exhibitionId: uuid = null
        $shufflePeriodId: uuid = null
    ) {
        insert_schedule_Event_one(
            object: {
                id: $id
                roomId: $roomId
                conferenceId: $conferenceId
                intendedRoomModeName: $intendedRoomModeName
                originatingDataId: $originatingDataId
                name: $name
                startTime: $startTime
                durationSeconds: $durationSeconds
                itemId: $itemId
                exhibitionId: $exhibitionId
                shufflePeriodId: $shufflePeriodId
            }
        ) {
            ...EventInfo
        }
    }

    mutation UpdateEventInfo(
        $eventId: uuid!
        $roomId: uuid!
        $intendedRoomModeName: room_Mode_enum!
        $originatingDataId: uuid = null
        $name: String!
        $startTime: timestamptz!
        $durationSeconds: Int!
        $itemId: uuid = null
        $exhibitionId: uuid = null
        $shufflePeriodId: uuid = null
    ) {
        update_schedule_Event_by_pk(
            pk_columns: { id: $eventId }
            _set: {
                roomId: $roomId
                intendedRoomModeName: $intendedRoomModeName
                originatingDataId: $originatingDataId
                name: $name
                startTime: $startTime
                durationSeconds: $durationSeconds
                itemId: $itemId
                exhibitionId: $exhibitionId
                shufflePeriodId: $shufflePeriodId
            }
        ) {
            ...EventInfo
        }
    }

    mutation DeleteEventInfos($eventIds: [uuid!]!) {
        delete_schedule_Event(where: { id: { _in: $eventIds } }) {
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
    Exhibition = "exhibition",
    ShufflePeriod = "shufflePeriod",
}

function rowWarning(row: EventInfoFragment) {
    if (requiresEventPeople(row)) {
        return "This event will be live streamed but no Event People have been assigned to manage it.";
    }
    return undefined;
}

function isOngoingNearBoundary(
    now: number,
    startLeeway: number,
    endLeeway: number,
    start: number,
    end: number
): boolean {
    return (
        (start - startLeeway <= now && now <= start + startLeeway) || (end - endLeeway <= now && now <= end + endLeeway)
    );
}

function isOngoing(now: number, startLeeway: number, endLeeway: number, start: number, end: number): boolean {
    return start - startLeeway <= now && now <= end + endLeeway;
}

function areOverlapping(start1: number, end1: number, start2: number, end2: number) {
    return start1 < end2 && start2 < end1;
}

const liveStreamRoomModes: Room_Mode_Enum[] = [
    Room_Mode_Enum.Prerecorded,
    Room_Mode_Enum.Presentation,
    Room_Mode_Enum.QAndA,
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
    const data = useMemo(() => [...(wholeSchedule.data?.schedule_Event ?? [])], [wholeSchedule.data?.schedule_Event]);

    const shufflePeriodsNow = useMemo(() => new Date().toISOString(), []);
    const shufflePeriodsResponse = useManageSchedule_ShufflePeriodsQuery({
        variables: {
            conferenceId: conference.id,
            now: shufflePeriodsNow,
        },
    });
    const shufflePeriodOptions = useMemo(
        () =>
            shufflePeriodsResponse.data?.room_ShufflePeriod
                ? [...shufflePeriodsResponse.data.room_ShufflePeriod]
                      .sort((x, y) => x.name.localeCompare(y.name))
                      .map((period) => (
                          <option key={period.id} value={period.id}>
                              {period.name}
                          </option>
                      ))
                : [],
        [shufflePeriodsResponse.data?.room_ShufflePeriod]
    );

    const roomOptions = useMemo(
        () =>
            wholeSchedule.data?.room_Room
                ? [...wholeSchedule.data.room_Room]
                      .filter(
                          (room) =>
                              (!room.originatingItemId ||
                                  wholeSchedule.data?.content_Item.some(
                                      (x) =>
                                          x.id === room.originatingItemId &&
                                          x.typeName === Content_ItemType_Enum.Sponsor
                                  )) &&
                              !room.originatingEventId &&
                              room.managementModeName !== Room_ManagementMode_Enum.Dm &&
                              room.managementModeName !== Room_ManagementMode_Enum.Managed
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
        [wholeSchedule.data?.room_Room, wholeSchedule.data?.content_Item]
    );

    const roomModeOptions = useMemo(
        () =>
            Object.keys(Room_Mode_Enum)
                .sort((x, y) => x.localeCompare(y))
                .map((x) => {
                    const v = (Room_Mode_Enum as any)[x];
                    return { value: v, label: formatEnumValue(v) };
                }),
        []
    );

    const itemOptions = useMemo(
        () =>
            wholeSchedule.data?.content_Item
                ? [...wholeSchedule.data.content_Item]
                      .sort((x, y) => x.title.localeCompare(y.title))
                      .map((content) => {
                          return (
                              <option key={content.id} value={content.id}>
                                  {content.title}
                              </option>
                          );
                      })
                : undefined,
        [wholeSchedule.data?.content_Item]
    );

    const exhibitionOptions = useMemo(
        () =>
            wholeSchedule.data?.collection_Exhibition
                ? [...wholeSchedule.data.collection_Exhibition]
                      .sort((x, y) => x.name.localeCompare(y.name))
                      .map((exhibition) => {
                          return (
                              <option key={exhibition.id} value={exhibition.id}>
                                  {exhibition.name}
                              </option>
                          );
                      })
                : undefined,
        [wholeSchedule.data?.collection_Exhibition]
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
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
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
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
                    const ongoing = isOngoingNearBoundary(now, startLeeway, endLeeway, start, end);
                    const past = end < now - endLeeway;
                    const isLivestream = props.staleRecord.intendedRoomModeName
                        ? liveStreamRoomModes.includes(props.staleRecord.intendedRoomModeName)
                        : false;

                    return (
                        <HStack>
                            {!props.isInCreate && past && isLivestream ? (
                                <Tooltip label="You cannot edit the end time of a past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            {!props.isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the end time of an ongoing livestream event within 5 minutes of its start or 4 minutes of its end.">
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
                get: (data) => wholeSchedule.data?.room_Room.find((room) => room.id === data.roomId),
                set: (record, v: RoomInfoFragment | undefined) => {
                    record.roomId = v?.id;
                },
                sort: (x: RoomInfoFragment | undefined, y: RoomInfoFragment | undefined) => {
                    return x && y ? x.name.localeCompare(y.name) : x ? 1 : y ? -1 : 0;
                },
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => {
                        return (
                            wholeSchedule.data?.room_Room
                                .find((room) => room.id === row.roomId)
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
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
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
                                        wholeSchedule.data?.room_Room.find((room) => room.id === ev.target.value)
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
                                        {wholeSchedule.data?.room_Room.find((x) => x.id === props.value?.id)?.name}
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
                set: (record, v: Room_Mode_Enum) => {
                    record.intendedRoomModeName = v;
                },
                filterFn: (rows, v: Room_Mode_Enum) => rows.filter((r) => r.intendedRoomModeName === v),
                filterEl: SelectColumnFilter(Object.values(Room_Mode_Enum)),
                sort: (x: Room_Mode_Enum, y: Room_Mode_Enum) => x.localeCompare(y),
                cell: function RoomModeCell(props: CellProps<Partial<EventInfoFragment>, Room_Mode_Enum | undefined>) {
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end);

                    return (
                        <HStack>
                            {now < start ? (
                                <Tooltip label="Live-stream modes must be set at least 10 minutes in advance of an event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={props.value ?? ""}
                                onChange={(ev) => props.onChange?.(ev.target.value as Room_Mode_Enum)}
                                onBlur={props.onBlur}
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
                get: (data) => wholeSchedule.data?.content_Item.find((room) => room.id === data.itemId),
                set: (record, value: ItemFullNestedInfoFragment | undefined) => {
                    record.itemId = value?.id;
                },
                sortType: (rowA: ItemFullNestedInfoFragment, rowB: ItemFullNestedInfoFragment) => {
                    const compared = rowA && rowB ? rowA.title.localeCompare(rowB.title) : rowA ? 1 : rowB ? -1 : 0;
                    return compared;
                },
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => {
                        return (
                            (row.itemId &&
                                wholeSchedule.data?.content_Item
                                    .find((room) => room.id === row.itemId)
                                    ?.title.toLowerCase()
                                    .includes(filterValue.toLowerCase())) ??
                            false
                        );
                    });
                },
                filterEl: TextColumnFilter,
                cell: function ContentCell(
                    props: CellProps<Partial<EventInfoFragment>, ItemFullNestedInfoFragment | undefined>
                ) {
                    const now = useRealTime(10000);
                    const start = props.staleRecord.startTime ? Date.parse(props.staleRecord.startTime) : Date.now();
                    const end = start + 1000 * (props.staleRecord.durationSeconds ?? 300);
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
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
                                        wholeSchedule.data?.content_Item.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={props.onBlur}
                                isDisabled={!props.isInCreate && (ongoing || past) && isLivestream}
                                ref={props.ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                <option value={""}>{"<None selected>"}</option>
                                {itemOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.Exhibition,
                header: function ExhibitionHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Exhibition (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Exhibition{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) =>
                    wholeSchedule.data?.collection_Exhibition.find((exhibition) => exhibition.id === data.exhibitionId),
                set: (record, value: ExhibitionInfoFragment | undefined) => {
                    record.exhibitionId = value?.id;
                },
                sortType: (rowA: ExhibitionInfoFragment, rowB: ExhibitionInfoFragment) => {
                    const compared = rowA && rowB ? rowA.name.localeCompare(rowB.name) : rowA ? 1 : rowB ? -1 : 0;
                    return compared;
                },
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => {
                        return (
                            (row.exhibitionId &&
                                wholeSchedule.data?.collection_Exhibition
                                    .find((exhibition) => exhibition.id === row.exhibitionId)
                                    ?.name.toLowerCase()
                                    .includes(filterValue.toLowerCase())) ??
                            false
                        );
                    });
                },
                filterEl: TextColumnFilter,
                cell: function ExhibitionCell(
                    props: CellProps<Partial<EventInfoFragment>, ExhibitionInfoFragment | undefined>
                ) {
                    return (
                        <HStack>
                            {props.value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`/conference/${conference.slug}/exhibition/${props.value.id}`}
                                    size="xs"
                                    aria-label="Go to exhibition in new tab"
                                >
                                    <Tooltip label="Go to exhibition in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            <Select
                                value={props.value?.id ?? ""}
                                onChange={(ev) =>
                                    props.onChange?.(
                                        wholeSchedule.data?.collection_Exhibition.find(
                                            (room) => room.id === ev.target.value
                                        )
                                    )
                                }
                                onBlur={props.onBlur}
                                ref={props.ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                <option value={""}>{"<None selected>"}</option>
                                {exhibitionOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.ShufflePeriod,
                header: function ShufflePeriodHeader(props: ColumnHeaderProps<EventInfoFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Shuffle Period (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Shuffle Period{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) =>
                    shufflePeriodsResponse.data?.room_ShufflePeriod.find(
                        (shufflePeriod) => shufflePeriod.id === data.shufflePeriodId
                    ),
                set: (record, value: ShufflePeriodInfoFragment | undefined) => {
                    record.shufflePeriodId = value?.id;
                },
                sortType: (rowA: ShufflePeriodInfoFragment, rowB: ShufflePeriodInfoFragment) => {
                    const compared = rowA && rowB ? rowA.name.localeCompare(rowB.name) : rowA ? 1 : rowB ? -1 : 0;
                    return compared;
                },
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => {
                        return (
                            (row.shufflePeriodId &&
                                shufflePeriodsResponse.data?.room_ShufflePeriod
                                    .find((shufflePeriod) => shufflePeriod.id === row.shufflePeriodId)
                                    ?.name.toLowerCase()
                                    .includes(filterValue.toLowerCase())) ??
                            false
                        );
                    });
                },
                filterEl: TextColumnFilter,
                cell: function ShufflePeriodCell(
                    props: CellProps<Partial<EventInfoFragment>, ShufflePeriodInfoFragment | undefined>
                ) {
                    return (
                        <HStack>
                            {props.value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`/conference/${conference.slug}/manage/shuffle`}
                                    size="xs"
                                    aria-label="Go to shuffle period in new tab"
                                >
                                    <Tooltip label="Go to shuffle period in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            <Select
                                value={props.value?.id ?? ""}
                                onChange={(ev) =>
                                    props.onChange?.(
                                        shufflePeriodsResponse.data?.room_ShufflePeriod.find(
                                            (room) => room.id === ev.target.value
                                        )
                                    )
                                }
                                onBlur={props.onBlur}
                                ref={props.ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                <option value={""}>{"<None selected>"}</option>
                                {shufflePeriodOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
        ],
        [
            wholeSchedule.data?.room_Room,
            wholeSchedule.data?.content_Item,
            wholeSchedule.data?.collection_Exhibition,
            shufflePeriodsResponse.data?.room_ShufflePeriod,
            conference.slug,
            roomOptions,
            roomModeOptions,
            itemOptions,
            exhibitionOptions,
            shufflePeriodOptions,
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
                const startLeeway = 9.9 * 60 * 1000;
                const endLeeway = 4 * 60 * 1000;
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

                if (!record.name && !record.itemId && !record.exhibitionId) {
                    return {
                        reason: "Event must have a name, content or exhibition.",
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
                const startLeeway = 5 * 60 * 1000;
                const endLeeway = 4 * 60 * 1000;
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
                const startLeeway = 5 * 60 * 1000;
                const endLeeway = 4 * 60 * 1000;
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
                const idx = wholeSchedule.data?.schedule_Event.findIndex((event) => event.id === key);
                const newIdx = idx !== undefined && idx !== -1 ? idx : null;
                setEditingIndex(newIdx);
                if (newIdx !== null) {
                    onSecondaryPanelOpen();
                } else {
                    onSecondaryPanelClose();
                }
            },
        }),
        [onSecondaryPanelClose, onSecondaryPanelOpen, wholeSchedule.data?.schedule_Event]
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
                          intendedRoomModeName: Room_Mode_Enum.Breakout,
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
                          itemId: null,
                          exhibitionId: null,
                          shufflePeriodId: null,
                          originatingDataId: null,
                      }),
                      makeWhole: (d) => d as EventInfoFragment,
                      start: (record) => {
                          insertEvent({
                              variables: record,
                              update: (cache, { data: _data }) => {
                                  if (_data?.insert_schedule_Event_one) {
                                      const data = _data.insert_schedule_Event_one;
                                      cache.modify({
                                          fields: {
                                              schedule_Event(existingRefs: Reference[] = [], { readField }) {
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
                        update_schedule_Event_by_pk: record,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.update_schedule_Event_by_pk) {
                            const data = _data.update_schedule_Event_by_pk;
                            cache.modify({
                                fields: {
                                    schedule_Event(existingRefs: Reference[] = [], { readField }) {
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
                        if (_data?.delete_schedule_Event) {
                            const data = _data.delete_schedule_Event;
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
            <HStack flexWrap="wrap" maxW="100%" justifyContent="center" gridRowGap={2}>
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
            {wholeSchedule.data?.room_Room && wholeSchedule.data.room_Room.length === 0 ? (
                <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>No rooms</AlertTitle>
                    <AlertDescription>Please create a room first.</AlertDescription>
                </Alert>
            ) : undefined}
            <CRUDTable
                tableUniqueName="ManageConferenceSchedule"
                data={!wholeSchedule.loading && (wholeSchedule.data?.schedule_Event ? data : null)}
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
                programPeople={wholeSchedule.data?.collection_ProgramPerson ?? []}
                events={wholeSchedule.data?.schedule_Event ?? []}
                index={editingIndex}
                isSecondaryPanelOpen={isSecondaryPanelOpen}
                onSecondaryPanelClose={() => {
                    onSecondaryPanelClose();
                    setEditingIndex(null);
                    forceReloadRef.current?.();
                }}
            />
            <BatchAddEventPeople
                events={data}
                rooms={wholeSchedule.data?.room_Room ?? []}
                {...batchAddPeopleDisclosure}
            />
        </>
    );
}

export default function ManageConferenceSchedulePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage schedule of ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="2xl" fontStyle="italic">
                Events
            </Heading>
            <EditableScheduleTable />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function EventSecondaryEditor({
    events,
    programPeople,
    isSecondaryPanelOpen,
    onSecondaryPanelClose,
    index,
    yellowC,
}: {
    events: readonly EventInfoFragment[];
    programPeople: readonly ProgramPersonInfoFragment[];
    isSecondaryPanelOpen: boolean;
    onSecondaryPanelClose: () => void;
    index: number | null;
    yellowC: string;
}): JSX.Element {
    const event = index !== null ? events[index] : null;

    const { onCopy: onCopyEventId, hasCopied: hasCopiedEventId } = useClipboard(event?.id ?? "");
    const { onCopy: onCopyItemId, hasCopied: hasCopiedItemId } = useClipboard(event?.itemId ?? "");

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
                    <DrawerHeader pb={0} pr="3em">
                        {event ? (
                            <>
                                <Text fontSize="lg" overflow="wrap">
                                    Edit event: {event.name}
                                </Text>
                                <Text fontSize="xs" mt={2}>
                                    Event: <Code fontSize="xs">{event.id}</Code>
                                    <Button
                                        onClick={onCopyEventId}
                                        size="xs"
                                        ml="auto"
                                        variant="ghost"
                                        p={0}
                                        h="auto"
                                        minH={0}
                                        aria-label="Copy event id"
                                    >
                                        <FAIcon
                                            iconStyle="s"
                                            icon={hasCopiedEventId ? "check-circle" : "clipboard"}
                                            m={0}
                                            p={0}
                                        />
                                    </Button>
                                </Text>
                                {event.itemId ? (
                                    <Text fontSize="xs" mt={1}>
                                        Item:&nbsp;&nbsp;&nbsp;<Code fontSize="xs">{event.itemId}</Code>
                                        <Button
                                            onClick={onCopyItemId}
                                            size="xs"
                                            ml="auto"
                                            variant="ghost"
                                            p={0}
                                            h="auto"
                                            minH={0}
                                            aria-label="Copy item id"
                                        >
                                            <FAIcon
                                                iconStyle="s"
                                                icon={hasCopiedItemId ? "check-circle" : "clipboard"}
                                                m={0}
                                                p={0}
                                            />
                                        </Button>
                                    </Text>
                                ) : undefined}
                            </>
                        ) : (
                            "No event"
                        )}
                    </DrawerHeader>

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
                                            programPeople={programPeople}
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
    programPeople,
    yellowC,
}: {
    event: EventInfoFragment;
    programPeople: readonly ProgramPersonInfoFragment[];
    yellowC: string;
}) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const accordionContents = (
        <EventProgramPersonsModal
            yellow={yellowC}
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            event={event}
            programPeople={programPeople}
        />
    );
    return accordionContents;
}
