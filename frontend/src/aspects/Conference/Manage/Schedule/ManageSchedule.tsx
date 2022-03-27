import { ChevronDownIcon } from "@chakra-ui/icons";
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
    Checkbox,
    Code,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    FormLabel,
    HStack,
    Input,
    Menu,
    MenuButton,
    MenuGroup,
    MenuItem,
    MenuList,
    Select,
    Text,
    Tooltip,
    useClipboard,
    useColorModeValue,
    useDisclosure,
    VisuallyHidden,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import { DateTime } from "luxon";
import Papa from "papaparse";
import type { LegacyRef, Ref } from "react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
    EventInfoFragment,
    ExhibitionInfoFragment,
    ItemFullNestedInfoFragment,
    ProgramPersonInfoFragment,
    RoomInfoFragment,
    ShufflePeriodInfoFragment,
} from "../../../../generated/graphql";
import {
    Content_ItemType_Enum,
    Room_ManagementMode_Enum,
    Schedule_Mode_Enum,
    useDeleteEventInfosMutation,
    useInsertEventInfoMutation,
    useManageSchedule_ShufflePeriodsQuery,
    useSelectWholeScheduleQuery,
    useUpdateEventInfoMutation,
} from "../../../../generated/graphql";
import { useAppSettings } from "../../../App";
import FAIcon from "../../../Chakra/FAIcon";
import { LinkButton } from "../../../Chakra/LinkButton";
import { DateTimePicker } from "../../../CRUDTable/DateTimePicker";
import {
    CheckBoxColumnFilter,
    DateTimeColumnFilter,
    dateTimeFilterFn,
    formatEnumValue,
    SelectColumnFilter,
    TextColumnFilter,
} from "../../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    ExtraButton,
    RowSpecification,
} from "../../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../../CRUDTable2/CRUDTable2";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
import { useRealTime } from "../../../Hooks/useRealTime";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import BatchAddEventPeople from "./BatchAddEventPeople";
import ContinuationsEditor from "./ContinuationsEditor";
import EditStreamTextIntegration from "./EditStreamTextIntegration";
import { EventProgramPersonsModal, requiresEventPeople } from "./EventProgramPersonsModal";

gql`
    fragment RoomInfo on room_Room {
        capacity
        conferenceId
        subconferenceId
        id
        name
        priority
        itemId
        managementModeName
        isProgramRoom
    }

    fragment ElementInfo on content_Element {
        conferenceId
        subconferenceId
        itemId
        typeName
        data
        id
        isHidden
        layoutData
        name
        uploadsRemaining
    }

    fragment ProgramPersonInfo on collection_ProgramPerson {
        id
        conferenceId
        subconferenceId
        name
        affiliation
        email
        registrantId
    }

    fragment ItemTagInfo on content_ItemTag {
        id
        tagId
        itemId
    }

    fragment ItemExhibitionInfo on content_ItemExhibition {
        id
        itemId
        exhibitionId
        priority
        layout
    }

    fragment ItemPersonInfo on content_ItemProgramPerson {
        id
        itemId
        personId
        priority
        roleName
    }

    fragment ItemFullNestedInfo on content_Item {
        id
        conferenceId
        subconferenceId
        typeName
        title
        shortTitle
        elements {
            ...ElementInfo
        }
        itemTags {
            ...ItemTagInfo
        }
        itemExhibitions {
            ...ItemExhibitionInfo
        }
        itemPeople {
            ...ItemPersonInfo
        }
        room {
            id
            created_at
        }
    }

    fragment TagInfo on collection_Tag {
        id
        conferenceId
        subconferenceId
        colour
        name
        priority
    }

    fragment ExhibitionInfo on collection_Exhibition {
        id
        conferenceId
        subconferenceId
        colour
        name
        priority
        isHidden
    }

    query SelectWholeSchedule($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                managementModeName: { _in: [PUBLIC, PRIVATE] }
            }
        ) {
            ...RoomInfo
        }
        schedule_Event(
            where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }
            order_by: [{ scheduledStartTime: asc }, { scheduledEndTime: asc }]
        ) {
            ...EventInfo
        }
        collection_Tag(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }) {
            ...TagInfo
        }
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }) {
            ...ExhibitionInfo
        }
        content_Item(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }) {
            ...ItemFullNestedInfo
        }
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }) {
            ...ProgramPersonInfo
        }
    }

    query ManageSchedule_ShufflePeriods(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $now: timestamptz!
    ) {
        room_ShufflePeriod(
            where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond, endAt: { _gt: $now } }
        ) {
            ...ShufflePeriodInfo
        }
    }

    fragment ShufflePeriodInfo on room_ShufflePeriod {
        id
        name
        conferenceId
        endAt
    }

    mutation InsertEventInfo($object: schedule_Event_insert_input!) {
        insert_schedule_Event_one(object: $object) {
            ...EventInfo
        }
    }

    mutation UpdateEventInfo($eventId: uuid!, $set: schedule_Event_set_input!) {
        update_schedule_Event_by_pk(pk_columns: { id: $eventId }, _set: $set) {
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
    StartTime = "scheduledStartTime",
    EndTime = "scheduledEndTime",
    Room = "room",
    RoomMode = "roomMode",
    Name = "name",
    Content = "content",
    Exhibition = "exhibition",
    ShufflePeriod = "shufflePeriod",
    EnableRecording = "enableRecording",
    AutomaticParticipationSurvey = "automaticParticipationSurvey",
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

function EditableScheduleTable(): JSX.Element {
    const conference = useConference();
    const { conferencePath, subconferenceId } = useAuthParameters();
    const {
        developer: { allowOngoingEventCreation },
    } = useAppSettings();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const wholeScheduleContext = useMemo(
        () => ({
            ...context,
            additionalTypenames: [
                "room_Room",
                "schedule_Event",
                "collection_Tag",
                "collection_Exhibition",
                "content_Item",
                "collection_ProgramPerson",
            ],
        }),
        [context]
    );
    const [wholeSchedule] = useSelectWholeScheduleQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        requestPolicy: "cache-and-network",
        context: wholeScheduleContext,
    });
    const data = useMemo(() => [...(wholeSchedule.data?.schedule_Event ?? [])], [wholeSchedule.data?.schedule_Event]);

    const shufflePeriodsNow = useMemo(() => new Date().toISOString(), []);
    const [shufflePeriodsResponse] = useManageSchedule_ShufflePeriodsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
            now: shufflePeriodsNow,
        },
        context,
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
                              (!room.itemId ||
                                  wholeSchedule.data?.content_Item.some(
                                      (x) => x.id === room.itemId && x.typeName === Content_ItemType_Enum.Sponsor
                                  )) &&
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
            Object.keys(Schedule_Mode_Enum)
                .map((x) => {
                    const v = (Schedule_Mode_Enum as any)[x];
                    return { value: v, label: formatEnumValue(v) };
                })
                .sort((x, y) => x.label.localeCompare(y.label)),
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

    const [insertEventResponse, insertEvent] = useInsertEventInfoMutation();
    const [updateEventResponse, updateEvent] = useUpdateEventInfoMutation();
    const [deleteEventsResponse, deleteEvents] = useDeleteEventInfosMutation();

    const columns: Array<ColumnSpecification<EventInfoFragment>> = React.useMemo(
        () => [
            {
                id: ColumnId.StartTime,
                isDataDependency: true,
                defaultSortDirection: SortDirection.Asc,
                header: function StartTimeHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Start time</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Start Time{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (record) => (record.scheduledStartTime ? new Date(record.scheduledStartTime) : new Date()),
                set: (record, v: Date) => {
                    record.scheduledStartTime = v.toISOString() as any;
                },
                filterFn: dateTimeFilterFn(["scheduledStartTime"]),
                filterEl: DateTimeColumnFilter,
                sort: (x: Date, y: Date) => x.getTime() - y.getTime(),
                cell: function StartTimeCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                    staleRecord,
                }: CellProps<Partial<EventInfoFragment>, Date | undefined>) {
                    const now = useRealTime(10000);
                    const start = staleRecord.scheduledStartTime
                        ? Date.parse(staleRecord.scheduledStartTime)
                        : Date.now();
                    const end = staleRecord.scheduledEndTime
                        ? Date.parse(staleRecord.scheduledEndTime)
                        : start + 1000 * 300;
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;
                    const past = end < now - endLeeway;
                    const isLivestream = staleRecord.modeName
                        ? staleRecord.modeName === Schedule_Mode_Enum.Livestream
                        : false;

                    return (
                        <HStack>
                            {!isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the start time of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <DateTimePicker
                                size="sm"
                                value={value}
                                onChange={(v: Date | undefined) => {
                                    onChange?.(v);
                                }}
                                onBlur={onBlur}
                                isDisabled={!isInCreate && (past || ongoing) && isLivestream}
                                ref={ref as Ref<HTMLInputElement>}
                            />
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.EndTime,
                isDataDependency: true,
                header: function EndTimeHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<EventInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>End time</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            End Time{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (record) =>
                    record.scheduledEndTime
                        ? new Date(record.scheduledEndTime)
                        : new Date(Date.parse(record.scheduledStartTime) + 1000 * 300),
                set: (record, v: Date) => {
                    record.scheduledEndTime = v.toISOString();
                },
                filterFn: dateTimeFilterFn(["scheduledEndTime"]),
                filterEl: DateTimeColumnFilter,
                sort: (x: Date, y: Date) => x.getTime() - y.getTime(),
                cell: function EndTimeCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                    staleRecord,
                }: CellProps<Partial<EventInfoFragment>, Date | undefined>) {
                    const now = useRealTime(10000);
                    const start = staleRecord.scheduledStartTime
                        ? Date.parse(staleRecord.scheduledStartTime)
                        : Date.now();
                    const end = staleRecord.scheduledEndTime
                        ? Date.parse(staleRecord.scheduledEndTime)
                        : start + 1000 * 300;
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
                    const ongoing =
                        isOngoingNearBoundary(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;
                    const past = end < now - endLeeway;
                    const isLivestream = staleRecord.modeName
                        ? staleRecord.modeName === Schedule_Mode_Enum.Livestream
                        : false;

                    return (
                        <HStack>
                            {!isInCreate && past && isLivestream ? (
                                <Tooltip label="You cannot edit the end time of a past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            {!isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the end time of an ongoing livestream event within 5 minutes of its start or 4 minutes of its end.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <DateTimePicker
                                size="sm"
                                value={value}
                                onChange={(v: Date | undefined) => {
                                    onChange?.(v);
                                }}
                                onBlur={onBlur}
                                isDisabled={!isInCreate && (past || ongoing) && isLivestream}
                                ref={ref as Ref<HTMLInputElement>}
                            />
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.Room,
                isDataDependency: true,
                header: function EndTimeHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<EventInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Room</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Room{sortDir !== null ? ` ${sortDir}` : undefined}
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
                cell: function RoomCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                    staleRecord,
                }: CellProps<Partial<EventInfoFragment>, RoomInfoFragment | undefined>) {
                    const now = useRealTime(10000);
                    const start = staleRecord.scheduledStartTime
                        ? Date.parse(staleRecord.scheduledStartTime)
                        : Date.now();
                    const end = staleRecord.scheduledEndTime
                        ? Date.parse(staleRecord.scheduledEndTime)
                        : start + 1000 * 300;
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;
                    const past = end < now - endLeeway;
                    const isLivestream = staleRecord.modeName
                        ? staleRecord.modeName === Schedule_Mode_Enum.Livestream
                        : false;

                    return (
                        <HStack>
                            {value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`${conferencePath}/room/${value.id}`}
                                    size="xs"
                                    aria-label="Go to room in new tab"
                                >
                                    <Tooltip label="Go to room in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            {!isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the room of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={value?.id ?? ""}
                                onChange={(ev) =>
                                    onChange?.(
                                        wholeSchedule.data?.room_Room.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={onBlur}
                                isDisabled={!isInCreate && (ongoing || past) && isLivestream}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                {roomOptions}
                                {value && !roomOptions?.some((option) => option.props.value === value?.id) ? (
                                    <option key={value.id} value={value.id}>
                                        {wholeSchedule.data?.room_Room.find((x) => x.id === value?.id)?.name}
                                    </option>
                                ) : undefined}
                            </Select>
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.RoomMode,
                header: function EndTimeHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<EventInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Mode</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Mode{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.modeName,
                set: (record, v: Schedule_Mode_Enum) => {
                    record.modeName = v;
                },
                filterFn: (rows, v: Schedule_Mode_Enum) => rows.filter((r) => r.modeName === v),
                filterEl: SelectColumnFilter(Object.values(Schedule_Mode_Enum)),
                sort: (x: Schedule_Mode_Enum, y: Schedule_Mode_Enum) => x.localeCompare(y),
                cell: function RoomModeCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                    staleRecord,
                }: CellProps<Partial<EventInfoFragment>, Schedule_Mode_Enum | undefined>) {
                    const now = useRealTime(10000);
                    const start = staleRecord.scheduledStartTime
                        ? Date.parse(staleRecord.scheduledStartTime)
                        : Date.now();
                    const end = staleRecord.scheduledEndTime
                        ? Date.parse(staleRecord.scheduledEndTime)
                        : start + 1000 * 300;
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;

                    return (
                        <HStack>
                            {now < start ? (
                                <Tooltip label="Live-stream modes must be set at least 10 minutes in advance of an event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value as Schedule_Mode_Enum)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                {roomModeOptions.map((option) => {
                                    return (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                            disabled={
                                                ongoing &&
                                                option.value === Schedule_Mode_Enum.Livestream &&
                                                option.value !== value
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
                header: function EventNameHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventInfoFragment>) {
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
                filterFn: (rows: Array<EventInfoFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.name ?? "") === "");
                    } else {
                        return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function EventNameCell({ value, onChange, onBlur, ref }: CellProps<Partial<EventInfoFragment>>) {
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
                id: ColumnId.Content,
                header: function ContentHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<EventInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Content (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Content{sortDir !== null ? ` ${sortDir}` : undefined}
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
                    if (filterValue === "") {
                        return rows.filter((row) => !row.itemId);
                    } else {
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
                    }
                },
                filterEl: TextColumnFilter,
                cell: function ContentCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                    staleRecord,
                }: CellProps<Partial<EventInfoFragment>, ItemFullNestedInfoFragment | undefined>) {
                    const now = useRealTime(10000);
                    const start = staleRecord.scheduledStartTime
                        ? Date.parse(staleRecord.scheduledStartTime)
                        : Date.now();
                    const end = staleRecord.scheduledEndTime
                        ? Date.parse(staleRecord.scheduledEndTime)
                        : start + 1000 * 300;
                    const startLeeway = 5 * 60 * 1000;
                    const endLeeway = 4 * 60 * 1000;
                    const ongoing = isOngoing(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;
                    const past = end < now - endLeeway;
                    const isLivestream = staleRecord.modeName
                        ? staleRecord.modeName === Schedule_Mode_Enum.Livestream
                        : false;

                    return (
                        <HStack>
                            {value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`${conferencePath}/item/${value.id}`}
                                    size="xs"
                                    aria-label="Go to content in new tab"
                                >
                                    <Tooltip label="Go to content in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            {!isInCreate && (ongoing || past) && isLivestream ? (
                                <Tooltip label="You cannot edit the content of an ongoing or past livestream event.">
                                    <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                </Tooltip>
                            ) : undefined}
                            <Select
                                value={value?.id ?? ""}
                                onChange={(ev) =>
                                    onChange?.(
                                        wholeSchedule.data?.content_Item.find((room) => room.id === ev.target.value)
                                    )
                                }
                                onBlur={onBlur}
                                isDisabled={!isInCreate && (ongoing || past) && isLivestream}
                                ref={ref as LegacyRef<HTMLSelectElement>}
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
                header: function ExhibitionHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Exhibition (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Exhibition{sortDir !== null ? ` ${sortDir}` : undefined}
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
                    if (filterValue === "") {
                        return rows.filter((row) => !row.exhibitionId);
                    } else {
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
                    }
                },
                filterEl: TextColumnFilter,
                cell: function ExhibitionCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<EventInfoFragment>, ExhibitionInfoFragment | undefined>) {
                    return (
                        <HStack>
                            {value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`${conferencePath}/exhibition/${value.id}`}
                                    size="xs"
                                    aria-label="Go to exhibition in new tab"
                                >
                                    <Tooltip label="Go to exhibition in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            <Select
                                value={value?.id ?? ""}
                                onChange={(ev) =>
                                    onChange?.(
                                        wholeSchedule.data?.collection_Exhibition.find(
                                            (room) => room.id === ev.target.value
                                        )
                                    )
                                }
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
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
                header: function ShufflePeriodHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventInfoFragment>) {
                    return isInCreate ? (
                        <FormLabel>Shuffle Period (optional)</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Shuffle Period{sortDir !== null ? ` ${sortDir}` : undefined}
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
                    if (filterValue === "") {
                        return rows.filter((row) => !row.shufflePeriodId);
                    } else {
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
                    }
                },
                filterEl: TextColumnFilter,
                cell: function ShufflePeriodCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<EventInfoFragment>, ShufflePeriodInfoFragment | undefined>) {
                    return (
                        <HStack>
                            {value ? (
                                <LinkButton
                                    linkProps={{ target: "_blank" }}
                                    to={`${conferencePath}/manage/shuffle`}
                                    size="xs"
                                    aria-label="Go to shuffle period in new tab"
                                >
                                    <Tooltip label="Go to shuffle period in new tab">
                                        <FAIcon iconStyle="s" icon="link" />
                                    </Tooltip>
                                </LinkButton>
                            ) : undefined}
                            <Select
                                value={value?.id ?? ""}
                                onChange={(ev) =>
                                    onChange?.(
                                        shufflePeriodsResponse.data?.room_ShufflePeriod.find(
                                            (room) => room.id === ev.target.value
                                        )
                                    )
                                }
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                                maxW={400}
                            >
                                <option value={""}>{"<None selected>"}</option>
                                {shufflePeriodOptions}
                            </Select>
                        </HStack>
                    );
                },
            },
            {
                id: ColumnId.EnableRecording,
                header: function EnableRecordingHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventInfoFragment>) {
                    if (isInCreate) {
                        return <FormLabel>Recorded?</FormLabel>;
                    } else {
                        return (
                            <Button size="xs" onClick={onClick} h="auto" py={1}>
                                Recorded?{sortDir !== null ? ` ${sortDir}` : undefined}
                            </Button>
                        );
                    }
                },
                get: (data) => data.enableRecording ?? false,
                set: (data, value: boolean) => {
                    data.enableRecording = value;
                },
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<EventInfoFragment>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.enableRecording === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function EnableRecordingCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<EventInfoFragment>, boolean>) {
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
                },
            },
            {
                id: ColumnId.AutomaticParticipationSurvey,
                header: function AutomaticParticipationSurveyHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<EventInfoFragment>) {
                    if (isInCreate) {
                        return <FormLabel>Participation survey?</FormLabel>;
                    } else {
                        return (
                            <Button size="xs" onClick={onClick} h="auto" py={1}>
                                Participation survey?{sortDir !== null ? ` ${sortDir}` : undefined}
                            </Button>
                        );
                    }
                },
                get: (data) => data.automaticParticipationSurvey ?? false,
                set: (data, value: boolean) => {
                    data.automaticParticipationSurvey = value;
                },
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<EventInfoFragment>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.automaticParticipationSurvey === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function AutomaticParticipationSurveyCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<EventInfoFragment>, boolean>) {
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
                },
            },
        ],
        [
            allowOngoingEventCreation,
            wholeSchedule.data?.room_Room,
            wholeSchedule.data?.content_Item,
            wholeSchedule.data?.collection_Exhibition,
            roomOptions,
            roomModeOptions,
            itemOptions,
            exhibitionOptions,
            shufflePeriodsResponse.data?.room_ShufflePeriod,
            shufflePeriodOptions,
            conferencePath,
        ]
    );

    const yellow = useColorModeValue("yellow.300", "yellow.700");
    const row: RowSpecification<EventInfoFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            colour: (record) => (rowWarning(record) ? yellow : undefined),
            warning: (record) => rowWarning(record),
            invalid: (record, isNew, dependentData) => {
                const start = record.scheduledStartTime ? Date.parse(record.scheduledStartTime) : Date.now();
                const end = record.scheduledEndTime ? Date.parse(record.scheduledEndTime) : start + 1000 * 300;
                const now = Date.now();
                const startLeeway = 9.9 * 60 * 1000;
                const endLeeway = 4 * 60 * 1000;
                const ongoing = isOngoing(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;
                const past = end < now - endLeeway;
                const isLivestream = record.modeName === Schedule_Mode_Enum.Livestream;
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
                            const startE = event.scheduledStartTime.getTime();
                            const endE = event.scheduledEndTime.getTime();
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
                const start = record.scheduledStartTime ? Date.parse(record.scheduledStartTime) : Date.now();
                const end = record.scheduledEndTime ? Date.parse(record.scheduledEndTime) : start + 1000 * 300;
                const now = Date.now();
                const startLeeway = 5 * 60 * 1000;
                const endLeeway = 4 * 60 * 1000;
                const ongoing = isOngoing(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;
                const isLivestream = record.modeName ? record.modeName === Schedule_Mode_Enum.Livestream : false;
                return !(ongoing && isLivestream) ? true : "Cannot delete an ongoing livestream event.";
            },
            canDelete: (record) => {
                const start = record.scheduledStartTime ? Date.parse(record.scheduledStartTime) : Date.now();
                const end = record.scheduledEndTime ? Date.parse(record.scheduledEndTime) : start + 1000 * 300;
                const now = Date.now();
                const startLeeway = 5 * 60 * 1000;
                const endLeeway = 4 * 60 * 1000;
                const ongoing = isOngoing(now, startLeeway, endLeeway, start, end) && !allowOngoingEventCreation;
                const isLivestream = record.modeName ? record.modeName === Schedule_Mode_Enum.Livestream : false;
                return !(ongoing && isLivestream) ? true : "Cannot delete an ongoing livestream event.";
            },
            pages: {
                defaultToLast: false,
            },
        }),
        [allowOngoingEventCreation, yellow]
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
                      ongoing: insertEventResponse.fetching,
                      generateDefaults: () => ({
                          id: uuidv4(),
                          conferenceId: conference.id,
                          modeName: Schedule_Mode_Enum.VideoChat,
                          name: "Innominate event",
                          roomId: roomOptions[0].props.value,
                          scheduledStartTime: DateTime.local()
                              .plus({
                                  minutes: 10,
                              })
                              .endOf("hour")
                              .plus({
                                  milliseconds: 1,
                              })
                              .toISO(),
                          scheduledEndTime: DateTime.local()
                              .plus({
                                  minutes: 10,
                              })
                              .endOf("hour")
                              .plus({
                                  minutes: 5,
                              })
                              .toISO(),
                          itemId: null,
                          exhibitionId: null,
                          shufflePeriodId: null,
                          enableRecording: true,
                          automaticParticipationSurvey: false,
                          autoPlayElementId: null,
                      }),
                      makeWhole: (d) => d as EventInfoFragment,
                      start: (record) => {
                          insertEvent(
                              {
                                  object: {
                                      id: record.id,
                                      conferenceId: record.conferenceId,
                                      modeName: record.modeName,
                                      name: record.name,
                                      roomId: record.roomId,
                                      scheduledStartTime: record.scheduledStartTime,
                                      scheduledEndTime: record.scheduledEndTime,
                                      itemId: record.itemId,
                                      exhibitionId: record.exhibitionId,
                                      shufflePeriodId: record.shufflePeriodId,
                                      enableRecording: record.enableRecording,
                                      automaticParticipationSurvey: record.automaticParticipationSurvey,
                                      continuations:
                                          record.modeName === Schedule_Mode_Enum.Livestream && record.itemId
                                              ? {
                                                    data: [
                                                        {
                                                            colour: "#4471de",
                                                            defaultFor: "Presenters",
                                                            description: "Join the discussion room",
                                                            isActiveChoice: false,
                                                            priority: 0,
                                                            to: { type: "AutoDiscussionRoom", id: null },
                                                        },
                                                    ],
                                                }
                                              : undefined,
                                  },
                              },
                              {
                                  fetchOptions: {
                                      headers: {
                                          [AuthHeader.Role]: subconferenceId
                                              ? HasuraRoleName.SubconferenceOrganizer
                                              : HasuraRoleName.ConferenceOrganizer,
                                      },
                                  },
                                  additionalTypenames: ["schedule_Event"],
                              }
                          );
                      },
                  }
                : undefined,
        [conference.id, insertEvent, insertEventResponse.fetching, roomOptions, subconferenceId]
    );

    const update:
        | {
              start: (record: EventInfoFragment) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: updateEventResponse.fetching,
            start: (record) => {
                const set: any = {
                    ...record,
                };
                delete set.id;
                delete set.eventPeople;
                delete set.conferenceId;
                delete set.subconferenceId;
                delete set.__typename;
                updateEvent(
                    {
                        eventId: record.id,
                        set,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: subconferenceId
                                    ? HasuraRoleName.SubconferenceOrganizer
                                    : HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                        additionalTypenames: ["schedule_Event"],
                    }
                );
            },
        }),
        [subconferenceId, updateEvent, updateEventResponse.fetching]
    );

    const deleteProps:
        | {
              start: (keys: string[]) => void;
              ongoing: boolean;
          }
        | undefined = useMemo(
        () => ({
            ongoing: deleteEventsResponse.fetching,
            start: (keys) => {
                deleteEvents(
                    {
                        eventIds: keys,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: subconferenceId
                                    ? HasuraRoleName.SubconferenceOrganizer
                                    : HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                        additionalTypenames: ["schedule_Event"],
                    }
                );
            },
        }),
        [deleteEvents, deleteEventsResponse.fetching, subconferenceId]
    );

    const batchAddPeopleDisclosure = useDisclosure();

    const pageSizes = useMemo(() => [5, 10, 15, 20], []);

    const buttons: ExtraButton<EventInfoFragment>[] = useMemo(
        () => [
            {
                render: function ImportButton(_selectedData) {
                    return (
                        <LinkButton colorScheme="purple" to={`${conferencePath}/manage/import/program`}>
                            Import
                        </LinkButton>
                    );
                },
            },
            {
                render: ({ selectedData }: { selectedData: EventInfoFragment[] }) => {
                    function doExport(dataToExport: readonly EventInfoFragment[]) {
                        const csvText = Papa.unparse(
                            dataToExport.map((event) => ({
                                "Conference Id": event.conferenceId,
                                "Subconference Id": event.subconferenceId,
                                "Event Id": event.id,

                                Start: event.scheduledStartTime
                                    ? new Date(event.scheduledStartTime).toISOString()
                                    : null,
                                End: event.scheduledEndTime ? new Date(event.scheduledEndTime).toISOString() : null,
                                Mode: event.modeName,

                                "Room Id": event.roomId,
                                "Room Name":
                                    wholeSchedule.data?.room_Room.find((x) => x.id === event.roomId)?.name ?? "",

                                Name: event.name,

                                "Content Id": event.itemId ?? "",
                                "Content Title": event.itemId
                                    ? wholeSchedule.data?.content_Item.find((item) => item.id === event.itemId)
                                          ?.title ?? ""
                                    : "",

                                "Exhibition Id": event.exhibitionId ?? "",
                                "Exhibition Title": event.exhibitionId
                                    ? wholeSchedule.data?.collection_Exhibition.find(
                                          (exh) => exh.id === event.exhibitionId
                                      )?.name ?? ""
                                    : "",

                                "Shuffle Period Id": event.shufflePeriodId ?? "",

                                People: event.eventPeople.map((eventPerson) => {
                                    const person = wholeSchedule.data?.collection_ProgramPerson.find(
                                        (person) => person.id === eventPerson.personId
                                    );
                                    return `${eventPerson.personId} (${eventPerson.roleName}) [${
                                        person
                                            ? `${person.name} (${person.affiliation ?? "No affiliation"}) <${
                                                  person.email ?? "No email"
                                              }> ${person?.registrantId ? "Registered" : "Unregistered"}`
                                            : "Person not found"
                                    }]`;
                                }),
                                "Registered People": event.eventPeople.flatMap((eventPerson) => {
                                    const person = wholeSchedule.data?.collection_ProgramPerson.find(
                                        (person) => person.id === eventPerson.personId
                                    );
                                    return person?.registrantId
                                        ? [
                                              `${eventPerson.personId} (${eventPerson.roleName}) [${
                                                  person
                                                      ? `${person.name} (${person.affiliation ?? "No affiliation"}) <${
                                                            person.email ?? "No email"
                                                        }>`
                                                      : "Person not found"
                                              }]`,
                                          ]
                                        : [];
                                }),

                                "Participate Link": `${window.location.origin}${conferencePath}/room/${event.roomId}`,
                                "Info link": event.itemId
                                    ? `${window.location.origin}${conferencePath}/item/${event.itemId}`
                                    : event.exhibitionId
                                    ? `${window.location.origin}${conferencePath}/exhibition/${event.exhibitionId}`
                                    : `${window.location.origin}${conferencePath}/schedule`,
                                "Room Link": `${window.location.origin}${conferencePath}/room/${event.roomId}`,
                                "Content Link": event.itemId
                                    ? `${window.location.origin}${conferencePath}/item/${event.itemId}`
                                    : "",
                                "Exhibition Link": event.exhibitionId
                                    ? `${window.location.origin}${conferencePath}/exhibition/${event.exhibitionId}`
                                    : "",
                                "Shuffle Link": event.shufflePeriodId
                                    ? `${window.location.origin}${conferencePath}/shuffle`
                                    : "",

                                "Recording Enabled": event.enableRecording,
                                "Automatic Participation Survey Enabled": event.automaticParticipationSurvey,
                                "Auto Play Element Id": event.autoPlayElementId,
                            })),
                            {
                                columns: [
                                    "Conference Id",
                                    "Subconference Id",
                                    "Event Id",
                                    "Start",
                                    "End",
                                    "Duration (seconds)",
                                    "Mode",
                                    "Room Id",
                                    "Room Name",
                                    "Name",
                                    "Content Id",
                                    "Content Title",
                                    "Exhibition Id",
                                    "Exhibition Title",
                                    "Shuffle Period Id",
                                    "People",
                                    "Registered People",
                                    "Participate Link",
                                    "Info link",
                                    "Room Link",
                                    "Content Link",
                                    "Exhibition Link",
                                    "Shuffle Link",
                                    "Tag Ids",
                                    "Recording Enabled",
                                    "Automatic Participation Survey Enabled",
                                    "Auto Play Element Id",
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
                            .padStart(2, "0")} - Midspace Schedule.csv`;

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
                                <Tooltip label={tooltip("all events (from a chosen room)")}>
                                    <MenuButton as={Button} colorScheme="purple" rightIcon={<ChevronDownIcon />}>
                                        Export
                                    </MenuButton>
                                </Tooltip>
                                <MenuList maxH="400px" overflowY="auto">
                                    <MenuItem
                                        onClick={() => {
                                            if (wholeSchedule.data?.schedule_Event) {
                                                doExport(wholeSchedule.data.schedule_Event);
                                            }
                                        }}
                                    >
                                        All rooms
                                    </MenuItem>
                                    <MenuGroup>
                                        {wholeSchedule.data?.room_Room
                                            .filter((room) => room.isProgramRoom)
                                            .map((room) => (
                                                <MenuItem
                                                    key={room.id}
                                                    onClick={() => {
                                                        if (wholeSchedule.data?.schedule_Event) {
                                                            doExport(
                                                                wholeSchedule.data.schedule_Event.filter(
                                                                    (event) => event.roomId === room.id
                                                                )
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {room.name}
                                                </MenuItem>
                                            ))}
                                    </MenuGroup>
                                </MenuList>
                            </Menu>
                        );
                    } else {
                        return (
                            <Tooltip label={tooltip("selected events")}>
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
        [
            wholeSchedule.data?.room_Room,
            wholeSchedule.data?.content_Item,
            wholeSchedule.data?.collection_Exhibition,
            wholeSchedule.data?.schedule_Event,
            wholeSchedule.data?.collection_ProgramPerson,
            conferencePath,
        ]
    );

    return (
        <>
            <HStack flexWrap="wrap" maxW="100%" justifyContent="center" gridRowGap={2}>
                <Center borderStyle="solid" borderWidth={1} borderColor={grey} borderRadius={5} p={2}>
                    <FAIcon icon="clock" iconStyle="s" mr={2} />
                    <Text as="span">Timezone: {localTimeZone}</Text>
                </Center>
                <LinkButton linkProps={{ m: "3px" }} to={`${conferencePath}/manage/rooms`} colorScheme="yellow">
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
                data={!wholeSchedule.fetching && (wholeSchedule.data?.schedule_Event ? data : null)}
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
                                  extractActualError(
                                      insertEventResponse.error ??
                                          updateEventResponse.error ??
                                          deleteEventsResponse.error
                                  ) ?? "Unknown error",
                          }
                        : undefined
                }
                forceReload={forceReloadRef}
                buttons={buttons}
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

export default function ManageSchedule(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage schedule of ${conference.shortName}`);

    return (
        <DashboardPage title="Schedule">
            {title}
            <EditableScheduleTable />
        </DashboardPage>
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
                                    Edit: {event.name}
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
                                <AccordionItem key="continuations">
                                    <AccordionButton>
                                        <Box flex="1" textAlign="left">
                                            Continuations
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel>
                                        <ContinuationsEditor from={{ eventId: event.id }} itemId={event.itemId} />
                                    </AccordionPanel>
                                </AccordionItem>
                                <AccordionItem key="streamtext">
                                    <AccordionButton>
                                        <Box flex="1" textAlign="left">
                                            Embed StreamText.Net (CART)
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel>
                                        <EditStreamTextIntegration eventId={event.id} />
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
