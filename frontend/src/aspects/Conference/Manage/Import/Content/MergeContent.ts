import type {
    IntermediaryContentData,
    IntermediaryExhibitionDescriptor,
    IntermediaryGroupDescriptor,
    IntermediaryGroupExhibitionDescriptor,
    IntermediaryGroupPersonDescriptor,
    IntermediaryItemDescriptor,
    IntermediaryPersonDescriptor,
    IntermediaryTagDescriptor,
    IntermediaryUploadableItemDescriptor,
    IntermediaryUploaderDescriptor,
} from "@clowdr-app/shared-types/build/import/intermediary";
import { v4 as uuidv4 } from "uuid";
import type {
    ElementDescriptor,
    ExhibitionDescriptor,
    ItemDescriptor,
    ItemExhibitionDescriptor,
    ItemPersonDescriptor,
    ProgramPersonDescriptor,
    UploadableElementDescriptor,
    UploaderDescriptor,
} from "../../Content/Types";
import type { OriginatingDataDescriptor, TagDescriptor } from "../../Shared/Types";
import {
    ChangeSummary,
    convertOriginatingData,
    findExistingEmailItem,
    findExistingNamedItem,
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
        Uploader: IdMap;
        UploadableItem: IdMap;
        Item: IdMap;
        GroupPerson: IdMap;
        GroupExhibition: IdMap;
        Group: IdMap;
        Exhibition: IdMap;
        Tag: IdMap;
        OriginatingData: IdMap;
        Person: IdMap;
    };

    conferenceId: string;
    originatingDatas: OriginatingDataDescriptor[];
    people: ProgramPersonDescriptor[];
    tags: TagDescriptor[];
};

function findUploader(
    ctx: Context,
    items: UploaderDescriptor[],
    item: IntermediaryUploaderDescriptor | UploaderDescriptor
): number | undefined {
    return findExistingEmailItem("Uploader")(ctx, items, item);
}

function mergeUploader(
    context: Context,
    item1: UploaderDescriptor,
    item2: UploaderDescriptor
): {
    result: UploaderDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];
    const result = {} as UploaderDescriptor;

    mergeIdInPlace("Uploader", context, changes, result, item1, item2, false);
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

function convertUploader(
    uploadableId: string
): (context: Context, item: IntermediaryUploaderDescriptor | UploaderDescriptor) => UploaderDescriptor {
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

        result.uploadableId = uploadableId;

        return result;
    };
}

function mergeUploaders(
    uploadableId: string
): (
    context: Context,
    items1: UploaderDescriptor[],
    items2: (IntermediaryUploaderDescriptor | UploaderDescriptor)[]
) => {
    changes: ChangeSummary[];
    result: UploaderDescriptor[];
} {
    return (context, items1, items2) => {
        return mergeLists<Context, UploaderDescriptor, IntermediaryUploaderDescriptor>(
            context,
            "Uploader",
            items1,
            items2,
            findUploader,
            convertUploader(uploadableId),
            mergeUploader
        );
    };
}

function mergeUploadableItem(
    context: Context,
    item1: UploadableElementDescriptor,
    item2: UploadableElementDescriptor
): {
    changes: ChangeSummary[];
    result: UploadableElementDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as UploadableElementDescriptor;

    mergeIdInPlace("UploadableItem", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "typeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "isHidden", item1, item2);
    mergeFieldInPlace(context, changes, result, "uploadsRemaining", item1, item2, true, (_ctx, x, y) => {
        if (x !== null) {
            if (y !== null) {
                const r = Math.max(x, y);
                return {
                    result: r,
                    changes: [
                        {
                            type: "MERGE",
                            location: "UploadableElement.uploadsRemaining",
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
        location: "UploadableElement",
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

function convertUploadableItem(
    context: Context,
    item: IntermediaryUploadableItemDescriptor | UploadableElementDescriptor
): UploadableElementDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        typeName: item.typeName,
        isHidden: "isHidden" in item && item.isHidden,
        uploadsRemaining: item.uploadsRemaining,
        uploaders: [],
    } as UploadableElementDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
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

function mergeUploadableItems(
    context: Context,
    items1: UploadableElementDescriptor[],
    items2: (IntermediaryUploadableItemDescriptor | UploadableElementDescriptor)[]
): {
    changes: ChangeSummary[];
    result: UploadableElementDescriptor[];
} {
    return mergeLists(
        context,
        "UploadableElement",
        items1,
        items2,
        findExistingNamedItem("UploadableItem"),
        convertUploadableItem,
        mergeUploadableItem
    );
}

function mergeItem(
    context: Context,
    item1: ElementDescriptor,
    item2: ElementDescriptor
): {
    changes: ChangeSummary[];
    result: ElementDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ElementDescriptor;

    mergeIdInPlace("Item", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "typeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "isHidden", item1, item2);
    mergeFieldInPlace(context, changes, result, "data", item1, item2);

    changes.push({
        location: "Element",
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

function convertItem(context: Context, item: IntermediaryItemDescriptor | ElementDescriptor): ElementDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        typeName: item.typeName,
        data: item.data,
        isHidden: item.isHidden,
        layoutData: "layoutData" in item ? item.layoutData : undefined,
        uploadableId: "uploadableId" in item ? item.uploadableId : undefined,
    } as ElementDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergeItems(
    context: Context,
    items1: ElementDescriptor[],
    items2: (IntermediaryItemDescriptor | ElementDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ElementDescriptor[];
} {
    return mergeLists(context, "Element", items1, items2, findExistingNamedItem("Item"), convertItem, mergeItem);
}

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

function findExistingGroupPerson(
    ctx: Context,
    items: ItemPersonDescriptor[],
    item: IntermediaryGroupPersonDescriptor | ItemPersonDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("GroupPerson")) ??
        findMatch(ctx, items, item, (ctxInner, item1, item2) => {
            if ("roleName" in item2) {
                return item1.roleName === item2.roleName && isMatch_String_Exact("personId")(ctxInner, item1, item2);
            }
            return isMatch_String_Exact<
                Context,
                ItemPersonDescriptor | IntermediaryGroupPersonDescriptor,
                ItemPersonDescriptor
            >("personId")(ctxInner, item1, item2);
        })
        // TODO: Find by name_affiliation
    );
}

function mergeGroupPerson(
    context: Context,
    item1: ItemPersonDescriptor,
    item2: ItemPersonDescriptor
): {
    changes: ChangeSummary[];
    result: ItemPersonDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ItemPersonDescriptor;

    mergeIdInPlace("GroupPerson", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "conferenceId", item1, item2);
    mergeFieldInPlace(context, changes, result, "itemId", item1, item2, false);
    mergeFieldInPlace(context, changes, result, "personId", item1, item2);
    mergeFieldInPlace(context, changes, result, "priority", item1, item2);
    mergeFieldInPlace(context, changes, result, "roleName", item1, item2);

    changes.push({
        location: "ItemPerson",
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
    item: IntermediaryGroupPersonDescriptor | ItemPersonDescriptor
): ItemPersonDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        conferenceId: context.conferenceId,
        itemId: "itemId" in item ? item.itemId : undefined,
        roleName: "roleName" in item ? item.roleName : item.role,
        priority: item.priority,
    } as ItemPersonDescriptor;

    const personIdx = findExistingPersonForGroup(context, context.people, item);
    if (personIdx !== undefined) {
        result.personId = context.people[personIdx].id;
    } else {
        throw new Error(`Could not find person: ${JSON.stringify(item, null, 2)}`);
    }

    return result;
}

function mergeGroupPeople(
    context: Context,
    items1: ItemPersonDescriptor[],
    items2: (IntermediaryGroupPersonDescriptor | ItemPersonDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ItemPersonDescriptor[];
} {
    return mergeLists(
        context,
        "ItemPerson",
        items1,
        items2,
        findExistingGroupPerson,
        convertGroupPerson,
        mergeGroupPerson
    );
}

function convertGroupExhibition(
    context: Context,
    groupExhibition: IntermediaryGroupExhibitionDescriptor | ItemExhibitionDescriptor
): ItemExhibitionDescriptor {
    const result = {
        id: groupExhibition.id ?? uuidv4(),
        isNew: ("isNew" in groupExhibition && groupExhibition.isNew) || !groupExhibition.id,
        conferenceId: context.conferenceId,
        itemId: "itemId" in groupExhibition ? groupExhibition.itemId : undefined,
        exhibitionId: groupExhibition.exhibitionId,
        layout: groupExhibition.layout,
        priority: groupExhibition.priority,
    } as ItemExhibitionDescriptor;

    return result;
}

function mergeGroupExhibition(
    context: Context,
    item1: ItemExhibitionDescriptor,
    item2: ItemExhibitionDescriptor
): {
    changes: ChangeSummary[];
    result: ItemExhibitionDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ItemExhibitionDescriptor;

    mergeIdInPlace("GroupExhibition", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "exhibitionId", item1, item2);
    mergeFieldInPlace(context, changes, result, "layout", item1, item2);
    mergeFieldInPlace(context, changes, result, "priority", item1, item2);

    changes.push({
        location: "ItemExhibition",
        type: "MERGE",
        description: "Merged two matching group-exhibitions.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingGroupExhibition(
    ctx: Context,
    items: ItemExhibitionDescriptor[],
    item: IntermediaryGroupExhibitionDescriptor | ItemExhibitionDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("GroupExhibition")) ||
        findMatch(ctx, items, item, isMatch_String_Exact("exhibitionId"))
    );
}

function mergeGroupExhibitions(
    context: Context,
    items1: ItemExhibitionDescriptor[],
    items2: (IntermediaryGroupExhibitionDescriptor | ItemExhibitionDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ItemExhibitionDescriptor[];
} {
    return mergeLists(
        context,
        "ItemExhibition",
        items1,
        items2,
        findExistingGroupExhibition,
        convertGroupExhibition,
        mergeGroupExhibition
    );
}

function convertGroup(context: Context, item: IntermediaryGroupDescriptor | ItemDescriptor): ItemDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        title: item.title,
        typeName: item.typeName,
        shortTitle: "shortTitle" in item ? item.shortTitle : undefined,
        exhibitions: [],
        items: [],
        people: [],
        uploadableItems: [],
        tagIds: new Set(),
        rooms: [],
    } as ItemDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    if (item.items) {
        for (const x of item.items) {
            result.items.push(convertItem(context, x));
        }
    }

    if (item.uploadableItems) {
        for (const x of item.uploadableItems) {
            result.uploadableItems.push(convertUploadableItem(context, x));
        }
    }

    if (item.exhibitions) {
        for (const x of item.exhibitions) {
            result.exhibitions.push(convertGroupExhibition(context, x));
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
    item1: ItemDescriptor,
    item2: ItemDescriptor
): {
    result: ItemDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ItemDescriptor;

    mergeIdInPlace("Group", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "title", item1, item2);
    mergeFieldInPlace(context, changes, result, "typeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "items", item1, item2, true, mergeItems);
    mergeFieldInPlace(context, changes, result, "uploadableItems", item1, item2, true, mergeUploadableItems);
    mergeFieldInPlace(context, changes, result, "tagIds", item1, item2, true, (_ctx, items1, items2, _prefer) => {
        const tagIdsMerged = new Set(items1);
        items2.forEach((id) => tagIdsMerged.add(id));
        return {
            result: tagIdsMerged,
            changes: [
                {
                    location: "Group.tagIds",
                    description: "Merged tags ids into single set",
                    importData: [items1, items2],
                    newData: tagIdsMerged,
                    type: "MERGE",
                },
            ],
        };
    });
    mergeFieldInPlace(context, changes, result, "people", item1, item2, true, mergeGroupPeople);
    mergeFieldInPlace(context, changes, result, "exhibitions", item1, item2, true, mergeGroupExhibitions);

    changes.push({
        location: "Item",
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
    ctx: Context,
    items: ItemDescriptor[],
    item: IntermediaryGroupDescriptor | ItemDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("Group")) ??
        findMatch(ctx, items, item, isMatch_OriginatingDataId) ??
        findMatch(ctx, items, item, isMatch_String_Exact("title")) ??
        findMatch(ctx, items, item, isMatch_String_EditDistance("title"))
    );
}

function convertExhibition(
    context: Context,
    item: IntermediaryExhibitionDescriptor | ExhibitionDescriptor
): ExhibitionDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        name: item.name,
        colour: item.colour ?? "rgba(0,0,0,0)",
        priority: item.priority ?? 0,
    } as ExhibitionDescriptor;

    return result;
}

function mergeExhibition(
    context: Context,
    item1: ExhibitionDescriptor,
    item2: ExhibitionDescriptor
): {
    result: ExhibitionDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ExhibitionDescriptor;

    mergeIdInPlace("Exhibition", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "colour", item1, item2);
    mergeFieldInPlace(context, changes, result, "priority", item1, item2);

    changes.push({
        location: "Exhibition",
        type: "MERGE",
        description: "Merged two matching exhibitions.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingExhibition(
    ctx: Context,
    items: ExhibitionDescriptor[],
    item: IntermediaryExhibitionDescriptor | ExhibitionDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("Exhibition")) ??
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
        findMatch(ctx, items, item, isMatch_String_Exact("name"))
    );
}

function convertPerson(
    context: Context,
    item: IntermediaryPersonDescriptor | ProgramPersonDescriptor
): ProgramPersonDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,
        conferenceId: context.conferenceId,

        name: item.name,
        affiliation: item.affiliation,
        email: item.email,
    } as ProgramPersonDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergePerson(
    context: Context,
    item1: ProgramPersonDescriptor,
    item2: ProgramPersonDescriptor
): {
    result: ProgramPersonDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ProgramPersonDescriptor;

    mergeIdInPlace("Person", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "name", item1, item2);
    mergeFieldInPlace(context, changes, result, "affiliation", item1, item2);
    mergeFieldInPlace(context, changes, result, "email", item1, item2);
    mergeFieldInPlace(context, changes, result, "registrantId", item1, item2);

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
    ctx: Context,
    items: ProgramPersonDescriptor[],
    item: IntermediaryPersonDescriptor | ProgramPersonDescriptor
): number | undefined {
    const generateMatchableName = (x: ProgramPersonDescriptor | IntermediaryPersonDescriptor): string | undefined => {
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
        findMatch(ctx, items, item, isMatch_Id("Person")) ??
        findMatch(ctx, items, item, isMatch_String_Exact("email")) ??
        findMatch(ctx, items, item, (ctxInner, x, y) => {
            const left = generateMatchableName(x);
            const right = generateMatchableName(y);
            if (!left || !right) {
                return false;
            }
            return matchExact(ctxInner, left, right);
        }) ??
        findMatch(ctx, items, item, (ctxInner, x, y) => {
            const left = generateMatchableName(x);
            const right = generateMatchableName(y);
            if (!left || !right) {
                return false;
            }
            // Match affiliation separately - long affiliation can skew the result unexpectedly
            return (
                matchDistance(ctxInner, left.split("(")[0], right.split("(")[0]) &&
                matchDistance(ctxInner, left.split("(")[1], right.split("(")[1])
            );
        })
    );
}

function findExistingPersonForGroup(
    ctx: Context,
    items: ProgramPersonDescriptor[],
    item: IntermediaryGroupPersonDescriptor | ItemPersonDescriptor
): number | undefined {
    const generateMatchableNameA = (x: ProgramPersonDescriptor): string | undefined => {
        if (!x.name) {
            return undefined;
        }
        if (x.affiliation) {
            return `${x.name} (${x.affiliation})`;
        }
        return `${x.name} (No affiliation)`;
    };
    const generateMatchableNameB = (
        x: ItemPersonDescriptor | IntermediaryGroupPersonDescriptor
    ): string | undefined => {
        if ("name_affiliation" in x) {
            return x.name_affiliation;
        }

        if (!x.personId) {
            return undefined;
        }

        const p = items.find((p1) => p1.id === x.personId);
        if (!p) {
            return undefined;
        }
        return `${p.name} (${p.affiliation ?? "No affiliation"})`;
    };
    const matchExact = isMatch_String_Exact();
    const matchDistance = isMatch_String_EditDistance();
    if (item.personId) {
        const pId = item.personId;
        const origDataIds = ctx.originatingDatas
            .filter((x) => sourceIdsEquivalent(x.sourceId, pId) === "R")
            .map((x) => x.id);
        const personIdx = items.findIndex((x) => x.originatingDataId && origDataIds.includes(x.originatingDataId));
        if (personIdx !== -1) {
            return personIdx;
        }
    }

    return (
        findMatch(ctx, items, item, isMatch_Id_Generalised("Person", "id", "personId")) ??
        findMatch(ctx, items, item, (ctxInner, item1, item2) => {
            if (item1.originatingDataId && item2.personId) {
                const origData = ctxInner.originatingDatas.find((x) => x.id === item1.originatingDataId);
                if (origData && origData.sourceId === item2.personId) {
                    return true;
                }
            }
            return false;
        }) ??
        findMatch(ctx, items, item, (ctxInner, x, y) => {
            const left = generateMatchableNameA(x);
            const right = generateMatchableNameB(y);
            if (!left || !right) {
                return false;
            }
            return matchExact(ctxInner, left, right);
        }) ??
        findMatch(ctx, items, item, (ctxInner, x, y) => {
            const left = generateMatchableNameA(x);
            const right = generateMatchableNameB(y);
            if (!left || !right) {
                return false;
            }
            // Match affiliation separately - long affiliation can skew the result unexpectedly
            return (
                matchDistance(ctxInner, left.split("(")[0], right.split("(")[0]) &&
                matchDistance(ctxInner, left.split("(")[1], right.split("(")[1])
            );
        })
    );
}

function mergeData(
    conferenceId: string,
    importData: Record<string, IntermediaryContentData>,
    originalItems: ItemDescriptor[],
    originalExhibitions: ExhibitionDescriptor[],
    originalOriginatingDatas: OriginatingDataDescriptor[],
    originalPeople: ProgramPersonDescriptor[],
    originalTags: TagDescriptor[]
): {
    newItems: ItemDescriptor[];
    newPeople: ProgramPersonDescriptor[];
    newTags: TagDescriptor[];
    newOriginatingDatas: OriginatingDataDescriptor[];
    newExhibitions: ExhibitionDescriptor[];

    changes: ChangeSummary[];
} {
    const dataKeys = Object.keys(importData);
    if (dataKeys.length === 0) {
        throw new Error("No data available");
    }

    const result: {
        idMaps: {
            Uploader: IdMap;
            UploadableItem: IdMap;
            Item: IdMap;
            GroupPerson: IdMap;
            GroupExhibition: IdMap;
            Group: IdMap;
            Exhibition: IdMap;
            Tag: IdMap;
            OriginatingData: IdMap;
            Person: IdMap;
        };
        conferenceId: string;
        groups: ItemDescriptor[];
        people: ProgramPersonDescriptor[];
        tags: TagDescriptor[];
        originatingDatas: OriginatingDataDescriptor[];
        exhibitions: ExhibitionDescriptor[];
    } = {
        idMaps: {
            Uploader: new Map(),
            UploadableItem: new Map(),
            Item: new Map(),
            GroupPerson: new Map(),
            GroupExhibition: new Map(),
            Group: new Map(),
            Exhibition: new Map(),
            Tag: new Map(),
            OriginatingData: new Map(),
            Person: new Map(),
        },
        conferenceId,
        groups: [...originalItems],
        people: [...originalPeople],
        tags: [...originalTags],
        originatingDatas: [...originalOriginatingDatas],
        exhibitions: [...originalExhibitions],
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

        if (data.exhibitions) {
            const newDatas = mergeLists(
                result,
                "Exhibition",
                result.exhibitions,
                data.exhibitions,
                findExistingExhibition,
                convertExhibition,
                mergeExhibition
            );
            result.exhibitions = newDatas.result;
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
                "Item",
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
        newItems: result.groups,
        newPeople: result.people,
        newTags: result.tags,
        newOriginatingDatas: result.originatingDatas,
        newExhibitions: result.exhibitions,
        changes,
    };
}

export default function mergeContent(
    conferenceId: string,
    importData: Record<string, IntermediaryContentData>,
    originalItems: Map<string, ItemDescriptor>,
    originalExhibitions: Map<string, ExhibitionDescriptor>,
    originalOriginatingDatas: Map<string, OriginatingDataDescriptor>,
    originalPeople: Map<string, ProgramPersonDescriptor>,
    originalTags: Map<string, TagDescriptor>
): {
    changes: ChangeSummary[];
    newItems: Map<string, ItemDescriptor>;
    newPeople: Map<string, ProgramPersonDescriptor>;
    newTags: Map<string, TagDescriptor>;
    newOriginatingDatas: Map<string, OriginatingDataDescriptor>;
    newExhibitions: Map<string, ExhibitionDescriptor>;
} {
    const changes: ChangeSummary[] = [];

    const result = mergeData(
        conferenceId,
        importData,
        Array.from(originalItems.values()),
        Array.from(originalExhibitions.values()),
        Array.from(originalOriginatingDatas.values()),
        Array.from(originalPeople.values()),
        Array.from(originalTags.values())
    );
    changes.push(...result.changes);

    const newItems = new Map(result.newItems.map((x) => [x.id, x]));
    const newPeople = new Map(result.newPeople.map((x) => [x.id, x]));
    const newTags = new Map(result.newTags.map((x) => [x.id, x]));
    const newOriginatingDatas = new Map(result.newOriginatingDatas.map((x) => [x.id, x]));
    const newExhibitions = new Map(result.newExhibitions.map((x) => [x.id, x]));

    const unusedOriginatingDataIds = new Set(newOriginatingDatas.keys());
    newItems.forEach((group) => {
        if (group.originatingDataId) {
            unusedOriginatingDataIds.delete(group.originatingDataId);
        }

        group.items.forEach((item) => {
            if (item.originatingDataId) {
                unusedOriginatingDataIds.delete(item.originatingDataId);
            }
        });

        group.uploadableItems.forEach((item) => {
            if (item.originatingDataId) {
                unusedOriginatingDataIds.delete(item.originatingDataId);
            }
        });
    });

    newPeople.forEach((item) => {
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
        newItems,
        newPeople,
        newTags,
        newOriginatingDatas,
        newExhibitions,
    };
}
