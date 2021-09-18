import type {
    IntermediaryContentData,
    IntermediaryElementDescriptor,
    IntermediaryExhibitionDescriptor,
    IntermediaryItemDescriptor,
    IntermediaryItemExhibitionDescriptor,
    IntermediaryItemPersonDescriptor,
    IntermediaryPersonDescriptor,
    IntermediaryTagDescriptor,
} from "@clowdr-app/shared-types/build/import/intermediary";
import { v4 as uuidv4 } from "uuid";
import type {
    ElementDescriptor,
    ExhibitionDescriptor,
    ItemDescriptor,
    ItemExhibitionDescriptor,
    ItemPersonDescriptor,
    ProgramPersonDescriptor,
} from "../../Content/Types";
import type { OriginatingDataDescriptor, TagDescriptor } from "../../Shared/Types";
import {
    ChangeSummary,
    convertOriginatingData,
    findExistingNamedItem,
    findExistingOriginatingData,
    findMatch,
    IdMap,
    isMatch_Id,
    isMatch_Id_Generalised,
    isMatch_OriginatingDataId,
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
        Element: IdMap;
        ItemPerson: IdMap;
        ItemExhibition: IdMap;
        Item: IdMap;
        Exhibition: IdMap;
        Tag: IdMap;
        OriginatingData: IdMap;
        Person: IdMap;
    };

    conferenceId: string;
    originatingDatas: OriginatingDataDescriptor[];
    people: ProgramPersonDescriptor[];
    tags: TagDescriptor[];
    exhibitions: ExhibitionDescriptor[];
};

function mergeElement(
    context: Context,
    element1: ElementDescriptor,
    element2: ElementDescriptor
): {
    changes: ChangeSummary[];
    result: ElementDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ElementDescriptor;

    mergeIdInPlace("Element", context, changes, result, element1, element2);
    mergeIsNewInPlace(context, result, element1, element2);
    mergeOriginatingDataIdInPlace(context, changes, result, element1, element2);
    mergeFieldInPlace(context, changes, result, "name", element1, element2);
    mergeFieldInPlace(context, changes, result, "typeName", element1, element2);
    mergeFieldInPlace(context, changes, result, "isHidden", element1, element2);
    mergeFieldInPlace(context, changes, result, "data", element1, element2);
    mergeFieldInPlace(context, changes, result, "uploadsRemaining", element1, element2, true, (_ctx, x, y) => {
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

    changes.push({
        location: "Element",
        type: "MERGE",
        description: "Merged two matching elements.",
        importData: [element1, element2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertElement(
    context: Context,
    element: IntermediaryElementDescriptor | ElementDescriptor
): ElementDescriptor {
    const result = {
        id: element.id ?? uuidv4(),
        isNew: ("isNew" in element && element.isNew) || !element.id,

        name: element.name,
        typeName: element.typeName,
        data: element.data,
        isHidden: element.isHidden,
        layoutData: "layoutData" in element ? element.layoutData : undefined,
        uploadsRemaining: element.uploadsRemaining,
    } as ElementDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, element);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergeElements(
    context: Context,
    elements1: ElementDescriptor[],
    elements2: (IntermediaryElementDescriptor | ElementDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ElementDescriptor[];
} {
    return mergeLists(
        context,
        "Element",
        elements1,
        elements2,
        findExistingNamedItem("Element"),
        (a, b) => convertElement(a, b),
        mergeElement
    );
}

function convertTagName(context: Context, tagName: string): string {
    const r = findMatch(context, context.tags, tagName, (ctx, element1, element2) =>
        isMatch_String_Exact()(ctx, element1.name, element2)
    );
    if (r !== undefined) {
        return context.tags[r].id;
    } else {
        throw new Error(`Tag ${tagName} not found!`);
    }
}

function convertExhibitionName(context: Context, exhibitionName: string, itemId: string): ItemExhibitionDescriptor {
    const r = findMatch(context, context.exhibitions, exhibitionName, (ctx, element1, element2) =>
        isMatch_String_Exact()(ctx, element1.name, element2)
    );
    if (r !== undefined) {
        return {
            isNew: true,
            id: uuidv4(),
            itemId,
            exhibitionId: context.exhibitions[r].id,
        };
    } else {
        throw new Error(`Exhibition ${exhibitionName} not found!`);
    }
}

function findExistingItemPerson(
    ctx: Context,
    elements: ItemPersonDescriptor[],
    element: IntermediaryItemPersonDescriptor | ItemPersonDescriptor
): number | undefined {
    return (
        findMatch(ctx, elements, element, isMatch_Id("ItemPerson")) ??
        findMatch(ctx, elements, element, (ctxInner, element1, element2) => {
            if ("roleName" in element2) {
                return (
                    element1.roleName === element2.roleName &&
                    isMatch_String_Exact("personId")(ctxInner, element1, element2)
                );
            }
            return isMatch_String_Exact<
                Context,
                ItemPersonDescriptor | IntermediaryItemPersonDescriptor,
                ItemPersonDescriptor
            >("personId")(ctxInner, element1, element2);
        })
    );
}

function mergeItemPerson(
    context: Context,
    element1: ItemPersonDescriptor,
    element2: ItemPersonDescriptor
): {
    changes: ChangeSummary[];
    result: ItemPersonDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ItemPersonDescriptor;

    mergeIdInPlace("ItemPerson", context, changes, result, element1, element2);
    mergeIsNewInPlace(context, result, element1, element2);
    mergeFieldInPlace(context, changes, result, "conferenceId", element1, element2);
    mergeFieldInPlace(context, changes, result, "itemId", element1, element2, false);
    mergeFieldInPlace(context, changes, result, "personId", element1, element2);
    mergeFieldInPlace(context, changes, result, "priority", element1, element2);
    mergeFieldInPlace(context, changes, result, "roleName", element1, element2);

    changes.push({
        location: "ItemPerson",
        type: "MERGE",
        description: "Merged two matching item-persons.",
        importData: [element1, element2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function convertItemPerson(
    context: Context,
    element: IntermediaryItemPersonDescriptor | ItemPersonDescriptor
): ItemPersonDescriptor {
    const result = {
        id: element.id ?? uuidv4(),
        isNew: ("isNew" in element && element.isNew) || !element.id,

        conferenceId: context.conferenceId,
        itemId: "itemId" in element ? element.itemId : undefined,
        roleName: "roleName" in element ? element.roleName : element.role,
        priority: element.priority,
    } as ItemPersonDescriptor;

    const personIdx = findExistingPersonForItem(context, context.people, element);
    if (personIdx !== undefined) {
        result.personId = context.people[personIdx].id;
    } else {
        throw new Error(`Could not find person: ${JSON.stringify(element, null, 2)}`);
    }

    return result;
}

function mergeItemPeople(
    context: Context,
    elements1: ItemPersonDescriptor[],
    elements2: (IntermediaryItemPersonDescriptor | ItemPersonDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ItemPersonDescriptor[];
} {
    return mergeLists(
        context,
        "ItemPerson",
        elements1,
        elements2,
        findExistingItemPerson,
        convertItemPerson,
        mergeItemPerson
    );
}

function convertItemExhibition(
    context: Context,
    itemExhibition: IntermediaryItemExhibitionDescriptor | ItemExhibitionDescriptor
): ItemExhibitionDescriptor {
    const result = {
        id: itemExhibition.id ?? uuidv4(),
        isNew: ("isNew" in itemExhibition && itemExhibition.isNew) || !itemExhibition.id,
        conferenceId: context.conferenceId,
        itemId: "itemId" in itemExhibition ? itemExhibition.itemId : undefined,
        exhibitionId: itemExhibition.exhibitionId,
        layout: itemExhibition.layout,
        priority: itemExhibition.priority,
    } as ItemExhibitionDescriptor;

    return result;
}

function mergeItemExhibition(
    context: Context,
    element1: ItemExhibitionDescriptor,
    element2: ItemExhibitionDescriptor
): {
    changes: ChangeSummary[];
    result: ItemExhibitionDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result = {} as ItemExhibitionDescriptor;

    mergeIdInPlace("ItemExhibition", context, changes, result, element1, element2);
    mergeIsNewInPlace(context, result, element1, element2);
    mergeFieldInPlace(context, changes, result, "exhibitionId", element1, element2);
    mergeFieldInPlace(context, changes, result, "layout", element1, element2);
    mergeFieldInPlace(context, changes, result, "priority", element1, element2);

    changes.push({
        location: "ItemExhibition",
        type: "MERGE",
        description: "Merged two matching item-exhibitions.",
        importData: [element1, element2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingItemExhibition(
    ctx: Context,
    elements: ItemExhibitionDescriptor[],
    element: IntermediaryItemExhibitionDescriptor | ItemExhibitionDescriptor
): number | undefined {
    return (
        findMatch(ctx, elements, element, isMatch_Id("ItemExhibition")) ||
        findMatch(ctx, elements, element, isMatch_String_Exact("exhibitionId"))
    );
}

function mergeItemExhibitions(
    context: Context,
    elements1: ItemExhibitionDescriptor[],
    elements2: (IntermediaryItemExhibitionDescriptor | ItemExhibitionDescriptor)[]
): {
    changes: ChangeSummary[];
    result: ItemExhibitionDescriptor[];
} {
    return mergeLists(
        context,
        "ItemExhibition",
        elements1,
        elements2,
        findExistingItemExhibition,
        convertItemExhibition,
        mergeItemExhibition
    );
}

function convertItem(context: Context, item: IntermediaryItemDescriptor | ItemDescriptor): ItemDescriptor {
    const result = {
        id: item.id ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !item.id,

        title: item.title,
        typeName: item.typeName,
        shortTitle: "shortTitle" in item ? item.shortTitle : undefined,
        exhibitions: [],
        elements: [],
        people: [],
        uploadableElements: [],
        tagIds: new Set(),
        rooms: [],
    } as ItemDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, item);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    if (item.elements) {
        for (const x of item.elements) {
            result.elements.push(convertElement(context, x));
        }
    }

    if (item.exhibitions) {
        for (const x of item.exhibitions) {
            result.exhibitions.push(convertItemExhibition(context, x));
        }
    }

    if (item.people) {
        for (const x of item.people) {
            result.people.push(convertItemPerson(context, x));
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

    if ("exhibitionNames" in item && item.exhibitionNames) {
        for (const x of item.exhibitionNames) {
            result.exhibitions.push(convertExhibitionName(context, x, result.id));
        }
    }

    return result;
}

function mergeItem(
    context: Context,
    item1: ItemDescriptor,
    item2: ItemDescriptor
): {
    result: ItemDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ItemDescriptor;

    mergeIdInPlace("Item", context, changes, result, item1, item2);
    mergeIsNewInPlace(context, result, item1, item2);
    mergeOriginatingDataIdInPlace(context, changes, result, item1, item2);
    mergeFieldInPlace(context, changes, result, "title", item1, item2);
    mergeFieldInPlace(context, changes, result, "typeName", item1, item2);
    mergeFieldInPlace(context, changes, result, "elements", item1, item2, true, mergeElements);
    mergeFieldInPlace(context, changes, result, "tagIds", item1, item2, true, (_ctx, items1, items2, _prefer) => {
        const tagIdsMerged = new Set(items1);
        items2.forEach((id) => tagIdsMerged.add(id));
        return {
            result: tagIdsMerged,
            changes: [
                {
                    location: "Item.tagIds",
                    description: "Merged tags ids into single set",
                    importData: [items1, items2],
                    newData: tagIdsMerged,
                    type: "MERGE",
                },
            ],
        };
    });
    mergeFieldInPlace(context, changes, result, "people", item1, item2, true, mergeItemPeople);
    mergeFieldInPlace(context, changes, result, "exhibitions", item1, item2, true, mergeItemExhibitions);

    changes.push({
        location: "Item",
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

function findExistingItem(
    ctx: Context,
    items: ItemDescriptor[],
    item: IntermediaryItemDescriptor | ItemDescriptor
): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_Id("Item")) ?? findMatch(ctx, items, item, isMatch_OriginatingDataId)
        // ??
        // findMatch(ctx, items, item, isMatch_String_Exact("title")) ??
        // findMatch(ctx, items, item, isMatch_String_EditDistance("title"))
    );
}

function convertExhibition(
    context: Context,
    element: IntermediaryExhibitionDescriptor | ExhibitionDescriptor
): ExhibitionDescriptor {
    const result = {
        id: element.id ?? uuidv4(),
        isNew: ("isNew" in element && element.isNew) || !element.id,

        name: element.name,
        colour: element.colour ?? "rgba(0,0,0,0)",
        priority: element.priority ?? 0,
        isHidden: element.isHidden ?? false,
    } as ExhibitionDescriptor;

    return result;
}

function mergeExhibition(
    context: Context,
    element1: ExhibitionDescriptor,
    element2: ExhibitionDescriptor
): {
    result: ExhibitionDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ExhibitionDescriptor;

    mergeIdInPlace("Exhibition", context, changes, result, element1, element2);
    mergeIsNewInPlace(context, result, element1, element2);
    mergeFieldInPlace(context, changes, result, "name", element1, element2);
    mergeFieldInPlace(context, changes, result, "colour", element1, element2);
    mergeFieldInPlace(context, changes, result, "priority", element1, element2);
    mergeFieldInPlace(context, changes, result, "isHidden", element1, element2);

    changes.push({
        location: "Exhibition",
        type: "MERGE",
        description: "Merged two matching exhibitions.",
        importData: [element1, element2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingExhibition(
    ctx: Context,
    elements: ExhibitionDescriptor[],
    element: IntermediaryExhibitionDescriptor | ExhibitionDescriptor
): number | undefined {
    return (
        findMatch(ctx, elements, element, isMatch_Id("Exhibition")) ??
        findMatch(ctx, elements, element, isMatch_String_Exact("name"))
    );
}

function convertTag(context: Context, element: IntermediaryTagDescriptor | TagDescriptor): TagDescriptor {
    const result = {
        id: element.id ?? uuidv4(),
        isNew: ("isNew" in element && element.isNew) || !element.id,

        name: element.name,
        colour: element.colour ?? "rgba(0,0,0,0)",
        priority: element.priority,
    } as TagDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, element);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergeTag(
    context: Context,
    element1: TagDescriptor,
    element2: TagDescriptor
): {
    result: TagDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as TagDescriptor;

    mergeIdInPlace("Tag", context, changes, result, element1, element2);
    mergeIsNewInPlace(context, result, element1, element2);
    mergeOriginatingDataIdInPlace(context, changes, result, element1, element2);
    mergeFieldInPlace(context, changes, result, "name", element1, element2);
    mergeFieldInPlace(context, changes, result, "colour", element1, element2);
    mergeFieldInPlace(context, changes, result, "priority", element1, element2);

    changes.push({
        location: "Tag",
        type: "MERGE",
        description: "Merged two matching tags.",
        importData: [element1, element2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingTag(
    ctx: Context,
    elements: TagDescriptor[],
    element: IntermediaryTagDescriptor | TagDescriptor
): number | undefined {
    return (
        findMatch(ctx, elements, element, isMatch_Id("Tag")) ??
        findMatch(ctx, elements, element, isMatch_OriginatingDataId) ??
        findMatch(ctx, elements, element, isMatch_String_Exact("name"))
    );
}

function convertPerson(
    context: Context,
    element: IntermediaryPersonDescriptor | ProgramPersonDescriptor
): ProgramPersonDescriptor {
    const result = {
        id: element.id ?? uuidv4(),
        isNew: ("isNew" in element && element.isNew) || !element.id,
        conferenceId: context.conferenceId,

        name: element.name,
        affiliation: element.affiliation,
        email: element.email,
    } as ProgramPersonDescriptor;

    const origDataIdx = findExistingOriginatingData(context, context.originatingDatas, element);
    if (origDataIdx !== undefined) {
        result.originatingDataId = context.originatingDatas[origDataIdx].id;
    }

    return result;
}

function mergePerson(
    context: Context,
    element1: ProgramPersonDescriptor,
    element2: ProgramPersonDescriptor
): {
    result: ProgramPersonDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as ProgramPersonDescriptor;

    mergeIdInPlace("Person", context, changes, result, element1, element2);
    mergeIsNewInPlace(context, result, element1, element2);
    mergeOriginatingDataIdInPlace(context, changes, result, element1, element2);
    mergeFieldInPlace(context, changes, result, "name", element1, element2);
    mergeFieldInPlace(context, changes, result, "affiliation", element1, element2);
    mergeFieldInPlace(context, changes, result, "email", element1, element2);
    mergeFieldInPlace(context, changes, result, "registrantId", element1, element2);

    changes.push({
        location: "Person",
        type: "MERGE",
        description: "Merged two matching persons.",
        importData: [element1, element2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingPerson(
    ctx: Context,
    elements: ProgramPersonDescriptor[],
    element: IntermediaryPersonDescriptor | ProgramPersonDescriptor
): number | undefined {
    const matchExact = isMatch_String_Exact();
    return (
        findMatch(ctx, elements, element, isMatch_Id("Person")) ??
        findMatch(ctx, elements, element, isMatch_String_Exact("email")) ??
        findMatch(ctx, elements, element, (ctxInner, x, y) => {
            if (!x.name || !y.name) {
                return false;
            }
            // Match affiliation separately - long affiliation can skew the result unexpectedly
            return (
                matchExact(ctxInner, x.name.trim(), y.name.trim()) &&
                ((!x.affiliation && !y.affiliation) ||
                    (!!x.affiliation &&
                        !!y.affiliation &&
                        matchExact(ctxInner, x.affiliation.trim(), y.affiliation.trim())))
            );
        })
    );
}

function findExistingPersonForItem(
    ctx: Context,
    elements: ProgramPersonDescriptor[],
    element: IntermediaryItemPersonDescriptor | ItemPersonDescriptor
): number | undefined {
    const generateMatchableNameA = (x: ProgramPersonDescriptor): { name: string; affiliation?: string } | undefined => {
        if (!x.name) {
            return undefined;
        }
        if (x.affiliation) {
            return { name: x.name, affiliation: x.affiliation };
        }
        return { name: x.name };
    };
    const generateMatchableNameB = (
        x: ItemPersonDescriptor | IntermediaryItemPersonDescriptor
    ): { name: string; affiliation?: string } | undefined => {
        if ("name_affiliation" in x && x.name_affiliation) {
            const parts = x.name_affiliation?.split("¦").map((x) => x.trim());
            return { name: parts[0], affiliation: parts[1].length ? parts[1] : undefined };
        }

        if (!x.personId) {
            return undefined;
        }

        const p = elements.find((p1) => p1.id === x.personId);
        if (!p) {
            return undefined;
        }
        return { name: p.name, affiliation: p.affiliation ? p.affiliation : undefined };
    };
    const matchExact = isMatch_String_Exact();
    if (element.personId) {
        const pId = element.personId;
        const origDataIds = ctx.originatingDatas
            .filter((x) => sourceIdsEquivalent(x.sourceId, pId) === "R")
            .map((x) => x.id);
        const personIdx = elements.findIndex((x) => x.originatingDataId && origDataIds.includes(x.originatingDataId));
        if (personIdx !== -1) {
            return personIdx;
        }
    }

    return (
        findMatch(ctx, elements, element, isMatch_Id_Generalised("Person", "id", "personId")) ??
        findMatch(ctx, elements, element, (ctxInner, element1, element2) => {
            if (element1.originatingDataId && element2.personId) {
                const origData = ctxInner.originatingDatas.find((x) => x.id === element1.originatingDataId);
                if (origData && origData.sourceId === element2.personId) {
                    return true;
                }
            }
            return false;
        }) ??
        findMatch(ctx, elements, element, (ctxInner, x, y) => {
            const left = generateMatchableNameA(x);
            const right = generateMatchableNameB(y);
            if (!left || !right) {
                return false;
            }
            return (
                matchExact(ctxInner, left.name, right.name) &&
                ((!left.affiliation && !right.affiliation) ||
                    (!!left.affiliation &&
                        !!right.affiliation &&
                        matchExact(ctxInner, left.affiliation, right.affiliation)))
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
            UploadableElement: IdMap;
            Element: IdMap;
            ItemPerson: IdMap;
            ItemExhibition: IdMap;
            Item: IdMap;
            Exhibition: IdMap;
            Tag: IdMap;
            OriginatingData: IdMap;
            Person: IdMap;
        };
        conferenceId: string;
        items: ItemDescriptor[];
        people: ProgramPersonDescriptor[];
        tags: TagDescriptor[];
        originatingDatas: OriginatingDataDescriptor[];
        exhibitions: ExhibitionDescriptor[];
    } = {
        idMaps: {
            UploadableElement: new Map(),
            Element: new Map(),
            ItemPerson: new Map(),
            ItemExhibition: new Map(),
            Item: new Map(),
            Exhibition: new Map(),
            Tag: new Map(),
            OriginatingData: new Map(),
            Person: new Map(),
        },
        conferenceId,
        items: [...originalItems],
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

        if (data.items) {
            const newItems = mergeLists(
                result,
                "Item",
                result.items,
                data.items,
                findExistingItem,
                convertItem,
                mergeItem
            );
            result.items = newItems.result;
            changes.push(...newItems.changes);
        }
    }

    return {
        newItems: result.items,
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
    newItems.forEach((item) => {
        if (item.originatingDataId) {
            unusedOriginatingDataIds.delete(item.originatingDataId);
        }

        item.elements.forEach((element) => {
            if (element.originatingDataId) {
                unusedOriginatingDataIds.delete(element.originatingDataId);
            }
        });
    });

    newPeople.forEach((element) => {
        if (element.originatingDataId) {
            unusedOriginatingDataIds.delete(element.originatingDataId);
        }
    });

    newTags.forEach((element) => {
        if (element.originatingDataId) {
            unusedOriginatingDataIds.delete(element.originatingDataId);
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
