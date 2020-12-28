import type {
    IntermediaryData,
    IntermediaryGroupDescriptor,
    IntermediaryGroupHallwayDescriptor,
    IntermediaryGroupPersonDescriptor,
    IntermediaryHallwayDescriptor,
    IntermediaryItemDescriptor,
    IntermediaryOriginatingDataDescriptor,
    IntermediaryPersonDescriptor,
    IntermediaryRequiredItemDescriptor,
    IntermediaryTagDescriptor,
    IntermediaryUploaderDescriptor,
} from "@clowdr-app/shared-types/build/import/intermediary";
import { v4 as uuidv4 } from "uuid";
import type {
    ContentGroupDescriptor,
    ContentGroupHallwayDescriptor,
    ContentGroupPersonDescriptor,
    ContentItemDescriptor,
    ContentPersonDescriptor,
    HallwayDescriptor,
    OriginatingDataDescriptor,
    RequiredContentItemDescriptor,
    TagDescriptor,
    UploaderDescriptor,
} from "../../Content/Types";
import {
    ChangeSummary,
    findExistingNamedItem,
    findExistingOriginatingData,
    findMatch,
    isMatch_Id,
    isMatch_OriginatingDataId,
    isMatch_String_EditDistance,
    isMatch_String_Exact,
    mergeFieldInPlace,
    mergeIsNewInPlace,
    mergeLists,
} from "../Merge";

function findUploader(
    items: UploaderDescriptor[],
    item: IntermediaryUploaderDescriptor | UploaderDescriptor
): number | undefined {
    return findExistingNamedItem(items, item);
}

function mergeUploader<C>(
    context: C,
    item1: UploaderDescriptor,
    item2: UploaderDescriptor
): {
    result: UploaderDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];
    const result = {} as UploaderDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "email", item1, item2);

    changes.push({
        location: "Uploader",
        type: "MERGE",
        description: "Merged two matching uploaders.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertUploader<C>(
    requiredContentItemId: string
): (context: C, item: IntermediaryUploaderDescriptor | UploaderDescriptor) => UploaderDescriptor {
    return (_context, item) => {
        const result = { ...item } as UploaderDescriptor;
        if ("isNew" in item) {
            result.isNew = item.isNew;
        }
        if ("emailsSentCount" in item) {
            result.emailsSentCount = item.emailsSentCount;
        } else {
            result.emailsSentCount = 0;
        }

        result.requiredContentItemId = requiredContentItemId;

        return result;
    };
}

function mergeUploaders<C>(
    requiredContentItemId: string
): (
    context: C,
    items1: UploaderDescriptor[],
    items2: (IntermediaryUploaderDescriptor | UploaderDescriptor)[]
) => {
    changes: ChangeSummary[];
    result: UploaderDescriptor[];
} {
    return (context, items1, items2) => {
        return mergeLists<C, UploaderDescriptor, IntermediaryUploaderDescriptor>(
            context,
            "Uploader",
            items1,
            items2,
            findUploader,
            convertUploader(requiredContentItemId),
            mergeUploader
        );
    };
}

type Context = {
    conferenceId: string;
    originatingDatas: OriginatingDataDescriptor[];
    people: ContentPersonDescriptor[];
    tags: TagDescriptor[];
};

function mergeRequiredItem(
    context: Context,
    item1: RequiredContentItemDescriptor,
    item2: RequiredContentItemDescriptor
): {
    changes: ChangeSummary[];
    result: RequiredContentItemDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as RequiredContentItemDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "originatingDataId", item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "typeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "uploadsRemaining", item1, item2, true, (_ctx, x, y) => {
        if (x !== null) {
            if (y !== null) {
                const r = Math.max(x, y);
                return {
                    result: r,
                    changes: [
                        {
                            type: "MERGE",
                            location: "RequiredContentItem.uploadsRemaining",
                            description: "Merged uploads remaining to maximum of the two values.",
                            importData: [x, y],
                            newData: r,
                        },
                    ],
                };
            } else {
                return {
                    changes: [
                        {
                            type: "MERGE",
                            location: "uploadsRemaining merger",
                            description: "Chose the lefthand value as the right was empty.",
                            importData: [x, y],
                            newData: [x],
                        },
                    ],
                    result: x,
                };
            }
        } else if (y !== null) {
            return {
                changes: [
                    {
                        type: "MERGE",
                        location: "uploadsRemaining merger",
                        description: "Chose the righthand value as the left was empty.",
                        importData: [x, y],
                        newData: [y],
                    },
                ],
                result: y,
            };
        }
    });
    mergeFieldInPlace(context, changes, result, "uploaders", item1, item2, true, mergeUploaders(result.id));

    changes.push({
        location: "RequiredContentItem",
        type: "MERGE",
        description: "Merged two matching required items.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertRequiredItem(
    context: Context,
    item: IntermediaryRequiredItemDescriptor | RequiredContentItemDescriptor
): RequiredContentItemDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        typeName: item.typeName,
        uploadsRemaining: item.uploadsRemaining,
        uploaders: [],
    } as RequiredContentItemDescriptor;

    const origDataIdx = findExistingOriginatingData(context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    const uploaderConverter = convertUploader(result.id);
    if (item.uploaders) {
        for (const uploader of item.uploaders) {
            result.uploaders.push(uploaderConverter(context, uploader));
        }
    }

    return result;
}

function mergeRequiredItems(
    context: Context,
    items1: RequiredContentItemDescriptor[],
    items2: (IntermediaryRequiredItemDescriptor | RequiredContentItemDescriptor)[]
): {
    changes: ChangeSummary[];
    result: RequiredContentItemDescriptor[];
} {
    return mergeLists(
        context,
        "RequiredContentItem",
        items1,
        items2,
        findExistingNamedItem,
        convertRequiredItem,
        mergeRequiredItem
    );
}

function mergeItem(
    context: Context,
    item1: ContentItemDescriptor,
    item2: ContentItemDescriptor
): {
    changes: ChangeSummary[];
    result: ContentItemDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ContentItemDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "originatingDataId", item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "typeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "isHidden", item1, item2);
    mergeFieldInPlace(context, changes, result, "data", item1, item2);

    changes.push({
        location: "ContentItem",
        type: "MERGE",
        description: "Merged two matching items.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertItem(
    context: Context,
    item: IntermediaryItemDescriptor | ContentItemDescriptor
): ContentItemDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        typeName: item.typeName,
        data: item.data,
        isHidden: item.isHidden,
        layoutData: "layoutData" in item ? item.layoutData : undefined,
        requiredContentId: "requiredContentId" in item ? item.requiredContentId : undefined,
    } as ContentItemDescriptor;

    const origDataIdx = findExistingOriginatingData(context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergeItems(
    context: Context,
    items1: ContentItemDescriptor[],
    items2: (IntermediaryItemDescriptor | ContentItemDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ContentItemDescriptor[];
} {
    return mergeLists(context, "ContentItem", items1, items2, findExistingNamedItem, convertItem, mergeItem);
}

function convertTagName(context: Context, tagName: string): string {
    const r = findMatch(context.tags, tagName, (item1, item2) => isMatch_String_Exact()(item1.name, item2));
    if (r !== undefined) {
        return context.tags[r].id;
    } else {
        throw new Error(`Tag ${tagName} not found!`);
    }
}

function findExistingGroupPerson(
    items: ContentGroupPersonDescriptor[],
    item: IntermediaryGroupPersonDescriptor | ContentGroupPersonDescriptor
): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        // TODO: Handle the fact that personId could have been remapped during a merge
        findMatch(items, item, isMatch_String_Exact("personId"))
        // TODO: Find by name_affiliation
    );
}

function mergeGroupPerson(
    context: Context,
    item1: ContentGroupPersonDescriptor,
    item2: ContentGroupPersonDescriptor
): {
    changes: ChangeSummary[];
    result: ContentGroupPersonDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ContentGroupPersonDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "conferenceId", item1, item2);
    mergeFieldInPlace(context, changes, result, "groupId", item1, item2, false);
    mergeFieldInPlace(context, changes, result, "personId", item1, item2);
    mergeFieldInPlace(context, changes, result, "priority", item1, item2);
    mergeFieldInPlace(context, changes, result, "roleName", item1, item2);

    changes.push({
        location: "ContentGroupPerson",
        type: "MERGE",
        description: "Merged two matching group-persons.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertGroupPerson(
    context: Context,
    item: IntermediaryGroupPersonDescriptor | ContentGroupPersonDescriptor
): ContentGroupPersonDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        conferenceId: context.conferenceId,
        groupId: "groupId" in item ? item.groupId : undefined,
        roleName: "roleName" in item ? item.roleName : item.role,
        priority: item.priority,
    } as ContentGroupPersonDescriptor;

    const personIdx = findExistingPersonForGroup(context.people, item);
    if (personIdx !== undefined) {
        result.personId = context.people[personIdx].id;
    }

    return result;
}

function mergeGroupPeople(
    context: Context,
    items1: ContentGroupPersonDescriptor[],
    items2: (IntermediaryGroupPersonDescriptor | ContentGroupPersonDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ContentGroupPersonDescriptor[];
} {
    return mergeLists(
        context,
        "ContentGroupPerson",
        items1,
        items2,
        findExistingGroupPerson,
        convertGroupPerson,
        mergeGroupPerson
    );
}

function convertGroupHallway(
    context: Context,
    groupHallway: IntermediaryGroupHallwayDescriptor | ContentGroupHallwayDescriptor
): ContentGroupHallwayDescriptor {
    const result = {
        id: groupHallway.id ?? uuidv4(),
        isNew: ("isNew" in groupHallway && groupHallway.isNew) || !groupHallway.id,
        conferenceId: context.conferenceId,
        groupId: "groupId" in groupHallway ? groupHallway.groupId : undefined,
        hallwayId: groupHallway.hallwayId,
        layout: groupHallway.layout,
        priority: groupHallway.priority,
    } as ContentGroupHallwayDescriptor;

    return result;
}

function mergeGroupHallway(
    context: Context,
    item1: ContentGroupHallwayDescriptor,
    item2: ContentGroupHallwayDescriptor
): {
    changes: ChangeSummary[];
    result: ContentGroupHallwayDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ContentGroupHallwayDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "hallwayId", item1, item2);
    mergeFieldInPlace(context, changes, result, "layout", item1, item2);
    mergeFieldInPlace(context, changes, result, "priority", item1, item2);

    changes.push({
        location: "ContentGroupHallway",
        type: "MERGE",
        description: "Merged two matching group-hallways.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingGroupHallway(
    items: ContentGroupHallwayDescriptor[],
    item: IntermediaryGroupHallwayDescriptor | ContentGroupHallwayDescriptor
): number | undefined {
    // TODO: Handle the fact that hallwayId could've been remapped during a merge
    return findMatch(items, item, isMatch_Id) || findMatch(items, item, isMatch_String_Exact("hallwayId"));
}

function mergeGroupHallways(
    context: Context,
    items1: ContentGroupHallwayDescriptor[],
    items2: (IntermediaryGroupHallwayDescriptor | ContentGroupHallwayDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ContentGroupHallwayDescriptor[];
} {
    return mergeLists(
        context,
        "ContentGroupHallway",
        items1,
        items2,
        findExistingGroupHallway,
        convertGroupHallway,
        mergeGroupHallway
    );
}

function convertGroup(
    context: Context,
    item: IntermediaryGroupDescriptor | ContentGroupDescriptor
): ContentGroupDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        title: item.title,
        typeName: item.typeName,
        shortTitle: "shortTitle" in item ? item.shortTitle : undefined,
        hallways: [],
        items: [],
        people: [],
        requiredItems: [],
        tagIds: new Set(),
    } as ContentGroupDescriptor;

    const origDataIdx = findExistingOriginatingData(context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    if (item.items) {
        for (const x of item.items) {
            result.items.push(convertItem(context, x));
        }
    }

    if (item.requiredItems) {
        for (const x of item.requiredItems) {
            result.requiredItems.push(convertRequiredItem(context, x));
        }
    }

    if (item.hallways) {
        for (const x of item.hallways) {
            result.hallways.push(convertGroupHallway(context, x));
        }
    }

    if (item.people) {
        for (const x of item.people) {
            result.people.push(convertGroupPerson(context, x));
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

function mergeGroup(
    context: Context,
    item1: ContentGroupDescriptor,
    item2: ContentGroupDescriptor
): {
    result: ContentGroupDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ContentGroupDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "originatingDataId", item1, item2);
    mergeFieldInPlace(context, changes, result, "title", item1, item2);
    mergeFieldInPlace(context, changes, result, "typeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "items", item1, item2, true, mergeItems);
    mergeFieldInPlace(context, changes, result, "requiredItems", item1, item2, true, mergeRequiredItems);
    mergeFieldInPlace(context, changes, result, "tagIds", item1, item2, true, (_ctx, items1, items2, _prefer) => {
        const tagIdsMerged = new Set(items1);
        items2.forEach((id) => tagIdsMerged.add(id));
        return {
            result: tagIdsMerged,
            changes: [], // TODO
        };
    });
    mergeFieldInPlace(context, changes, result, "people", item1, item2, true, mergeGroupPeople);
    mergeFieldInPlace(context, changes, result, "hallways", item1, item2, true, mergeGroupHallways);

    changes.push({
        location: "ContentGroup",
        type: "MERGE",
        description: "Merged two matching groups.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingGroup(
    items: ContentGroupDescriptor[],
    item: IntermediaryGroupDescriptor | ContentGroupDescriptor
): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_OriginatingDataId) ??
        findMatch(items, item, isMatch_String_Exact("title")) ??
        findMatch(items, item, isMatch_String_EditDistance("title"))
    );
}

function convertHallway(context: Context, item: IntermediaryHallwayDescriptor | HallwayDescriptor): HallwayDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        colour: item.colour ?? "rgba(0,0,0,0)",
        priority: item.priority ?? 0,
    } as HallwayDescriptor;

    return result;
}

function mergeHallway(
    context: Context,
    item1: HallwayDescriptor,
    item2: HallwayDescriptor
): {
    result: HallwayDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as HallwayDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "colour", item1, item2);
    mergeFieldInPlace(context, changes, result, "priority", item1, item2);

    changes.push({
        location: "Hallway",
        type: "MERGE",
        description: "Merged two matching hallways.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingHallway(
    items: HallwayDescriptor[],
    item: IntermediaryHallwayDescriptor | HallwayDescriptor
): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_String_Exact("name")) ??
        findMatch(items, item, isMatch_String_EditDistance("name"))
    );
}

function convertTag(context: Context, item: IntermediaryTagDescriptor | TagDescriptor): TagDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        colour: item.colour ?? "rgba(0,0,0,0)",
    } as TagDescriptor;

    const origDataIdx = findExistingOriginatingData(context.originatingDatas, item);
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

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "originatingDataId", item1, item2);
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

function findExistingTag(items: TagDescriptor[], item: IntermediaryTagDescriptor | TagDescriptor): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_OriginatingDataId) ??
        findMatch(items, item, isMatch_String_Exact("name")) ??
        findMatch(items, item, isMatch_String_EditDistance("name"))
    );
}

function convertOriginatingData(
    context: Context,
    item: IntermediaryOriginatingDataDescriptor | OriginatingDataDescriptor
): OriginatingDataDescriptor {
    const result = {
        id: ("id" in item ? item.id : undefined) ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !("id" in item ? item.id : undefined),

        data: "data" in item ? item.data : undefined,
        sourceId: "sourceId" in item ? item.sourceId : undefined,
    } as OriginatingDataDescriptor;

    return result;
}

function mergeOriginatingData(
    _context: Context,
    item1: OriginatingDataDescriptor,
    item2: OriginatingDataDescriptor
): {
    result: OriginatingDataDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as OriginatingDataDescriptor;

    throw new Error("Not implemented");
    // TODO

    changes.push({
        location: "OriginatingData",
        type: "MERGE",
        description: "Merged two matching originating data.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertPerson(
    context: Context,
    item: IntermediaryPersonDescriptor | ContentPersonDescriptor
): ContentPersonDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,
        conferenceId: context.conferenceId,

        name: item.name,
        affiliation: item.affiliation,
        email: item.email,
    } as ContentPersonDescriptor;

    const origDataIdx = findExistingOriginatingData(context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergePerson(
    context: Context,
    item1: ContentPersonDescriptor,
    item2: ContentPersonDescriptor
): {
    result: ContentPersonDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ContentPersonDescriptor;

    mergeFieldInPlace(context, changes, result, "id", item1, item2, false);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "originatingDataId", item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "affiliation", item1, item2);
    mergeFieldInPlace(context, changes, result, "email", item1, item2);

    changes.push({
        location: "Person",
        type: "MERGE",
        description: "Merged two matching persons.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingPerson(
    items: ContentPersonDescriptor[],
    item: IntermediaryPersonDescriptor | ContentPersonDescriptor
): number | undefined {
    const generateMatchableName = (x: ContentPersonDescriptor | IntermediaryPersonDescriptor): string | undefined => {
        if (!x.name) {
            return undefined;
        }
        if (x.affiliation) {
            return `${x.name} (${x.affiliation})`;
        }
        return `${x.name} (No affiliation)`;
    };
    const matchExact = isMatch_String_Exact();
    const matchDistance = isMatch_String_EditDistance();
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_String_Exact("email")) ??
        findMatch(items, item, (x, y) => {
            const left = generateMatchableName(x);
            const right = generateMatchableName(y);
            if (!left || !right) {
                return false;
            }
            return matchExact(left, right);
        }) ??
        findMatch(items, item, (x, y) => {
            const left = generateMatchableName(x);
            const right = generateMatchableName(y);
            if (!left || !right) {
                return false;
            }
            // Match affiliation separately - long affiliation can skew the result unexpectedly
            return (
                matchDistance(left.split("(")[0], right.split("(")[0]) &&
                matchDistance(left.split("(")[1], right.split("(")[1])
            );
        })
    );
}

function findExistingPersonForGroup(
    items: ContentPersonDescriptor[],
    item: IntermediaryGroupPersonDescriptor | ContentGroupPersonDescriptor
): number | undefined {
    const generateMatchableNameA = (x: ContentPersonDescriptor): string | undefined => {
        if (!x.name) {
            return undefined;
        }
        if (x.affiliation) {
            return `${x.name} (${x.affiliation})`;
        }
        return `${x.name} (No affiliation)`;
    };
    const generateMatchableNameB = (
        x: ContentGroupPersonDescriptor | IntermediaryGroupPersonDescriptor
    ): string | undefined => {
        if ("name_affiliation" in x) {
            return x.name_affiliation;
        }

        if (!x.personId) {
            return undefined;
        }

        // TODO: Handle ID remapping
        const p = items.find((p1) => p1.id === x.personId);
        if (!p) {
            return undefined;
        }
        return `${p.name} (${p.affiliation ?? "No affiliation"})`;
    };
    const matchExact = isMatch_String_Exact();
    const matchDistance = isMatch_String_EditDistance();
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, (x, y) => {
            const left = generateMatchableNameA(x);
            const right = generateMatchableNameB(y);
            if (!left || !right) {
                return false;
            }
            return matchExact(left, right);
        }) ??
        findMatch(items, item, (x, y) => {
            const left = generateMatchableNameA(x);
            const right = generateMatchableNameB(y);
            if (!left || !right) {
                return false;
            }
            // Match affiliation separately - long affiliation can skew the result unexpectedly
            return (
                matchDistance(left.split("(")[0], right.split("(")[0]) &&
                matchDistance(left.split("(")[1], right.split("(")[1])
            );
        })
    );
}

function mergeData(
    conferenceId: string,
    importData: Record<string, IntermediaryData>,
    originalContentGroups: ContentGroupDescriptor[],
    originalHallways: HallwayDescriptor[],
    originalOriginatingDatas: OriginatingDataDescriptor[],
    originalPeople: ContentPersonDescriptor[],
    originalTags: TagDescriptor[]
): {
    newContentGroups: ContentGroupDescriptor[];
    newPeople: ContentPersonDescriptor[];
    newTags: TagDescriptor[];
    newOriginatingDatas: OriginatingDataDescriptor[];
    newHallways: HallwayDescriptor[];

    changes: ChangeSummary[];
} {
    const dataKeys = Object.keys(importData);
    if (dataKeys.length === 0) {
        throw new Error("No data available");
    }

    const result: {
        conferenceId: string;
        groups: ContentGroupDescriptor[];
        people: ContentPersonDescriptor[];
        tags: TagDescriptor[];
        originatingDatas: OriginatingDataDescriptor[];
        hallways: HallwayDescriptor[];
    } = {
        conferenceId,
        groups: [...originalContentGroups],
        people: [...originalPeople],
        tags: [...originalTags],
        originatingDatas: [...originalOriginatingDatas],
        hallways: [...originalHallways],
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

        if (data.hallways) {
            const newDatas = mergeLists(
                result,
                "Hallway",
                result.hallways,
                data.hallways,
                findExistingHallway,
                convertHallway,
                mergeHallway
            );
            result.hallways = newDatas.result;
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

        if (data.people) {
            const newDatas = mergeLists(
                result,
                "Person",
                result.people,
                data.people,
                findExistingPerson,
                convertPerson,
                mergePerson
            );
            result.people = newDatas.result;
            changes.push(...newDatas.changes);
        }
    }

    for (const dataKey of dataKeys) {
        const data = importData[dataKey];

        if (data.groups) {
            const newGroups = mergeLists(
                result,
                "ContentGroup",
                result.groups,
                data.groups,
                findExistingGroup,
                convertGroup,
                mergeGroup
            );
            result.groups = newGroups.result;
            changes.push(...newGroups.changes);
        }
    }

    return {
        newContentGroups: result.groups,
        newPeople: result.people,
        newTags: result.tags,
        newOriginatingDatas: result.originatingDatas,
        newHallways: result.hallways,
        changes,
    };
}

export default function mergeContent(
    conferenceId: string,
    importData: Record<string, IntermediaryData>,
    originalContentGroups: Map<string, ContentGroupDescriptor>,
    originalHallways: Map<string, HallwayDescriptor>,
    originalOriginatingDatas: Map<string, OriginatingDataDescriptor>,
    originalPeople: Map<string, ContentPersonDescriptor>,
    originalTags: Map<string, TagDescriptor>
): {
    changes: ChangeSummary[];
    newContentGroups: Map<string, ContentGroupDescriptor>;
    newPeople: Map<string, ContentPersonDescriptor>;
    newTags: Map<string, TagDescriptor>;
    newOriginatingDatas: Map<string, OriginatingDataDescriptor>;
    newHallways: Map<string, HallwayDescriptor>;
} {
    const changes: ChangeSummary[] = [];

    const result = mergeData(
        conferenceId,
        importData,
        Array.from(originalContentGroups.values()),
        Array.from(originalHallways.values()),
        Array.from(originalOriginatingDatas.values()),
        Array.from(originalPeople.values()),
        Array.from(originalTags.values())
    );
    changes.push(...result.changes);

    const newContentGroups = new Map(result.newContentGroups.map((x) => [x.id, x]));
    const newPeople = new Map(result.newPeople.map((x) => [x.id, x]));
    const newTags = new Map(result.newTags.map((x) => [x.id, x]));
    const newOriginatingDatas = new Map(result.newOriginatingDatas.map((x) => [x.id, x]));
    const newHallways = new Map(result.newHallways.map((x) => [x.id, x]));

    return {
        changes,
        newContentGroups,
        newPeople,
        newTags,
        newOriginatingDatas,
        newHallways,
    };
}
