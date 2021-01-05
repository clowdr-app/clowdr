import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Heading,
    useDisclosure,
} from "@chakra-ui/react";
import assert from "assert";
import { addHours, addSeconds, differenceInSeconds, startOfHour } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Permission_Enum, RoomMode_Enum } from "../../../generated/graphql";
import CRUDTable, {
    CRUDTableProps,
    defaultDateTimeFilter,
    defaultSelectFilter,
    defaultStringFilter,
    FieldType,
    PrimaryField,
    SelectOption,
    UpdateResult,
} from "../../CRUDTable/CRUDTable";
import PageNotFound from "../../Errors/PageNotFound";
import isValidUUID from "../../Utils/isValidUUID";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import type { ContentGroupDescriptor } from "./Content/Types";
import { EventPersonsModal } from "./Schedule/EventPersonsModal";
import type { AttendeeDescriptor, EventDescriptor, RoomDescriptor } from "./Schedule/Types";
import { useSaveScheduleDiff } from "./Schedule/useSaveScheduleDiff";
import type { OriginatingDataDescriptor, TagDescriptor } from "./Shared/Types";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

const ScheduleCRUDTable = (props: Readonly<CRUDTableProps<EventDescriptor, "id">>) => CRUDTable(props);

function EditableScheduleCRUDTable() {
    const saveScheduleDiff = useSaveScheduleDiff();

    const roomModeOptions: SelectOption[] = useMemo(() => {
        return Object.keys(RoomMode_Enum)
            .filter((key) => typeof (RoomMode_Enum as any)[key] === "string")
            .map((key) => {
                const v = (RoomMode_Enum as any)[key] as string;
                return {
                    label: key,
                    value: v,
                };
            });
    }, []);

    const [allGroupsMap, setAllContentGroupsMap] = useState<Map<string, ContentGroupDescriptor>>();
    const [allEventsMap, setAllEventsMap] = useState<Map<string, EventDescriptor>>();
    const [allTagsMap, setAllTagsMap] = useState<Map<string, TagDescriptor>>();
    const [allRoomsMap, setAllRoomsMap] = useState<Map<string, RoomDescriptor>>();
    const [allOriginatingDatasMap, setAllOriginatingDatasMap] = useState<Map<string, OriginatingDataDescriptor>>();
    const [allAttendeesMap, setAllAttendeesMap] = useState<Map<string, AttendeeDescriptor>>();

    // TODO: tags modal
    const [dirtyTagIds, setDirtyTagIds] = useState<Set<string>>(new Set());

    const roomOptions: SelectOption[] = useMemo(() => {
        return allRoomsMap
            ? Array.from(allRoomsMap, ([key, value]) => ({
                  label: value.name,
                  value: key,
              }))
            : [];
    }, [allRoomsMap]);

    const fields = useMemo(() => {
        const result: {
            [K: string]: Readonly<PrimaryField<EventDescriptor, any>>;
        } = {
            name: {
                heading: "Name",
                ariaLabel: "Name",
                description: "Name of the event",
                isHidden: false,
                isEditable: true,
                defaultValue: "New event name",
                insert: (item, v) => {
                    return {
                        ...item,
                        name: v,
                    };
                },
                extract: (v) => v.name,
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (v) => v.length >= 3 || ["Name must be at least 3 characters"],
            },
            startTime: {
                heading: "Start Time",
                ariaLabel: "Start Time",
                description: "Start time of the event",
                isHidden: false,
                isEditable: true,
                defaultValue: addHours(startOfHour(new Date()), 1).toISOString(),
                insert: (item, v) => {
                    return {
                        ...item,
                        startTime: v,
                    };
                },
                extract: (v) => v.startTime,
                spec: {
                    fieldType: FieldType.datetime,
                    convertFromUI: (x) => x.toISOString(),
                    convertToUI: (x) => new Date(Date.parse(x)),
                    filter: defaultDateTimeFilter,
                },
                validate: (v) => !!v || ["Date must be valid"],
            },
            endTime: {
                heading: "End Time",
                ariaLabel: "End Time",
                description: "End time of the event",
                isHidden: false,
                isEditable: true,
                defaultValue: addHours(startOfHour(new Date()), 2).toISOString(),
                insert: (item, v) => {
                    const endTime = Date.parse(v);
                    const modification =
                        item.startTime && !isNaN(endTime)
                            ? {
                                  durationSeconds: differenceInSeconds(endTime, Date.parse(item.startTime)),
                              }
                            : {};
                    return {
                        ...item,
                        ...modification,
                    };
                },
                extract: (v) => {
                    const startTime = Date.parse(v.startTime);
                    if (isNaN(startTime)) {
                        return "";
                    } else {
                        return addSeconds(startTime, v.durationSeconds).toISOString();
                    }
                },
                spec: {
                    fieldType: FieldType.datetime,
                    convertFromUI: (x) => x.toISOString(),
                    convertToUI: (x) => new Date(Date.parse(x)),
                    filter: defaultDateTimeFilter,
                },
                validate: (v) => !!v || ["Date must be valid ISO8601 string"],
            },
            roomMode: {
                heading: "Room Mode",
                ariaLabel: "Room Mode",
                description: "Mode of the room during this event",
                isHidden: false,
                isEditable: true,
                defaultValue: RoomMode_Enum.Breakout,
                insert: (item, v) => {
                    return {
                        ...item,
                        intendedRoomModeName: v,
                    };
                },
                extract: (item) => item.intendedRoomModeName,
                spec: {
                    fieldType: FieldType.select,
                    convertFromUI: (opt) => {
                        assert(!(opt instanceof Array) || opt.length === 1);
                        if (opt instanceof Array) {
                            return opt[0].value;
                        } else {
                            return opt.value;
                        }
                    },
                    convertToUI: (modeName) => {
                        const opt = roomModeOptions.find((x) => x.value === modeName);
                        if (opt) {
                            return opt;
                        } else {
                            return {
                                label: `<Unsupported (${modeName})>`,
                                value: modeName,
                            };
                        }
                    },
                    multiSelect: false,
                    options: () => roomModeOptions,
                    filter: defaultSelectFilter,
                },
                validate: (v) => !!roomModeOptions.find((x) => x.value === v) || ["Must choose a room mode"],
            },
            room: {
                heading: "Room",
                ariaLabel: "Room",
                description: "Room in which the event takes place",
                isHidden: false,
                isEditable: true,
                insert: (item, v) => {
                    return {
                        ...item,
                        roomId: v,
                    };
                },
                extract: (item) => item.roomId,
                spec: {
                    fieldType: FieldType.select,
                    convertFromUI: (opt) => {
                        assert(!(opt instanceof Array) || opt.length === 1);
                        if (opt instanceof Array) {
                            return opt[0].value;
                        } else {
                            return opt.value;
                        }
                    },
                    convertToUI: (roomId) => {
                        const name = allRoomsMap?.get(roomId)?.name;
                        if (name) {
                            return {
                                label: name,
                                value: roomId,
                            };
                        } else {
                            return {
                                label: `Unknown room ${roomId}`,
                                value: roomId,
                            };
                        }
                    },
                    multiSelect: false,
                    options: () => roomOptions,
                    filter: defaultSelectFilter,
                },
                validate: (v) => !!roomOptions.find((x) => x.value === v) || ["Must choose a room mode"],
            },
        };
        return result;
    }, [allRoomsMap, roomModeOptions, roomOptions]);

    useEffect(() => {
        if (!saveScheduleDiff.loadingContent && !saveScheduleDiff.errorContent && saveScheduleDiff.originalEvents) {
            const newEventsMap = new Map<string, EventDescriptor>();
            const newGroupsMap = new Map<string, ContentGroupDescriptor>();
            const newTagsMap = new Map<string, TagDescriptor>();
            const newOriginatingDatasMap = new Map<string, OriginatingDataDescriptor>();
            const newRoomsMap = new Map<string, RoomDescriptor>();
            const newAttendeesMap = new Map<string, AttendeeDescriptor>();

            for (const [key, value] of saveScheduleDiff.originalEvents) {
                newEventsMap.set(key, { ...value });
            }

            for (const [key, value] of saveScheduleDiff.originalTags) {
                newTagsMap.set(key, { ...value });
            }

            for (const [key, value] of saveScheduleDiff.originalOriginatingDatas) {
                newOriginatingDatasMap.set(key, { ...value });
            }

            for (const [key, value] of saveScheduleDiff.originalRooms) {
                newRoomsMap.set(key, { ...value });
            }

            for (const group of saveScheduleDiff.contentGroups) {
                newGroupsMap.set(group.id, { ...group });
            }

            for (const [key, value] of saveScheduleDiff.originalAttendees) {
                newAttendeesMap.set(key, { ...value });
            }

            setAllEventsMap(newEventsMap);
            setAllContentGroupsMap(newGroupsMap);
            setAllTagsMap(newTagsMap);
            setAllRoomsMap(newRoomsMap);
            setAllOriginatingDatasMap(newOriginatingDatasMap);
            setAllAttendeesMap(newAttendeesMap);
        }
    }, [
        saveScheduleDiff.contentGroups,
        saveScheduleDiff.errorContent,
        saveScheduleDiff.loadingContent,
        saveScheduleDiff.originalAttendees,
        saveScheduleDiff.originalEvents,
        saveScheduleDiff.originalOriginatingDatas,
        saveScheduleDiff.originalRooms,
        saveScheduleDiff.originalTags,
    ]);

    return (
        <ScheduleCRUDTable
            key="crud-table"
            data={allEventsMap ?? new Map()}
            csud={{
                cudCallbacks: {
                    generateTemporaryKey: () => uuidv4(),
                    create: (tempKey, event) => {
                        const newEvent = {
                            ...event,
                            durationSeconds: event.endTime
                                ? differenceInSeconds(
                                      Date.parse(event.endTime),
                                      event.startTime ? Date.parse(event.startTime) : new Date()
                                  )
                                : 300,
                            isNew: true,
                            id: tempKey,
                            people: [],
                            tagIds: new Set(),
                        } as EventDescriptor;
                        setAllEventsMap((oldData) => {
                            const newData = new Map(oldData ? oldData.entries() : []);
                            newData.set(tempKey, newEvent);
                            return newData;
                        });
                        return true;
                    },
                    update: (events) => {
                        const results: Map<string, UpdateResult> = new Map();
                        events.forEach((item, key) => {
                            results.set(key, true);
                        });

                        setAllEventsMap((oldData) => {
                            if (oldData) {
                                const newData = new Map(oldData.entries());
                                events.forEach((item, key) => {
                                    newData.set(key, item);
                                });
                                return newData;
                            }
                            return undefined;
                        });

                        return results;
                    },
                    delete: (keys) => {
                        const results: Map<string, boolean> = new Map();
                        keys.forEach((key) => {
                            results.set(key, true);
                        });

                        setAllEventsMap((oldData) => {
                            const newData = new Map(oldData ? oldData.entries() : []);
                            keys.forEach((key) => {
                                newData.delete(key);
                            });
                            return newData;
                        });

                        return results;
                    },
                    save: async (keys) => {
                        assert(allEventsMap);
                        assert(allGroupsMap);
                        assert(allOriginatingDatasMap);
                        assert(allTagsMap);
                        assert(allRoomsMap);
                        assert(!saveScheduleDiff.loadingContent);
                        assert(!saveScheduleDiff.errorContent);
                        assert(saveScheduleDiff.originalEvents);
                        const results = await saveScheduleDiff.saveScheduleDiff(
                            {
                                eventKeys: keys,
                                originatingDataKeys: new Set(),
                                roomKeys: new Set(),
                                tagKeys: new Set(),
                            },
                            allTagsMap,
                            allOriginatingDatasMap,
                            allEventsMap,
                            allRoomsMap
                        );

                        setDirtyTagIds((oldTagIds) => {
                            const newTagIds = new Set(oldTagIds);
                            for (const [tagId, result] of results.tags) {
                                if (result) {
                                    newTagIds.delete(tagId);
                                }
                            }
                            return newTagIds;
                        });

                        // TODO: update other dirty IDs

                        return results.events;
                    },
                },
            }}
            primaryFields={{
                keyField: {
                    heading: "Id",
                    ariaLabel: "Unique identifier",
                    description: "Unique identifier",
                    isHidden: true,
                    insert: (item, v) => {
                        return {
                            ...item,
                            id: v,
                        };
                    },
                    extract: (v) => v.id,
                    spec: {
                        fieldType: FieldType.string,
                        convertToUI: (x) => x,
                        disallowSpaces: true,
                    },
                    validate: (v) => isValidUUID(v) || ["Invalid UUID"],
                    getRowTitle: (v) => v.name,
                },
                otherFields: fields,
            }}
            secondaryFields={{
                editSingle: (key, onClose, isDirty, markDirty) => {
                    assert(allEventsMap);
                    assert(allAttendeesMap);
                    return EventSecondaryEditor(
                        allEventsMap,
                        allAttendeesMap,
                        key,
                        markDirty,
                        isDirty,
                        setAllEventsMap
                    );
                },
            }}
        />
    );
}

export default function ManageConferenceSchedulePage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Events
            </Heading>

            <EditableScheduleCRUDTable />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function EventSecondaryEditor(
    allEventsMap: Map<string, EventDescriptor>,
    allAttendeesMap: Map<string, AttendeeDescriptor>,
    key: string,
    markDirty: () => void,
    isDirty: boolean,
    setAllEventsMap: React.Dispatch<React.SetStateAction<Map<string, EventDescriptor> | undefined>>
) {
    const event = allEventsMap.get(key);

    const editor = (
        <>
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
                                event={event}
                                isDirty={isDirty}
                                markDirty={markDirty}
                                attendeeMap={allAttendeesMap}
                                setAllEventsMap={setAllEventsMap}
                            />
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
            ) : (
                <>No event found.</>
            )}
        </>
    );

    return {
        includeCloseButton: true,
        editorElement: editor,
        footerButtons: [],
    };
}

function EventPeopleEditorModal({
    event,
    attendeeMap,
    isDirty,
    markDirty,
    setAllEventsMap,
}: {
    event: EventDescriptor;
    attendeeMap: Map<string, AttendeeDescriptor>;
    isDirty: boolean;
    markDirty: () => void;
    setAllEventsMap: React.Dispatch<React.SetStateAction<Map<string, EventDescriptor> | undefined>>;
}) {
    const { isOpen: isUploadersOpen, onOpen: onUploadersOpen, onClose: onUploadersClose } = useDisclosure();
    const accordionContents = (
        <>
            <EventPersonsModal
                isEventDirty={isDirty}
                isOpen={isUploadersOpen}
                onOpen={onUploadersOpen}
                onClose={onUploadersClose}
                event={event}
                attendeeMap={attendeeMap}
                insertEventPerson={(eventPerson) => {
                    markDirty();
                    setAllEventsMap((oldEvents) => {
                        const newEvents: Map<string, EventDescriptor> = oldEvents ? new Map(oldEvents) : new Map();
                        const existingEvent = newEvents.get(event.id);
                        assert(existingEvent);
                        newEvents.set(event.id, {
                            ...existingEvent,
                            people: [...existingEvent.people, eventPerson],
                        });
                        return newEvents;
                    });
                }}
                updateEventPerson={(eventPerson) => {
                    markDirty();
                    setAllEventsMap((oldEvents) => {
                        const newEvents: Map<string, EventDescriptor> = oldEvents ? new Map(oldEvents) : new Map();
                        const existingEvent = newEvents.get(event.id);
                        assert(existingEvent);
                        newEvents.set(event.id, {
                            ...existingEvent,
                            people: existingEvent.people.map((existingEventPerson) =>
                                existingEventPerson.id === eventPerson.id ? eventPerson : existingEventPerson
                            ),
                        });
                        return newEvents;
                    });
                }}
                deleteEventPerson={(eventPersonId) => {
                    markDirty();
                    setAllEventsMap((oldEvents) => {
                        const newEvents: Map<string, EventDescriptor> = oldEvents ? new Map(oldEvents) : new Map();
                        const existingEvent = newEvents.get(event.id);
                        assert(existingEvent);
                        newEvents.set(event.id, {
                            ...existingEvent,
                            people: existingEvent.people.filter(
                                (existingEventPerson) => existingEventPerson.id !== eventPersonId
                            ),
                        });
                        return newEvents;
                    });
                }}
            />
        </>
    );
    return accordionContents;
}
