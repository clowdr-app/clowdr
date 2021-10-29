import type {
    IntermediaryEventDescriptor,
    IntermediaryRoomDescriptor,
    IntermediaryScheduleData,
    IntermediaryTagDescriptor,
} from "@midspace/shared-types/import/intermediary";
import { v4 as uuidv4 } from "uuid";
import type { ExhibitionDescriptor, ItemDescriptor } from "../../Content/Types";
import type { EventDescriptor, RoomDescriptor } from "../../Schedule/Types";
import type { OriginatingDataDescriptor, TagDescriptor } from "../../Shared/Types";
import type { ChangeSummary, IdMap } from "../Merge";
import {
    convertOriginatingData,
    findExistingOriginatingData,
    findMatch,
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
        EventProgramPerson: IdMap;
        Event: IdMap;
        Room: IdMap;
        Tag: IdMap;
        OriginatingData: IdMap;
    };

    conferenceId: string;
    originatingDatas: OriginatingDataDescriptor[];
    tags: TagDescriptor[];
    exhibitions: ExhibitionDescriptor[];
    rooms: RoomDescriptor[];
    items: ItemDescriptor[];
};

function convertExhibitionName(context: Context, name: string): string {
    const r = findMatch(context, context.exhibitions, name, (ctx, item1, item2) =>
        isMatch_String_Exact()(ctx, item1.name, item2)
    );
    if (r !== undefined) {
        return context.exhibitions[r].id;
    } else {
        throw new Error(`Exhibition ${name} not found!`);
    }
}

function convertEvent(context: Context, item: IntermediaryEventDescriptor | EventDescriptor): EventDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        roomId: item.roomId,
        intendedRoomModeName: item.intendedRoomModeName,
        itemId: item.itemId,
        name: item.name,
        startTime: typeof item.startTime === "number" ? new Date(item.startTime).toISOString() : item.startTime,
        durationSeconds: item.durationSeconds,
        people: [],
        exhibitionId: "exhibitionId" in item && item.exhibitionId ? item.exhibitionId : undefined,
    } as EventDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    if ("exhibitionName" in item && item.exhibitionName) {
        result.exhibitionId = convertExhibitionName(context, item.exhibitionName);
    }

    if ("roomName" in item && item.roomName && !item.roomId) {
        const r = findMatch(context, context.rooms, item.roomName, (ctx, item1, item2) =>
            isMatch_String_Exact()(ctx, item1.name, item2)
        );
        if (r !== undefined) {
            result.roomId = context.rooms[r].id;
        }
    }

    if ("itemSourceId" in item && item.itemSourceId && item.itemSourceId !== "" && !item.itemId) {
        const srcId = item.itemSourceId;
        const groups = context.items.filter((g) => {
            if (g.originatingDataId) {
                const od = context.originatingDatas.find((x) =>
                    isMatch_Id_Generalised("OriginatingData", "id", "originatingDataId")(context, x, g)
                );
                if (od) {
                    if (sourceIdsEquivalent(od.sourceId, srcId, "L")) {
                        return true;
                    }
                }
            }
            return false;
        });
        if (groups.length === 1) {
            result.itemId = groups[0].id;
        } else if (groups.length > 1) {
            console.error("Multiple possible content groups could match this event", { item, groups });
            throw new Error(
                "Multiple possible content groups could match this event:\n" + JSON.stringify({ item, groups }, null, 2)
            );
        } else {
            console.error("No content groups match this event", { item, groups });
            throw new Error("No content groups match this event!:\n" + JSON.stringify({ item, groups }, null, 2));
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
    mergeFieldInPlace(context, changes, result, "itemId", item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "startTime", item1, item2);
    mergeFieldInPlace(context, changes, result, "durationSeconds", item1, item2);
    mergeFieldInPlace(context, changes, result, "exhibitionId", item1, item2);

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
            if ("roomName" in item2 && item2.roomName && !item2.roomId) {
                const item2RoomIdx = findExistingRoom(ctxInner, ctxInner.rooms, { name: item2.roomName });
                if (item2RoomIdx !== undefined) {
                    const item2Room = ctxInner.rooms[item2RoomIdx];
                    return (
                        isMatch_String_Exact<Context, IntermediaryEventDescriptor | EventDescriptor, EventDescriptor>(
                            "name"
                        )(ctxInner, item1, item2) &&
                        item2.startTime !== undefined &&
                        new Date(item1.startTime).getTime() === item2.startTime &&
                        (isMatch_Id_Generalised("Room", "roomId", "id")(ctxInner, item1, item2Room) ||
                            isMatch_Id_Generalised("Room", "id", "roomId")(ctxInner, item2Room, item1))
                    );
                }
                return false;
            } else {
                return (
                    isMatch_String_Exact<Context, IntermediaryEventDescriptor | EventDescriptor, EventDescriptor>(
                        "name"
                    )(ctxInner, item1, item2) &&
                    item2.startTime !== undefined &&
                    new Date(item1.startTime).getTime() === new Date(item2.startTime).getTime() &&
                    (isMatch_Id_Generalised("Room", "roomId", "roomId")(ctxInner, item1, item2) ||
                        isMatch_Id_Generalised("Room", "roomId", "roomId")(ctxInner, item2, item1))
                );
            }
        })
    );
}

function convertRoom(context: Context, item: IntermediaryRoomDescriptor | RoomDescriptor): RoomDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        capacity: item.capacity,
        priority: item.priority ?? 10,
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
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "capacity", item1, item2);
    mergeFieldInPlace(context, changes, result, "priority", item1, item2);

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
    return findMatch(ctx, items, item, isMatch_Id("Room")) ?? findMatch(ctx, items, item, isMatch_String_Exact("name"));
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
    originalTags: TagDescriptor[],
    originalExhibitions: ExhibitionDescriptor[],
    items: ItemDescriptor[]
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
            EventProgramPerson: IdMap;
            Event: IdMap;
            Room: IdMap;
            Tag: IdMap;
            OriginatingData: IdMap;
        };
        conferenceId: string;
        events: EventDescriptor[];
        tags: TagDescriptor[];
        exhibitions: ExhibitionDescriptor[];
        originatingDatas: OriginatingDataDescriptor[];
        rooms: RoomDescriptor[];
        items: ItemDescriptor[];
    } = {
        idMaps: {
            EventProgramPerson: new Map(),
            Event: new Map(),
            Room: new Map(),
            Tag: new Map(),
            OriginatingData: new Map(),
        },
        conferenceId,
        events: [...originalEvents],
        tags: [...originalTags],
        exhibitions: [...originalExhibitions],
        originatingDatas: [...originalOriginatingDatas],
        rooms: [...originalRooms],
        items: [...items],
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

export default function mergeSchedule(
    conferenceId: string,
    importData: Record<string, IntermediaryScheduleData>,
    originalEvents: Map<string, EventDescriptor>,
    originalRooms: Map<string, RoomDescriptor>,
    originalOriginatingDatas: Map<string, OriginatingDataDescriptor>,
    originalTags: Map<string, TagDescriptor>,
    originalExhibitions: Map<string, ExhibitionDescriptor>,
    items: ItemDescriptor[]
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
        Array.from(originalTags.values()),
        Array.from(originalExhibitions.values()),
        items
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
        newOriginatingDatas.delete(id);
    });

    return {
        changes,
        newEvents,
        newTags,
        newOriginatingDatas,
        newRooms,
    };
}
