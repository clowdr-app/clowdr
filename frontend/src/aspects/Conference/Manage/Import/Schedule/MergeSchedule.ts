import type {
    IntermediaryEventDescriptor,
    IntermediaryEventPersonDescriptor,
    IntermediaryRoomDescriptor,
    IntermediaryScheduleData,
    IntermediaryTagDescriptor,
} from "@clowdr-app/shared-types/build/import/intermediary";
import { v4 as uuidv4 } from "uuid";
import type { EventDescriptor, EventPersonDescriptor, RoomDescriptor } from "../../Schedule/Types";
import type { OriginatingDataDescriptor, TagDescriptor } from "../../Shared/Types";
import {
    ChangeSummary,
    convertOriginatingData,
    findExistingOriginatingData,
    findMatch,
    IdMap,
    isMatch_Id,
    isMatch_Id_Generalised,
    isMatch_OriginatingDataId,
    isMatch_String_EditDistance,
    isMatch_String_Exact,
    mergeFieldInPlace,
    mergeIdInPlace,
    mergeIsNewInPlace,
    mergeLists,
    mergeOriginatingData,
    mergeOriginatingDataIdInPlace,
    sourceIdsEquivalent,
} from "../Merge";

type Context = {
    idMaps: {
        EventPerson: IdMap;
        Event: IdMap;
        Room: IdMap;
        Tag: IdMap;
        OriginatingData: IdMap;
    };

    conferenceId: string;
    originatingDatas: OriginatingDataDescriptor[];
    tags: TagDescriptor[];
};

function convertTagName(context: Context, tagName: string): string {
    const r = findMatch(context, context.tags, tagName, (ctx, item1, item2) =>
        isMatch_String_Exact()(ctx, item1.name, item2)
    );
    if (r !== undefined) {
        return context.tags[r].id;
    } else {
        throw new Error(`Tag ${tagName} not found!`);
    }
}

function findExistingEventPerson(
    ctx: Context,
    items: EventPersonDescriptor[],
    item: IntermediaryEventPersonDescriptor | EventPersonDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("EventPerson")) ??
        findMatch(ctx, items, item, (ctxInner, item1, item2) => {
            if ("roleName" in item2) {
                return (
                    item1.roleName === item2.roleName &&
                    isMatch_String_Exact<
                        Context,
                        EventPersonDescriptor | IntermediaryEventPersonDescriptor,
                        EventPersonDescriptor
                    >("attendeeId")(ctxInner, item1, item2)
                );
            }
            return isMatch_String_Exact<
                Context,
                EventPersonDescriptor | IntermediaryEventPersonDescriptor,
                EventPersonDescriptor
            >("attendeeId")(ctxInner, item1, item2);
        })
    );
}

function mergeEventPerson(
    context: Context,
    item1: EventPersonDescriptor,
    item2: EventPersonDescriptor
): {
    changes: ChangeSummary[];
    result: EventPersonDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as EventPersonDescriptor;

    mergeIdInPlace("EventPerson", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "attendeeId", item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "affiliation", item1, item2);
    mergeFieldInPlace(context, changes, result, "roleName", item1, item2);

    changes.push({
        location: "EventPerson",
        type: "MERGE",
        description: "Merged two matching event-persons.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertEventPerson(
    context: Context,
    item: IntermediaryEventPersonDescriptor | EventPersonDescriptor
): EventPersonDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        roleName: item.roleName,
        name: item.name,
        affiliation: item.affiliation,
        attendeeId: item.attendeeId,
    } as EventPersonDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergeEventPeople(
    context: Context,
    items1: EventPersonDescriptor[],
    items2: (IntermediaryEventPersonDescriptor | EventPersonDescriptor)[]
): {
    changes: ChangeSummary[];
    result: EventPersonDescriptor[];
} {
    return mergeLists(
        context,
        "EventPerson",
        items1,
        items2,
        findExistingEventPerson,
        convertEventPerson,
        mergeEventPerson
    );
}

function convertEvent(context: Context, item: IntermediaryEventDescriptor | EventDescriptor): EventDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        roomId: item.roomId,
        intendedRoomModeName: item.intendedRoomModeName,
        contentGroupId: item.contentGroupId,
        name: item.name,
        startTime: item.startTime,
        durationSeconds: item.durationSeconds,
        people: [],
        tagIds: new Set(),
    } as EventDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    if (item.people) {
        for (const x of item.people) {
            result.people.push(convertEventPerson(context, x));
        }
    }

    if ("tagIds" in item && item.tagIds) {
        item.tagIds.forEach((id) => result.tagIds.add(id));
    }

    if ("tagNames" in item && item.tagNames) {
        for (const x of item.tagNames) {
            result.tagIds.add(convertTagName(context, x));
        }
    }

    return result;
}

function mergeEvent(
    context: Context,
    item1: EventDescriptor,
    item2: EventDescriptor
): {
    result: EventDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as EventDescriptor;

    mergeIdInPlace("Event", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "roomId", item1, item2);
    mergeFieldInPlace(context, changes, result, "intendedRoomModeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "contentGroupId", item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "startTime", item1, item2);
    mergeFieldInPlace(context, changes, result, "durationSeconds", item1, item2);
    mergeFieldInPlace(context, changes, result, "tagIds", item1, item2, true, (_ctx, items1, items2, _prefer) => {
        const tagIdsMerged = new Set(items1);
        items2.forEach((id) => tagIdsMerged.add(id));
        return {
            result: tagIdsMerged,
            changes: [
                {
                    location: "Event.tagIds",
                    description: "Merged tags ids into single set",
                    importData: [items1, items2],
                    newData: tagIdsMerged,
                    type: "MERGE",
                },
            ],
        };
    });
    mergeFieldInPlace(context, changes, result, "people", item1, item2, true, mergeEventPeople);

    changes.push({
        location: "Event",
        type: "MERGE",
        description: "Merged two matching events.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingEvent(
    ctx: Context,
    items: EventDescriptor[],
    item: IntermediaryEventDescriptor | EventDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("Event")) ??
        findMatch(ctx, items, item, isMatch_OriginatingDataId) ??
        findMatch(ctx, items, item, (ctxInner, item1, item2) => {
            return (
                isMatch_String_Exact<Context, IntermediaryEventDescriptor | EventDescriptor, EventDescriptor>("name")(
                    ctxInner,
                    item1,
                    item2
                ) &&
                !!item1.startTime &&
                item1.startTime === item2.startTime
            );
        }) ??
        findMatch(ctx, items, item, (ctxInner, item1, item2) => {
            return (
                isMatch_String_EditDistance<Context, IntermediaryEventDescriptor | EventDescriptor, EventDescriptor>("name")(
                    ctxInner,
                    item1,
                    item2
                ) &&
                !!item1.startTime &&
                item1.startTime === item2.startTime
            );
        })
    );
}

function convertRoom(context: Context, item: IntermediaryRoomDescriptor | RoomDescriptor): RoomDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        currentModeName: item.currentModeName,
        capacity: item.capacity,
        participants: new Set()
    } as RoomDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergeRoom(
    context: Context,
    item1: RoomDescriptor,
    item2: RoomDescriptor
): {
    result: RoomDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as RoomDescriptor;

    mergeIdInPlace("Room", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "currentModeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "capacity", item1, item2);

    changes.push({
        location: "Room",
        type: "MERGE",
        description: "Merged two matching rooms.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingRoom(
    ctx: Context,
    items: RoomDescriptor[],
    item: IntermediaryRoomDescriptor | RoomDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("Room")) ??
        findMatch(ctx, items, item, isMatch_String_Exact("name")) ??
        findMatch(ctx, items, item, isMatch_String_EditDistance("name"))
    );
}

function convertTag(context: Context, item: IntermediaryTagDescriptor | TagDescriptor): TagDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        colour: item.colour ?? "rgba(0,0,0,0)",
    } as TagDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergeTag(
    context: Context,
    item1: TagDescriptor,
    item2: TagDescriptor
): {
    result: TagDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as TagDescriptor;

    mergeIdInPlace("Tag", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "colour", item1, item2);

    changes.push({
        location: "Tag",
        type: "MERGE",
        description: "Merged two matching tags.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingTag(
    ctx: Context,
    items: TagDescriptor[],
    item: IntermediaryTagDescriptor | TagDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("Tag")) ??
        findMatch(ctx, items, item, isMatch_OriginatingDataId) ??
        findMatch(ctx, items, item, isMatch_String_Exact("name")) ??
        findMatch(ctx, items, item, isMatch_String_EditDistance("name"))
    );
}

function mergeData(
    conferenceId: string,
    importData: Record<string, IntermediaryScheduleData>,
    originalEvents: EventDescriptor[],
    originalRooms: RoomDescriptor[],
    originalOriginatingDatas: OriginatingDataDescriptor[],
    originalTags: TagDescriptor[]
): {
    newEvents: EventDescriptor[];
    newTags: TagDescriptor[];
    newOriginatingDatas: OriginatingDataDescriptor[];
    newRooms: RoomDescriptor[];

    changes: ChangeSummary[];
} {
    const dataKeys = Object.keys(importData);
    if (dataKeys.length === 0) {
        throw new Error("No data available");
    }

    const result: {
        idMaps: {
            EventPerson: IdMap;
            Event: IdMap;
            Room: IdMap;
            Tag: IdMap;
            OriginatingData: IdMap;
        };
        conferenceId: string;
        events: EventDescriptor[];
        tags: TagDescriptor[];
        originatingDatas: OriginatingDataDescriptor[];
        rooms: RoomDescriptor[];
    } = {
        idMaps: {
            EventPerson: new Map(),
            Event: new Map(),
            Room: new Map(),
            Tag: new Map(),
            OriginatingData: new Map(),
        },
        conferenceId,
        events: [...originalEvents],
        tags: [...originalTags],
        originatingDatas: [...originalOriginatingDatas],
        rooms: [...originalRooms],
    };
    const changes: ChangeSummary[] = [];

    for (const dataKey of dataKeys) {
        const data = importData[dataKey];

        if (data.originatingDatas) {
            const newDatas = mergeLists(
                result,
                "OriginatingData",
                result.originatingDatas,
                data.originatingDatas,
                findExistingOriginatingData,
                convertOriginatingData,
                mergeOriginatingData
            );
            result.originatingDatas = newDatas.result;
            changes.push(...newDatas.changes);
        }
    }

    for (const dataKey of dataKeys) {
        const data = importData[dataKey];

        if (data.rooms) {
            const newDatas = mergeLists(
                result,
                "Room",
                result.rooms,
                data.rooms,
                findExistingRoom,
                convertRoom,
                mergeRoom
            );
            result.rooms = newDatas.result;
            changes.push(...newDatas.changes);
        }
    }

    for (const dataKey of dataKeys) {
        const data = importData[dataKey];

        if (data.tags) {
            const newDatas = mergeLists(result, "Tag", result.tags, data.tags, findExistingTag, convertTag, mergeTag);
            result.tags = newDatas.result;
            changes.push(...newDatas.changes);
        }
    }

    for (const dataKey of dataKeys) {
        const data = importData[dataKey];

        if (data.events) {
            const newEvents = mergeLists(
                result,
                "Event",
                result.events,
                data.events,
                findExistingEvent,
                convertEvent,
                mergeEvent
            );
            result.events = newEvents.result;
            changes.push(...newEvents.changes);
        }
    }

    return {
        newEvents: result.events,
        newTags: result.tags,
        newOriginatingDatas: result.originatingDatas,
        newRooms: result.rooms,
        changes,
    };
}

export default function mergeContent(
    conferenceId: string,
    importData: Record<string, IntermediaryScheduleData>,
    originalEvents: Map<string, EventDescriptor>,
    originalRooms: Map<string, RoomDescriptor>,
    originalOriginatingDatas: Map<string, OriginatingDataDescriptor>,
    originalTags: Map<string, TagDescriptor>
): {
    changes: ChangeSummary[];
    newEvents: Map<string, EventDescriptor>;
    newTags: Map<string, TagDescriptor>;
    newOriginatingDatas: Map<string, OriginatingDataDescriptor>;
    newRooms: Map<string, RoomDescriptor>;
} {
    const changes: ChangeSummary[] = [];

    const result = mergeData(
        conferenceId,
        importData,
        Array.from(originalEvents.values()),
        Array.from(originalRooms.values()),
        Array.from(originalOriginatingDatas.values()),
        Array.from(originalTags.values())
    );
    changes.push(...result.changes);

    const newEvents = new Map(result.newEvents.map((x) => [x.id, x]));
    const newTags = new Map(result.newTags.map((x) => [x.id, x]));
    const newOriginatingDatas = new Map(result.newOriginatingDatas.map((x) => [x.id, x]));
    const newRooms = new Map(result.newRooms.map((x) => [x.id, x]));

    const unusedOriginatingDataIds = new Set(newOriginatingDatas.keys());
    newEvents.forEach((event) => {
        if (event.originatingDataId) {
            unusedOriginatingDataIds.delete(event.originatingDataId);
        }

        event.people.forEach((item) => {
            if (item.originatingDataId) {
                unusedOriginatingDataIds.delete(item.originatingDataId);
            }
        });
    });

    newRooms.forEach((item) => {
        if (item.originatingDataId) {
            unusedOriginatingDataIds.delete(item.originatingDataId);
        }
    });

    newTags.forEach((item) => {
        if (item.originatingDataId) {
            unusedOriginatingDataIds.delete(item.originatingDataId);
        }
    });

    unusedOriginatingDataIds.forEach((id) => {
        originalOriginatingDatas.delete(id);
    });

    return {
        changes,
        newEvents,
        newTags,
        newOriginatingDatas,
        newRooms,
    };
}
