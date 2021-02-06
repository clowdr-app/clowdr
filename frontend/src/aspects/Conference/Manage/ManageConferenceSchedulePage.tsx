// TODO: Switch these back on
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */

import { gql, Reference } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Alert,
    AlertDescription,
    AlertTitle,
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
    Heading,
    HStack,
    Input,
    NumberInput,
    NumberInputField,
    Select,
    Spacer,
    Spinner,
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
    useToken,
    VisuallyHidden,
    VStack,
} from "@chakra-ui/react";
import { DateTime } from "luxon";
import { matchSorter } from "match-sorter";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    CellProps,
    Column,
    defaultGroupByFn,
    FilterProps,
    FilterType,
    FilterTypes,
    HeaderProps,
    Row,
    useExpanded,
    useFilters,
    useFlexLayout,
    useGroupBy,
    usePagination,
    useResizeColumns,
    useRowSelect,
    useSortBy,
    useTable,
} from "react-table";
import {
    AttendeeInfoFragment,
    EventInfoFragment,
    EventInfoFragmentDoc,
    Permission_Enum,
    RoomMode_Enum,
    useDeleteEventInfoMutation,
    useDeleteEventInfosMutation,
    useInsertEventInfoMutation,
    useSelectWholeScheduleQuery,
    useUpdateEventInfoMutation,
} from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { DateTimePicker } from "../../CRUDTable/DateTimePicker";
import PageNotFound from "../../Errors/PageNotFound";
import { useRealTime } from "../../Generic/useRealTime";
import { useRestorableState } from "../../Generic/useRestorableState";
import FAIcon from "../../Icons/FAIcon";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { EventPersonsModal, requiresEventPeople } from "./Schedule/EventPersonsModal";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    mutation InsertEventInfo(
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

    mutation DeleteEventInfo($eventId: uuid!) {
        delete_Event_by_pk(id: $eventId) {
            id
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

// Create an editable cell renderer
function useEditableValue<V>(
    initialValue: V,
    update: (value: V) => V
): {
    value: V;
    setValue: (value: V) => void;
    onBlur: () => void;
} {
    const [value, setValue] = React.useState(initialValue);
    const onBlur = () => {
        setValue(update(value));
    };
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);
    return {
        value,
        setValue,
        onBlur,
    };
}

// Define a default UI for filtering
function DefaultColumnFilter({ column: { filterValue, preFilteredRows, setFilter } }: FilterProps<EventInfoFragment>) {
    const count = preFilteredRows.length;

    return (
        <Input
            value={filterValue || ""}
            onChange={(e) => {
                setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
            }}
            placeholder={`Search ${count} records...`}
        />
    );
}

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
    column: { filterValue, setFilter, preFilteredRows, id },
}: FilterProps<EventInfoFragment>) {
    // Calculate the options for filtering
    // using the preFilteredRows
    const options = React.useMemo(() => {
        const options = new Set<string>();
        preFilteredRows.forEach((row) => {
            options.add(row.values[id]);
        });
        return [...options.values()];
    }, [id, preFilteredRows]);

    // Render a multi-select box
    return (
        <Select
            value={filterValue}
            onChange={(e) => {
                setFilter(e.target.value || undefined);
            }}
        >
            <option value="">All</option>
            {options.map((option, i) => (
                <option key={i} value={option}>
                    {option}
                </option>
            ))}
        </Select>
    );
}

// This is a custom filter UI that uses a
// slider to set the filter value between a column's
// min and max values
function SliderColumnFilter({
    column: { filterValue, setFilter, preFilteredRows, id },
}: FilterProps<EventInfoFragment>) {
    // Calculate the min and max
    // using the preFilteredRows

    const [min, max] = React.useMemo(() => {
        let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        preFilteredRows.forEach((row) => {
            min = Math.min(row.values[id], min);
            max = Math.max(row.values[id], max);
        });
        return [min, max];
    }, [id, preFilteredRows]);

    return (
        <>
            <Input
                type="range"
                min={min}
                max={max}
                value={filterValue || min}
                onChange={(e) => {
                    setFilter(parseInt(e.target.value, 10));
                }}
            />
            <Button onClick={() => setFilter(undefined)}>Off</Button>
        </>
    );
}

// This is a custom UI for our 'between' or number range
// filter. It uses two number boxes and filters rows to
// ones that have values between the two
function NumberRangeColumnFilter({
    column: { filterValue = [], preFilteredRows, setFilter, id },
}: FilterProps<EventInfoFragment>) {
    const [min, max] = React.useMemo(() => {
        let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        preFilteredRows.forEach((row) => {
            min = Math.min(row.values[id], min);
            max = Math.max(row.values[id], max);
        });
        return [min, max];
    }, [id, preFilteredRows]);

    return (
        <Flex>
            <NumberInput>
                <NumberInputField
                    value={filterValue[0] || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilter((old = []) => [val ? parseInt(val, 10) : undefined, old[1]]);
                    }}
                    placeholder={`Min (${min})`}
                    style={{
                        width: "70px",
                        marginRight: "0.5rem",
                    }}
                />
            </NumberInput>
            to
            <NumberInput>
                <NumberInputField
                    value={filterValue[1] || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilter((old = []) => [old[0], val ? parseInt(val, 10) : undefined]);
                    }}
                    placeholder={`Max (${max})`}
                    style={{
                        width: "70px",
                        marginLeft: "0.5rem",
                    }}
                />
            </NumberInput>
        </Flex>
    );
}

const startsWithTextFilerFn: FilterType<EventInfoFragment> = (rows, columnIds, filterValue) => {
    return rows.filter((row) => {
        return columnIds.every((id) => {
            const rowValue = row.values[id];
            return rowValue !== undefined
                ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
                : true;
        });
    });
};

const fuzzyTextFilterFn: FilterType<EventInfoFragment> = (rows, columnIds, filterValue) => {
    return columnIds.reduce((acc, id) => matchSorter(acc, filterValue, { keys: [(row) => row.values[id]] }), rows);
};

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val: string) => !val;

// Define a custom filter filter function!
const filterGreaterThan: FilterType<EventInfoFragment> = (rows, columnIds, filterValue) => {
    return columnIds.reduce(
        (acc, id) =>
            acc.filter((row) => {
                const rowValue = row.values[id];
                return rowValue >= filterValue;
            }),
        rows
    );
};

const dateTimeFilterFn: FilterType<EventInfoFragment> = (
    rows,
    columnIds,
    {
        value: valueD,
        mode,
    }: {
        value: Date;
        mode: "after" | "before" | "exact";
    }
): Array<Row<EventInfoFragment>> => {
    return columnIds.reduce((acc, id) => {
        let value = valueD.getTime();
        if (mode === "after") {
            return acc.filter((row) => row.values[id] >= value);
        } else if (mode === "before") {
            return acc.filter((row) => row.values[id] <= value);
        } else {
            value = Math.round(value / 1000);
            return acc.filter((row) => Math.round(row.values[id] / 1000) === value);
        }
    }, rows);
};

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
// check, but here, we want to remove the filter if it's not a number
filterGreaterThan.autoRemove = (val: any) => typeof val !== "number";

// This is a custom aggregator that
// takes in an array of leaf values and
// returns the rounded median
function roundedMedian(leafValues: number[]) {
    let min = leafValues[0] || 0;
    let max = leafValues[0] || 0;

    leafValues.forEach((value) => {
        min = Math.min(min, value);
        max = Math.max(max, value);
    });

    return Math.round((min + max) / 2);
}

function DateTimeCell(
    props: CellProps<EventInfoFragment> & { onChange?: (value: Date) => void; onBlur: () => void; isDisabled: boolean }
) {
    return (
        <DateTimePicker
            value={new Date(props.value)}
            onChange={props.onChange}
            onBlur={props.onBlur}
            isDisabled={props.isDisabled}
        />
    );
}

function DateTimeColumnFilter({ column: { filterValue, setFilter } }: FilterProps<EventInfoFragment>) {
    return (
        <HStack flexWrap="wrap" justifyContent="flex-start" alignItems="flex-start" gridRowGap={2}>
            <Select
                size="sm"
                width="auto"
                value={filterValue?.mode ?? ""}
                onChange={(ev) => {
                    setFilter(
                        ev.target.value === ""
                            ? undefined
                            : filterValue
                            ? { ...filterValue, mode: ev.target.value }
                            : {
                                  value: new Date(),
                                  mode: ev.target.value,
                              }
                    );
                }}
            >
                <option value="">🗙</option>
                <option value="after">≥</option>
                <option value="exact">=</option>
                <option value="before">≤</option>
            </Select>
            <DateTimePicker
                size="sm"
                allowUndefined={true}
                value={filterValue?.value}
                onChange={(d) =>
                    setFilter(
                        !d
                            ? undefined
                            : filterValue
                            ? { ...filterValue, value: d }
                            : {
                                  value: d,
                                  mode: "after",
                              }
                    )
                }
            />
        </HStack>
    );
}

function fomratEnumValuePart(part: string): string {
    if (part.length === 0) {
        return "";
    }
    return part[0] + part.substr(1).toLowerCase();
}

function formatEnumValue(key: string): string {
    const parts = key.split("_");
    return parts.reduce((acc, part) => `${acc} ${fomratEnumValuePart(part)}`, "").substr(1);
}

enum ColumnId {
    StartTime = "startTime",
    EndTime = "endTime",
    Room = "room",
    RoomMode = "roomMode",
    Name = "name",
    Content = "content",
}

function rowWarning(row: Row<EventInfoFragment>) {
    if (requiresEventPeople(row.original)) {
        return "This event will be live streamed but no Event People have been assigned to manage it.";
    }
    return undefined;
}

function isOngoing(now: number, startLeeway: number, endLeeway: number, row: Row<any>): boolean {
    return row.values[ColumnId.StartTime] - startLeeway <= now && now <= row.values[ColumnId.EndTime] + endLeeway;
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
    const [deleteEvent, deleteEventResponse] = useDeleteEventInfoMutation();
    const [deleteEvents, deleteEventsResponse] = useDeleteEventInfosMutation();
    const isIndexAffectingEditOngoing =
        insertEventResponse.loading || deleteEventResponse.loading || deleteEventsResponse.loading;

    const [eventBeingDeleted, setEventBeingDeleted] = useState<number | null>(null);
    const [eventBeingUpdated, setEventBeingUpdated] = useState<number | null>(null);
    const columns: Array<Column<EventInfoFragment>> = React.useMemo(
        () => [
            {
                id: "selection-group",
                Header: "",
                disableResizing: true,
                columns: [
                    {
                        id: "selection",
                        // Make this column a groupByBoundary. This ensures that groupBy columns
                        // are placed after it
                        groupByBoundary: true,
                        // The header can use the table's getToggleAllRowsSelectedProps method
                        // to render a checkbox
                        Header: function ColumnHeader({
                            getToggleAllRowsSelectedProps,
                        }: HeaderProps<EventInfoFragment>) {
                            const props = getToggleAllRowsSelectedProps();
                            const isIndeterminate = props.indeterminate;
                            const isChecked = props.checked;
                            delete props.indeterminate;
                            delete props.checked;
                            return (
                                <Center w="100%" h="100%">
                                    <Checkbox
                                        {...props}
                                        isDisabled={isIndexAffectingEditOngoing}
                                        isIndeterminate={isIndeterminate}
                                        isChecked={isChecked}
                                    />
                                </Center>
                            );
                        },
                        // The cell can use the individual row's getToggleRowSelectedProps method
                        // to the render a checkbox
                        Cell: function ColumnCell({ row }: CellProps<EventInfoFragment>) {
                            const props = row.getToggleRowSelectedProps();
                            const isIndeterminate = props.indeterminate;
                            const isChecked = props.checked;
                            delete props.indeterminate;
                            delete props.checked;
                            return (
                                <Center w="100%" h="100%">
                                    <Checkbox
                                        {...props}
                                        isDisabled={isIndexAffectingEditOngoing}
                                        isIndeterminate={isIndeterminate}
                                        isChecked={isChecked}
                                    />
                                </Center>
                            );
                        },

                        width: 30,
                        disableResizing: true,
                    },
                ],
            },
            {
                id: "edit-group",
                Header: "",
                disableResizing: true,
                columns: [
                    {
                        id: "edit",
                        groupByBoundary: true,
                        Header: function ColumnHeader(props: HeaderProps<EventInfoFragment>) {
                            const noRooms = !wholeSchedule.data?.Room || wholeSchedule.data.Room.length === 0;
                            return (
                                <Center w="100%" h="100%" padding={0}>
                                    <Tooltip label={noRooms ? "Please create a room." : undefined}>
                                        <Box>
                                            <Button
                                                isDisabled={noRooms || isIndexAffectingEditOngoing}
                                                aria-label="Create new event"
                                                onClick={() => {
                                                    if (
                                                        wholeSchedule.data?.Room &&
                                                        wholeSchedule.data.Room.length !== 0
                                                    ) {
                                                        // TODO: Find a non-overlapping room/time

                                                        insertEvent({
                                                            variables: {
                                                                durationSeconds: 300,
                                                                conferenceId: conference.id,
                                                                intendedRoomModeName: RoomMode_Enum.Breakout,
                                                                name: "Innominate event",
                                                                roomId: wholeSchedule.data.Room[0].id,
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
                                                            },
                                                            update: (cache, { data: _data }) => {
                                                                if (_data?.insert_Event_one) {
                                                                    const data = _data.insert_Event_one;
                                                                    cache.modify({
                                                                        fields: {
                                                                            Event(
                                                                                existingRefs: Reference[] = [],
                                                                                { readField }
                                                                            ) {
                                                                                const newRef = cache.writeFragment({
                                                                                    data,
                                                                                    fragment: EventInfoFragmentDoc,
                                                                                    fragmentName: "EventInfo",
                                                                                });
                                                                                if (
                                                                                    existingRefs.some(
                                                                                        (ref) =>
                                                                                            readField("id", ref) ===
                                                                                            data.id
                                                                                    )
                                                                                ) {
                                                                                    return existingRefs;
                                                                                }

                                                                                return [...existingRefs, newRef];
                                                                            },
                                                                        },
                                                                    });
                                                                }
                                                            },
                                                        });
                                                        // TODO: Focus on the new event
                                                    }
                                                }}
                                                size="xs"
                                                colorScheme="green"
                                                isLoading={insertEventResponse.loading}
                                            >
                                                <FAIcon iconStyle="s" icon="plus" />
                                            </Button>
                                        </Box>
                                    </Tooltip>
                                </Center>
                            );
                        },
                        Cell: function ColumnCell({ row }: CellProps<EventInfoFragment>) {
                            const warning = rowWarning(row);
                            return (
                                <Center w="100%" h="100%" padding={0}>
                                    <Tooltip label={warning}>
                                        <Button
                                            isDisabled={isIndexAffectingEditOngoing}
                                            isLoading={eventBeingUpdated === row.index && updateEventResponse.loading}
                                            aria-label={`Edit row ${row.index}`}
                                            onClick={() => {
                                                setEditingIndex(row.index);
                                                onSecondaryPanelOpen();
                                            }}
                                            size="xs"
                                            colorScheme={warning ? "orange" : "blue"}
                                        >
                                            {warning ? (
                                                <>
                                                    <FAIcon iconStyle="s" icon="exclamation-triangle" mr={1} />
                                                    <FAIcon iconStyle="s" icon="edit" />
                                                </>
                                            ) : (
                                                <FAIcon iconStyle="s" icon="edit" />
                                            )}
                                        </Button>
                                    </Tooltip>
                                </Center>
                            );
                        },

                        width: 45,
                        disableResizing: true,
                    },
                ],
            },
            {
                Header: "Time",
                disableResizing: true,
                columns: [
                    {
                        id: ColumnId.StartTime,
                        Header: "Start Time",
                        accessor: (row) => Date.parse(row.startTime),
                        filter: dateTimeFilterFn,
                        Filter: DateTimeColumnFilter,
                        Cell: function StartTimeCell(props: CellProps<EventInfoFragment>) {
                            const { value, setValue, onBlur } = useEditableValue(props.value, (newValue) => {
                                return props.updateMyData(props.row.index, props.column.id, newValue);
                            });

                            const now = useRealTime(10000);
                            const ongoing = isOngoing(now, 1 * 60 * 1000, 1 * 60 * 1000, props.row);

                            if (props.row.isGrouped && !props.column.isGrouped) {
                                return <></>;
                            }

                            return (
                                <HStack>
                                    {ongoing && liveStreamRoomModes.includes(props.row.values[ColumnId.RoomMode]) ? (
                                        <Tooltip label="You cannot edit the start time of an ongoing live-stream event.">
                                            <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                        </Tooltip>
                                    ) : undefined}
                                    <DateTimeCell
                                        {...props}
                                        value={value}
                                        onChange={(v) => setValue(v.getTime())}
                                        onBlur={onBlur}
                                        isDisabled={
                                            ongoing && liveStreamRoomModes.includes(props.row.values[ColumnId.RoomMode])
                                        }
                                    />
                                </HStack>
                            );
                        },
                        minWidth: 395,
                    },
                    {
                        id: ColumnId.EndTime,
                        Header: "End Time",
                        accessor: (row) => Date.parse(row.startTime) + row.durationSeconds * 1000,
                        filter: dateTimeFilterFn,
                        Filter: DateTimeColumnFilter,
                        Cell: function EndTimeCell(props: CellProps<EventInfoFragment>) {
                            const { value, setValue, onBlur } = useEditableValue(props.value, (newValue) => {
                                return props.updateMyData(props.row.index, props.column.id, newValue);
                            });

                            const now = useRealTime(10000);
                            const ongoing = isOngoing(now, 1 * 60 * 1000, 1 * 60 * 1000, props.row);

                            if (props.row.isGrouped && !props.column.isGrouped) {
                                return <></>;
                            }

                            return (
                                <HStack>
                                    {ongoing && liveStreamRoomModes.includes(props.row.values[ColumnId.RoomMode]) ? (
                                        <Tooltip label="You cannot edit the end time of an ongoing live-stream event.">
                                            <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                        </Tooltip>
                                    ) : undefined}
                                    <DateTimeCell
                                        {...props}
                                        value={value}
                                        onChange={(v) => setValue(v.getTime())}
                                        onBlur={onBlur}
                                        isDisabled={
                                            ongoing && liveStreamRoomModes.includes(props.row.values[ColumnId.RoomMode])
                                        }
                                    />
                                </HStack>
                            );
                        },
                        minWidth: 395,
                    },
                ],
            },
            {
                Header: "Room",
                disableResizing: true,
                columns: [
                    {
                        id: ColumnId.Room,
                        Header: "Room",
                        accessor: (data) => wholeSchedule.data?.Room.find((room) => room.id === data.roomId),
                        sortType: (rowA: Row, rowB: Row) => {
                            const roomA = wholeSchedule.data?.Room.find((x) => x.id === rowA.values[ColumnId.Room]);
                            const roomB = wholeSchedule.data?.Room.find((x) => x.id === rowB.values[ColumnId.Room]);
                            const compared =
                                roomA && roomB ? roomA.name.localeCompare(roomB.name) : roomA ? 1 : roomB ? -1 : 0;
                            return compared;
                        },
                        filter: (rows: Array<Row>, _columnIds: Array<string>, filterValue: string): Array<Row> => {
                            return rows.filter((row) => {
                                return (
                                    row.values[ColumnId.Room]?.name.toLowerCase().includes(filterValue.toLowerCase()) ??
                                    false
                                );
                            });
                        },
                        Cell: function RoomCell(props: CellProps<EventInfoFragment>) {
                            const { value, setValue, onBlur } = useEditableValue(props.value?.id, (newValue) => {
                                return props.updateMyData(props.row.index, props.column.id, newValue);
                            });

                            if (props.row.isGrouped && !props.column.isGrouped) {
                                return <></>;
                            }

                            return (
                                <HStack>
                                    <LinkButton
                                        linkProps={{ target: "_blank" }}
                                        to={`/conference/${conference.slug}/room/${value}`}
                                        size="xs"
                                        aria-label="Go to room in new tab"
                                    >
                                        <Tooltip label="Go to room in new tab">
                                            <FAIcon iconStyle="s" icon="link" />
                                        </Tooltip>
                                    </LinkButton>
                                    <Select
                                        value={value ?? ""}
                                        onChange={(ev) => setValue(ev.target.value)}
                                        onBlur={onBlur}
                                    >
                                        {roomOptions}
                                    </Select>
                                </HStack>
                            );
                        },
                        minWidth: 200,
                    },
                    {
                        id: ColumnId.RoomMode,
                        Header: "Mode",
                        accessor: "intendedRoomModeName",
                        Filter: SelectColumnFilter,
                        Cell: function RoomModeCell(props: CellProps<EventInfoFragment>) {
                            const { value, setValue, onBlur } = useEditableValue(props.value, (newValue) => {
                                return props.updateMyData(props.row.index, props.column.id, newValue);
                            });

                            const now = useRealTime(10000);
                            const ongoing = isOngoing(now, 5 * 60 * 1000, 1 * 60 * 1000, props.row);

                            if (props.row.isGrouped && !props.column.isGrouped) {
                                return <></>;
                            }

                            return (
                                <HStack>
                                    {ongoing ? (
                                        <Tooltip label="Live-stream modes must be set at least 10 minutes in advance of an event.">
                                            <FAIcon color={"blue.400"} iconStyle="s" icon="info-circle" />
                                        </Tooltip>
                                    ) : undefined}
                                    <Select
                                        value={value ?? ""}
                                        onChange={(ev) => setValue(ev.target.value)}
                                        onBlur={onBlur}
                                    >
                                        {roomModeOptions.map((option) => {
                                            return (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                    disabled={
                                                        ongoing &&
                                                        liveStreamRoomModes.includes(option.value) &&
                                                        option.value !== props.row.values[ColumnId.RoomMode]
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
                        minWidth: 180,
                    },
                ],
            },
            {
                id: "content-group",
                Header: "Content",
                disableResizing: true,
                columns: [
                    {
                        id: ColumnId.Name,
                        Header: "Name",
                        accessor: "name",
                        Cell: function ContentCell(props: CellProps<EventInfoFragment>) {
                            const { value, setValue, onBlur } = useEditableValue(props.value, (newValue) => {
                                return props.updateMyData(props.row.index, props.column.id, newValue);
                            });

                            if (props.row.isGrouped && !props.column.isGrouped) {
                                return <></>;
                            }

                            return (
                                <Input
                                    type="text"
                                    value={value ?? ""}
                                    onChange={(ev) => setValue(ev.target.value)}
                                    onBlur={onBlur}
                                    border="1px solid"
                                    borderColor="rgba(255, 255, 255, 0.16)"
                                />
                            );
                        },
                        minWidth: 200,
                    },
                    {
                        id: ColumnId.Content,
                        Header: "Content",
                        accessor: (data) =>
                            wholeSchedule.data?.ContentGroup.find((room) => room.id === data.contentGroupId),
                        sortType: (rowA: Row, rowB: Row) => {
                            const compared =
                                rowA.values[ColumnId.Content] && rowB.values[ColumnId.Content]
                                    ? rowA.values[ColumnId.Content].title.localeCompare(
                                          rowB.values[ColumnId.Content].title
                                      )
                                    : rowA.values[ColumnId.Content]
                                    ? 1
                                    : rowB.values[ColumnId.Content]
                                    ? -1
                                    : 0;
                            return compared;
                        },
                        filter: (rows: Array<Row>, _columnIds: Array<string>, filterValue: string): Array<Row> => {
                            return rows.filter((row) => {
                                return (
                                    row.values[ColumnId.Content]?.title
                                        .toLowerCase()
                                        .includes(filterValue.toLowerCase()) ?? false
                                );
                            });
                        },
                        Cell: function ContentCell(props: CellProps<EventInfoFragment>) {
                            const { value, setValue, onBlur } = useEditableValue(props.value?.id, (newValue) => {
                                return props.updateMyData(props.row.index, props.column.id, newValue);
                            });

                            if (props.row.isGrouped && !props.column.isGrouped) {
                                return <></>;
                            }

                            return (
                                <HStack>
                                    <LinkButton
                                        linkProps={{ target: "_blank" }}
                                        to={`/conference/${conference.slug}/item/${value}`}
                                        size="xs"
                                        aria-label="Go to content in new tab"
                                    >
                                        <Tooltip label="Go to content in new tab">
                                            <FAIcon iconStyle="s" icon="link" />
                                        </Tooltip>
                                    </LinkButton>
                                    <Select
                                        value={value ?? ""}
                                        onChange={(ev) => setValue(ev.target.value)}
                                        onBlur={onBlur}
                                    >
                                        <option value={""}>{"<None selected>"}</option>
                                        {contentGroupOptions}
                                    </Select>
                                </HStack>
                            );
                        },
                        minWidth: 400,
                    },
                ],
            },
            {
                id: "delete-group",
                Header: "",
                disableResizing: true,
                columns: [
                    {
                        id: "delete",
                        groupByBoundary: true,
                        Header: function ColumnHeader(props: HeaderProps<EventInfoFragment>) {
                            const selectedRowIds = props.selectedFlatRows.map((x) => x.original.id);
                            return (
                                <Center w="100%" h="100%" padding={0}>
                                    <Button
                                        aria-label="Delete selected rows"
                                        isLoading={deleteEventsResponse.loading}
                                        onClick={() => {
                                            if (wholeSchedule.data?.Event) {
                                                deleteEvents({
                                                    variables: {
                                                        eventIds: selectedRowIds,
                                                    },
                                                    update: (cache, { data: _data }) => {
                                                        if (_data?.delete_Event) {
                                                            const data = _data.delete_Event;
                                                            const deletedIds = data.returning.map((x) => x.id);
                                                            cache.modify({
                                                                fields: {
                                                                    Event(
                                                                        existingRefs: Reference[] = [],
                                                                        { readField }
                                                                    ) {
                                                                        deletedIds.forEach((x) => {
                                                                            cache.evict({
                                                                                id: x.id,
                                                                                fieldName: "EventInfo",
                                                                                broadcast: true,
                                                                            });
                                                                        });
                                                                        return existingRefs.filter(
                                                                            (ref) =>
                                                                                !deletedIds.includes(
                                                                                    readField("id", ref)
                                                                                )
                                                                        );
                                                                    },
                                                                },
                                                            });
                                                        }
                                                    },
                                                });
                                            }
                                        }}
                                        size="xs"
                                        colorScheme="red"
                                        isDisabled={isIndexAffectingEditOngoing}
                                    >
                                        <FAIcon iconStyle="s" icon="trash-alt" />
                                    </Button>
                                </Center>
                            );
                        },
                        Cell: function ColumnCell({ row }: CellProps<EventInfoFragment>) {
                            return (
                                <Center w="100%" h="100%" padding={0}>
                                    <Button
                                        aria-label={`Delete row ${row.index}`}
                                        isDisabled={isIndexAffectingEditOngoing}
                                        isLoading={eventBeingDeleted === row.index && deleteEventResponse.loading}
                                        onClick={() => {
                                            if (wholeSchedule.data?.Event) {
                                                setEventBeingDeleted(row.index);
                                                deleteEvent({
                                                    variables: {
                                                        eventId: wholeSchedule.data.Event[row.index].id,
                                                    },
                                                    update: (cache, { data: _data }) => {
                                                        if (_data?.delete_Event_by_pk) {
                                                            const data = _data.delete_Event_by_pk;
                                                            cache.modify({
                                                                fields: {
                                                                    Event(
                                                                        existingRefs: Reference[] = [],
                                                                        { readField }
                                                                    ) {
                                                                        cache.evict({
                                                                            id: data.id,
                                                                            fieldName: "EventInfo",
                                                                            broadcast: true,
                                                                        });
                                                                        return existingRefs.filter(
                                                                            (ref) => readField("id", ref) !== data.id
                                                                        );
                                                                    },
                                                                },
                                                            });
                                                        }
                                                    },
                                                });
                                            }
                                        }}
                                        size="xs"
                                        colorScheme="red"
                                    >
                                        <FAIcon iconStyle="s" icon="trash-alt" />
                                    </Button>
                                </Center>
                            );
                        },

                        width: 40,
                        disableResizing: true,
                    },
                ],
            },
        ],
        [
            conference.id,
            contentGroupOptions,
            deleteEvent,
            deleteEventResponse.loading,
            deleteEvents,
            deleteEventsResponse.loading,
            eventBeingDeleted,
            eventBeingUpdated,
            insertEvent,
            insertEventResponse.loading,
            isIndexAffectingEditOngoing,
            onSecondaryPanelOpen,
            roomModeOptions,
            roomOptions,
            updateEventResponse.loading,
            wholeSchedule.data?.ContentGroup,
            wholeSchedule.data?.Event,
            wholeSchedule.data?.Room,
        ]
    );

    const filterTypes: FilterTypes<EventInfoFragment> = React.useMemo(
        () => ({
            // Add a new fuzzyTextFilterFn filter type.
            fuzzyText: fuzzyTextFilterFn,
            // Or, override the default text filter to use
            // "startWith"
            text: startsWithTextFilerFn,
        }),
        []
    );

    const defaultColumn = React.useMemo(
        () => ({
            // Let's set up our default Filter UI
            Filter: DefaultColumnFilter,
            // And also our default editable cell
            Cell: function DefaultCell(props: CellProps<EventInfoFragment>) {
                return <>{props.value}</>;
            },
        }),
        []
    );

    // We need to keep the table from resetting the pageIndex when we
    // Update data. So we can keep track of that flag with a ref.
    const skipResetRef = React.useRef(false);
    const skipReset = skipResetRef.current;

    // When our cell renderer calls updateMyData, we'll use
    // the rowIndex, columnId and new value to update the
    // original data
    const updateMyData = (rowIndex: number, columnId: ColumnId, value: any) => {
        let finalValue = value;
        if (wholeSchedule.data) {
            // We also turn on the flag to not reset the page
            skipResetRef.current = true;

            const original = wholeSchedule.data.Event[rowIndex];
            const updated = { ...original };
            let hasChanged = false;
            switch (columnId) {
                case ColumnId.StartTime:
                    {
                        const originalStart = Date.parse(original.startTime);
                        const originalEnd = originalStart + 1000 * original.durationSeconds;
                        updated.startTime = new Date(value).toISOString();
                        updated.durationSeconds = Math.max(Math.round((originalEnd - value) / 1000), 30);
                        // Make sure we're comparing numeric timestamp, because
                        // string formats differ between client side and server side.
                        hasChanged = value !== originalStart;
                    }
                    break;
                case ColumnId.EndTime:
                    {
                        const startTime = Date.parse(updated.startTime);
                        updated.durationSeconds = Math.max(Math.round((value - startTime) / 1000), 30);
                        hasChanged = updated.durationSeconds !== original.durationSeconds;
                        finalValue = startTime + 1000 * updated.durationSeconds;
                    }
                    break;
                case ColumnId.Room:
                    updated.roomId = value;
                    hasChanged = updated.roomId !== original.roomId;
                    break;
                case ColumnId.RoomMode:
                    updated.intendedRoomModeName = value;
                    hasChanged = updated.intendedRoomModeName !== original.intendedRoomModeName;
                    break;
                case ColumnId.Name:
                    updated.name = value;
                    hasChanged = updated.name !== original.name;
                    break;
                case ColumnId.Content:
                    updated.contentGroupId = value && value.length > 0 ? value : undefined;
                    // Yes, I mean "!=" and not "!==" in this instance /Ed
                    hasChanged = updated.contentGroupId != original.contentGroupId;
                    break;
            }

            if (hasChanged) {
                setEventBeingUpdated(rowIndex);
                updateEvent({
                    variables: {
                        eventId: updated.id,
                        name: updated.name,
                        startTime: updated.startTime,
                        durationSeconds: updated.durationSeconds,
                        roomId: updated.roomId,
                        intendedRoomModeName: updated.intendedRoomModeName,
                        contentGroupId: updated.contentGroupId,
                        originatingDataId: updated.originatingDataId,
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
            }
        }
        return finalValue;
    };

    // After data changes, we turn the flag back off
    // so that if data actually changes when we're not
    // editing it, the page is reset
    React.useEffect(() => {
        skipResetRef.current = false;
    }, [data]);

    const [defaultPageSize, setDefaultPageSize] = useRestorableState<number>(
        "MANAGE_CONFERENCE_SCHEDULE_PAGE_SIZE",
        10,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page, // Instead of using 'rows', we'll use page,
        // which has only the rows for the active page

        // The rest of these things are super handy, too ;)
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize: _setPageSize,
        state: { pageIndex, pageSize, sortBy, groupBy, expanded, filters, selectedRowIds },
    } = useTable<EventInfoFragment>(
        {
            columns,
            data,
            defaultColumn,
            filterTypes,
            // updateMyData isn't part of the API, but
            // anything we put into these options will
            // automatically be available on the instance.
            // That way we can call this function from our
            // cell renderer!
            updateMyData,
            // We also need to pass this so the page doesn't change
            // when we edit the data.
            autoResetPage: !skipReset,
            autoResetSelectedRows: !skipReset,
            disableMultiSort: true,

            groupByFn: (rows: Array<Row<any>>, columnId: string): Record<string, Array<Row<any>>> => {
                if (columnId === ColumnId.Room || columnId === ColumnId.Content) {
                    return defaultGroupByFn(
                        rows.map((row) => {
                            const newRow = { ...row, values: { ...row.values } };
                            row.values[columnId + "_id"] = row.values[columnId]?.id ?? "";
                            return newRow;
                        }),
                        columnId + "_id"
                    );
                }

                return defaultGroupByFn(rows, columnId);
            },

            initialState: {
                pageSize: defaultPageSize,
                sortBy: [
                    {
                        id: "startTime",
                        desc: false,
                    },
                    {
                        id: "endTime",
                        desc: false,
                    },
                ],
            },
        },
        useFilters,
        useGroupBy,
        useSortBy,
        useExpanded,
        usePagination,
        useRowSelect,
        useResizeColumns,
        useFlexLayout
    );

    const setPageSize = useCallback(
        (v) => {
            setDefaultPageSize(v);
            _setPageSize(v);
        },
        [_setPageSize, setDefaultPageSize]
    );

    const tableProps = getTableProps();
    delete tableProps.style;

    const yellowC = useColorModeValue("yellow.300", "yellow.700");
    const [yellow] = useToken("colors", [yellowC]);

    const localTimeZone = useMemo(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }, []);

    const grey = useColorModeValue("gray.200", "gray.600");

    return (
        <>
            {wholeSchedule.error ? (
                <Alert status="error">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <Text>Error loading data.</Text>
                        <Code>{wholeSchedule.error.message}</Code>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {insertEventResponse.error ? (
                <Alert status="error">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <Text>Error creating event.</Text>
                        <Code>{insertEventResponse.error.message}</Code>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {updateEventResponse.error ? (
                <Alert status="error">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <Text>Error saving changes.</Text>
                        <Code>{updateEventResponse.error.message}</Code>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {deleteEventResponse.error ? (
                <Alert status="error">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <Text>Error deleting event.</Text>
                        <Code>{deleteEventResponse.error.message}</Code>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {deleteEventsResponse.error ? (
                <Alert status="error">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <Text>Error deleting events.</Text>
                        <Code>{deleteEventsResponse.error.message}</Code>
                    </AlertDescription>
                </Alert>
            ) : undefined}
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
            <Table
                {...tableProps}
                display="block"
                maxWidth="100%"
                width="auto"
                size="sm"
                variant="striped"
                overflow="auto"
            >
                <Thead>
                    {headerGroups.map((headerGroup) => (
                        // eslint-disable-next-line react/jsx-key
                        <Tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                // eslint-disable-next-line react/jsx-key
                                <Th
                                    {...column.getHeaderProps()}
                                    paddingLeft={
                                        column.id.startsWith("selection-group") ||
                                        column.id === "selection" ||
                                        column.id.startsWith("edit-group") ||
                                        column.id === "edit" ||
                                        column.id.startsWith("delete-group") ||
                                        column.id === "delete"
                                            ? 0
                                            : column.id.startsWith("Time") || column.id === "startTime"
                                            ? 2
                                            : undefined
                                    }
                                    paddingRight={
                                        column.id.startsWith("selection-group") ||
                                        column.id === "selection" ||
                                        column.id.startsWith("edit-group") ||
                                        column.id === "edit"
                                            ? 0
                                            : undefined
                                    }
                                >
                                    <VStack alignItems="flex-start" h="100%">
                                        <HStack
                                            h="100%"
                                            w="100%"
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent={
                                                column.id.startsWith("selection-group") ||
                                                column.id === "selection" ||
                                                column.id.startsWith("edit-group") ||
                                                column.id === "edit"
                                                    ? "center"
                                                    : "flex-start"
                                            }
                                        >
                                            {column.canGroupBy ? (
                                                // If the column can be grouped, let's add a toggle
                                                <Box {...column.getGroupByToggleProps()}>
                                                    {column.isGrouped ? (
                                                        <FAIcon iconStyle="s" icon="object-ungroup" />
                                                    ) : (
                                                        <FAIcon iconStyle="s" icon="object-group" />
                                                    )}
                                                </Box>
                                            ) : null}
                                            <HStack {...column.getSortByToggleProps()} spacing={2} alignItems="center">
                                                <Box>{column.render("Header")}</Box>
                                                {/* Add a sort direction indicator */}
                                                {column.isSorted ? (
                                                    column.isSortedDesc ? (
                                                        <FAIcon iconStyle="s" icon="sort-down" />
                                                    ) : (
                                                        <FAIcon iconStyle="s" icon="sort-up" />
                                                    )
                                                ) : (
                                                    ""
                                                )}
                                            </HStack>
                                            {/* Use column.getResizerProps to hook up the events correctly */}
                                            {column.canResize && (
                                                <>
                                                    <Spacer />
                                                    <Box
                                                        {...column.getResizerProps()}
                                                        style={{ touchAction: "none" }}
                                                        userSelect="none"
                                                        cursor="pointer"
                                                        color={column.isResizing ? "blue.400" : undefined}
                                                    >
                                                        <FAIcon iconStyle="s" icon="arrows-alt-h" />
                                                    </Box>
                                                </>
                                            )}
                                        </HStack>
                                        {/* Render the columns filter UI */}
                                        <Box>{column.canFilter ? column.render("Filter") : null}</Box>
                                    </VStack>
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </Thead>
                <Tbody {...getTableBodyProps()}>
                    {page.map((row) => {
                        prepareRow(row);
                        return (
                            // eslint-disable-next-line react/jsx-key
                            <Tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    const bgColour = rowWarning(row) ? yellow : undefined;
                                    const cellProps = cell.getCellProps();
                                    if (bgColour) {
                                        cellProps.style = {
                                            ...(cellProps.style ?? {}),
                                            backgroundColor: bgColour ?? cellProps.style?.backgroundColor,
                                        };
                                    }
                                    return (
                                        // eslint-disable-next-line react/jsx-key
                                        <Td
                                            {...cellProps}
                                            paddingLeft={
                                                cell.column.id === "selection" ||
                                                cell.column.id === "edit" ||
                                                cell.column.id === "delete"
                                                    ? 0
                                                    : cell.column.id === "startTime"
                                                    ? 2
                                                    : undefined
                                            }
                                            paddingRight={
                                                cell.column.id === "selection" || cell.column.id === "edit"
                                                    ? 0
                                                    : undefined
                                            }
                                        >
                                            {cell.isGrouped ? (
                                                // If it's a grouped cell, add an expander and row count
                                                <HStack>
                                                    <chakra.span minW="min-content">({row.subRows.length})</chakra.span>
                                                    <chakra.span {...row.getToggleRowExpandedProps()}>
                                                        {row.isExpanded ? (
                                                            <FAIcon iconStyle="s" icon="caret-down" />
                                                        ) : (
                                                            <FAIcon iconStyle="s" icon="caret-right" />
                                                        )}
                                                    </chakra.span>{" "}
                                                    {cell.render("Cell", { editable: false })}
                                                </HStack>
                                            ) : cell.isAggregated ? (
                                                // If the cell is aggregated, use the Aggregated
                                                // renderer for cell
                                                cell.render("Aggregated")
                                            ) : cell.isPlaceholder ? null : ( // For cells with repeated values, render null
                                                // Otherwise, just render the regular cell
                                                cell.render("Cell", { editable: true })
                                            )}
                                        </Td>
                                    );
                                })}
                            </Tr>
                        );
                    })}
                    {wholeSchedule.loading ? (
                        <Tr>
                            <Td colSpan={9}>
                                <Center m={2}>
                                    <Spinner label="Loading schedule data" />
                                </Center>
                            </Td>
                        </Tr>
                    ) : undefined}
                </Tbody>
            </Table>
            <Flex justifyContent="center" alignItems="center" gridGap={2} flexDir="row" flexWrap="wrap">
                <ButtonGroup>
                    <Button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                        {"<<"}
                    </Button>
                    <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
                        {"<"}
                    </Button>
                    <Button onClick={() => nextPage()} disabled={!canNextPage}>
                        {">"}
                    </Button>
                    <Button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                        {">>"}
                    </Button>
                </ButtonGroup>
                <Box flexBasis="auto" flexShrink={0}>
                    Page{" "}
                    <chakra.strong>
                        {pageIndex + 1} of {pageOptions.length}
                    </chakra.strong>
                </Box>
                <HStack alignItems="center">
                    <chakra.span flexBasis="auto" flexShrink={0}>
                        | Go to page:{" "}
                    </chakra.span>
                    <NumberInput>
                        <NumberInputField
                            defaultValue={pageIndex + 1}
                            onChange={(e) => {
                                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                gotoPage(page);
                            }}
                            style={{ width: "100px" }}
                        />
                    </NumberInput>
                </HStack>
                <Select
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                    }}
                    maxW={125}
                >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </Select>
            </Flex>
            <EventSecondaryEditor
                yellowC={yellowC}
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
    index,
    onSecondaryPanelClose,
    yellowC,
}: {
    events: readonly EventInfoFragment[];
    attendees: readonly AttendeeInfoFragment[];
    isSecondaryPanelOpen: boolean;
    index: number | null;
    onSecondaryPanelClose: () => void;
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
