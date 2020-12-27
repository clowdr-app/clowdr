import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Spinner } from "@chakra-ui/react";
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
    IntermediaryUploaderDescriptor,
} from "@clowdr-app/shared-types/build/import/intermediary";
import assert from "assert";
import levenshtein from "levenshtein-edit-distance";
import React, { useEffect, useState } from "react";
import JSONataQueryModal from "../../../../Files/JSONataQueryModal";
import FAIcon from "../../../../Icons/FAIcon";
import type {
    ContentGroupDescriptor,
    ContentPersonDescriptor,
    HallwayDescriptor,
    OriginatingDataDescriptor,
    TagDescriptor,
} from "../../Content/Types";
import { useSaveContentDiff } from "../../Content/useSaveContentDiff";

interface ChangeSummary {
    location: string;
    type: "MERGE_IMPORTED" | "INSERT" | "UPDATE" | "DELETE";
    description: string;

    originalData?: any;
    importData: any[];
    newData: any;
}

type Defined<T> = T extends undefined ? never : T;

function defaultMerger<T>(
    x: T,
    y: T
): {
    result: T;
    changes: ChangeSummary[];
} {
    if (typeof x === "string" && typeof y === "string") {
        if (x !== "" && y === "") {
            return {
                changes: [
                    {
                        type: "MERGE_IMPORTED",
                        location: "Unknown - default merger of strings",
                        description: "Chose the lefthand value as the right was empty.",
                        importData: [x, y],
                        newData: [x],
                    },
                ],
                result: x,
            };
        } else if (x === "" && y !== "") {
            return {
                changes: [
                    {
                        type: "MERGE_IMPORTED",
                        location: "Unknown - default merger of strings",
                        description: "Chose the righthand value as the left was empty.",
                        importData: [x, y],
                        newData: [x],
                    },
                ],
                result: y,
            };
        }
    }

    return {
        changes: [
            {
                type: "MERGE_IMPORTED",
                location: "Unknown - default merger",
                description: "Chose the left of the two values.",
                importData: [x, y],
                newData: [x],
            },
        ],
        result: x,
    };
}

function mergeField<T, K extends keyof T>(
    k: K,
    item1: T,
    item2: T,
    merge: (
        val1: Defined<T[K]>,
        val2: Defined<T[K]>
    ) =>
        | {
              changes: ChangeSummary[];
              result: T[K];
          }
        | undefined = defaultMerger
):
    | {
          changes: ChangeSummary[];
          result: T[K];
      }
    | undefined {
    if (k in item1 && item1[k] !== undefined) {
        if (k in item2 && item2[k] !== undefined) {
            return merge(item1[k] as Defined<T[K]>, item2[k] as Defined<T[K]>);
        }
        return {
            changes: [
                {
                    type: "MERGE_IMPORTED",
                    location: "Unknown - merge abstract fields",
                    description: "Chose only available value (lefthand)",
                    importData: [item1[k]],
                    newData: item1[k],
                },
            ],
            result: item1[k],
        };
    } else if (item2[k] !== undefined) {
        return {
            changes: [
                {
                    type: "MERGE_IMPORTED",
                    location: "Unknown - merge abstract fields",
                    description: "Chose only available value (righthand)",
                    importData: [item2[k]],
                    newData: item2[k],
                },
            ],
            result: item2[k],
        };
    }
    return undefined;
}

function mergeFieldInPlace<T, K extends keyof T>(
    changes: ChangeSummary[],
    itemO: Partial<T>,
    k: K,
    item1: T,
    item2: T,
    merge: (
        val1: Defined<T[K]>,
        val2: Defined<T[K]>
    ) =>
        | {
              changes: ChangeSummary[];
              result: T[K];
          }
        | undefined = defaultMerger
): void {
    const merged = mergeField(k, item1, item2, merge);
    if (merged !== undefined) {
        itemO[k] = merged.result;
        changes.push(...merged.changes);
    } else {
        delete itemO[k];
    }
}

function mergeLists<T>(
    tableName: string,
    insertedItemChangeDescription: string,
    list1: T[],
    list2: T[],
    find: (items: T[], item: T) => number | undefined,
    merge: (
        item1: T,
        item2: T
    ) => {
        changes: ChangeSummary[];
        result: T;
    }
): {
    changes: ChangeSummary[];
    result: T[];
} {
    const results: T[] = [...list1];
    const changes: ChangeSummary[] = [];
    const matchedIndices = [];

    for (const item2 of list2) {
        const existingIdx = find(results, item2);
        if (existingIdx !== undefined) {
            const { result: newItem, changes: newChanges } = merge(results[existingIdx], item2);
            results.splice(existingIdx, 1, newItem);
            matchedIndices.push(existingIdx);
            changes.push(...newChanges);
        } else {
            results.push(item2);
        }
    }

    for (let idx = 0; idx < results.length; idx++) {
        if (!matchedIndices.includes(idx)) {
            changes.push({
                location: tableName,
                type: "MERGE_IMPORTED",
                description: insertedItemChangeDescription,
                importData: [results[idx]],
                newData: results[idx],
            });
        }
    }

    return {
        result: results,
        changes,
    };
}

function findMatch<T>(items: T[], item: T, isMatch: (item1: T, item2: T) => boolean): number | undefined {
    for (let idx = 0; idx < items.length; idx++) {
        if (isMatch(items[idx], item)) {
            return idx;
        }
    }
    return undefined;
}

function isMatch_Id<T extends { id?: string }>(item1: T, item2: T): boolean {
    return !!item1.id && !!item2.id && item1.id === item2.id;
}

function isMatch_OriginatingDataSourceId<T extends { originatingDataSourceId?: string }>(item1: T, item2: T): boolean {
    if (!item1.originatingDataSourceId || !item2.originatingDataSourceId) {
        return false;
    }

    const parts1 = item1.originatingDataSourceId.split("¬");
    const parts2 = item2.originatingDataSourceId.split("¬");
    return parts1.some((part) => parts2.includes(part));
}

function isMatch_String_Exact<T>(k?: keyof T): (item1: T, item2: T) => boolean {
    return (item1, item2) => {
        const v1 = k ? item1[k] : item1;
        const v2 = k ? item2[k] : item2;

        if (v1 === undefined || v2 === undefined || typeof v1 !== "string" || typeof v2 !== "string") {
            return false;
        }

        return v1.toLowerCase() === v2.toLowerCase();
    };
}

function isMatch_String_EditDistance<T>(k?: keyof T): (item1: T, item2: T) => boolean {
    return (item1, item2) => {
        const v1 = k ? item1[k] : item1;
        const v2 = k ? item2[k] : item2;

        if (v1 === undefined || v2 === undefined || typeof v1 !== "string" || typeof v2 !== "string") {
            return false;
        }

        const lengthDiff = Math.abs(v1.length - v2.length);
        const longerLength = Math.max(v1.length, v2.length);
        const shorterLength = Math.min(v1.length, v2.length);
        const threshhold = 0.2;
        if (shorterLength <= 8 || lengthDiff / shorterLength > threshhold) {
            return false;
        }

        const editDistance = levenshtein(v1.toLowerCase(), v2.toLowerCase());
        return editDistance / longerLength < threshhold;
    };
}

function findExistingNamedItem<
    T extends {
        id?: string;
        originatingDataSourceId?: string;
        name?: string;
    }
>(items: T[], item: T): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_OriginatingDataSourceId) ??
        findMatch(items, item, isMatch_String_Exact("name")) ??
        findMatch(items, item, isMatch_String_EditDistance("name"))
    );
}

function findExistingString(items: string[], item: string): number | undefined {
    return findMatch(items, item, isMatch_String_Exact()) || findMatch(items, item, isMatch_String_EditDistance());
}

function mergeOriginatingSourceId(
    id1: string,
    id2: string
): {
    result: string;
    changes: ChangeSummary[];
} {
    const result = `${id1}¬${id2}`;
    return {
        result,
        changes: [
            {
                type: "MERGE_IMPORTED",
                location: "OriginatingData.SourceIds",
                description: "Merged two originating data source ids into string-encoded list of ids",
                importData: [id1, id2],
                newData: result,
            },
        ],
    };
}

function findUploader(
    items: IntermediaryUploaderDescriptor[],
    item: IntermediaryUploaderDescriptor
): number | undefined {
    return findExistingNamedItem(items, item);
}

function mergeUploader(
    item1: IntermediaryUploaderDescriptor,
    item2: IntermediaryUploaderDescriptor
): {
    result: IntermediaryUploaderDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];
    const result: IntermediaryUploaderDescriptor = {};

    mergeFieldInPlace(changes, result, "id", item1, item2);
    mergeFieldInPlace(changes, result, "name", item1, item2);
    mergeFieldInPlace(changes, result, "email", item1, item2);

    changes.push({
        location: "Uploader",
        type: "MERGE_IMPORTED",
        description: "Merged two matching uploaders.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function mergeUploaders(
    items1: IntermediaryUploaderDescriptor[],
    items2: IntermediaryUploaderDescriptor[]
): {
    changes: ChangeSummary[];
    result: IntermediaryUploaderDescriptor[];
} {
    return mergeLists("Uploader", "Inserted unmatched uploader", items1, items2, findUploader, mergeUploader);
}

function mergeRequiredItem(
    item1: IntermediaryRequiredItemDescriptor,
    item2: IntermediaryRequiredItemDescriptor
): {
    changes: ChangeSummary[];
    result: IntermediaryRequiredItemDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result: IntermediaryRequiredItemDescriptor = {};

    mergeFieldInPlace(changes, result, "id", item1, item2);
    mergeFieldInPlace(changes, result, "originatingDataSourceId", item1, item2, mergeOriginatingSourceId);
    mergeFieldInPlace(changes, result, "name", item1, item2);
    mergeFieldInPlace(changes, result, "typeName", item1, item2);
    mergeFieldInPlace(changes, result, "uploadsRemaining", item1, item2, (x, y) => {
        const r = Math.max(x, y);
        return {
            result: r,
            changes: [
                {
                    type: "MERGE_IMPORTED",
                    location: "RequiredContentItem.uploadsRemaining",
                    description: "Merged uploads remaining to maximum of the two values.",
                    importData: [x, y],
                    newData: r,
                },
            ],
        };
    });
    mergeFieldInPlace(changes, result, "uploaders", item1, item2, mergeUploaders);

    changes.push({
        location: "RequiredContentItem",
        type: "MERGE_IMPORTED",
        description: "Merged two matching required items.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function mergeRequiredItems(
    items1: IntermediaryRequiredItemDescriptor[],
    items2: IntermediaryRequiredItemDescriptor[]
): {
    changes: ChangeSummary[];
    result: IntermediaryRequiredItemDescriptor[];
} {
    return mergeLists(
        "RequiredContentItem",
        "Inserted unmatched required item",
        items1,
        items2,
        findExistingNamedItem,
        mergeRequiredItem
    );
}

function mergeItem(
    item1: IntermediaryItemDescriptor,
    item2: IntermediaryItemDescriptor
): {
    changes: ChangeSummary[];
    result: IntermediaryItemDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result: IntermediaryItemDescriptor = {};

    mergeFieldInPlace(changes, result, "id", item1, item2);
    mergeFieldInPlace(changes, result, "originatingDataSourceId", item1, item2, mergeOriginatingSourceId);
    mergeFieldInPlace(changes, result, "name", item1, item2);
    mergeFieldInPlace(changes, result, "typeName", item1, item2);
    mergeFieldInPlace(changes, result, "isHidden", item1, item2);
    mergeFieldInPlace(changes, result, "data", item1, item2);

    changes.push({
        location: "ContentItem",
        type: "MERGE_IMPORTED",
        description: "Merged two matching items.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function mergeItems(
    items1: IntermediaryItemDescriptor[],
    items2: IntermediaryItemDescriptor[]
): {
    changes: ChangeSummary[];
    result: IntermediaryItemDescriptor[];
} {
    return mergeLists("ContentItem", "Inserted unmatched item", items1, items2, findExistingNamedItem, mergeItem);
}

function mergeTagNames(
    items1: string[],
    items2: string[]
): {
    changes: ChangeSummary[];
    result: string[];
} {
    return mergeLists("TagName", "Inserted unmatched tag name", items1, items2, findExistingString, defaultMerger);
}

function findExistingGroupPerson(
    items: IntermediaryGroupPersonDescriptor[],
    item: IntermediaryGroupPersonDescriptor
): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_String_Exact("personId")) ??
        findMatch(items, item, isMatch_String_Exact("name_affiliation")) ??
        findMatch(items, item, isMatch_String_EditDistance("name_affiliation"))
    );
}

function mergeGroupPerson(
    item1: IntermediaryGroupPersonDescriptor,
    item2: IntermediaryGroupPersonDescriptor
): {
    changes: ChangeSummary[];
    result: IntermediaryGroupPersonDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result: IntermediaryGroupPersonDescriptor = {};

    mergeFieldInPlace(changes, result, "id", item1, item2);
    mergeFieldInPlace(changes, result, "name_affiliation", item1, item2);
    mergeFieldInPlace(changes, result, "personId", item1, item2);
    mergeFieldInPlace(changes, result, "priority", item1, item2);
    mergeFieldInPlace(changes, result, "role", item1, item2);

    changes.push({
        location: "ContentGroupPerson",
        type: "MERGE_IMPORTED",
        description: "Merged two matching group-persons.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function mergeGroupPeople(
    items1: IntermediaryGroupPersonDescriptor[],
    items2: IntermediaryGroupPersonDescriptor[]
): {
    changes: ChangeSummary[];
    result: IntermediaryGroupPersonDescriptor[];
} {
    return mergeLists(
        "ContentGroupPerson",
        "Inserted unmatched group-person",
        items1,
        items2,
        findExistingGroupPerson,
        mergeGroupPerson
    );
}

function findExistingGroupHallway(
    items: IntermediaryGroupHallwayDescriptor[],
    item: IntermediaryGroupHallwayDescriptor
): number | undefined {
    return findMatch(items, item, isMatch_Id) || findMatch(items, item, isMatch_String_Exact("hallwayId"));
}

function mergeGroupHallway(
    item1: IntermediaryGroupHallwayDescriptor,
    item2: IntermediaryGroupHallwayDescriptor
): {
    changes: ChangeSummary[];
    result: IntermediaryGroupHallwayDescriptor;
} {
    const changes: ChangeSummary[] = [];
    const result: IntermediaryGroupHallwayDescriptor = {};

    mergeFieldInPlace(changes, result, "id", item1, item2);
    mergeFieldInPlace(changes, result, "hallwayId", item1, item2);
    mergeFieldInPlace(changes, result, "layout", item1, item2);
    mergeFieldInPlace(changes, result, "priority", item1, item2);

    changes.push({
        location: "ContentGroupHallway",
        type: "MERGE_IMPORTED",
        description: "Merged two matching group-hallways.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function mergeGroupHallways(
    items1: IntermediaryGroupHallwayDescriptor[],
    items2: IntermediaryGroupHallwayDescriptor[]
): {
    changes: ChangeSummary[];
    result: IntermediaryGroupHallwayDescriptor[];
} {
    return mergeLists(
        "ContentGroupHallway",
        "Inserted unmatched group-hallway",
        items1,
        items2,
        findExistingGroupHallway,
        mergeGroupHallway
    );
}

function mergeGroup(
    group1: IntermediaryGroupDescriptor,
    group2: IntermediaryGroupDescriptor
): {
    result: IntermediaryGroupDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result: IntermediaryGroupDescriptor = {};

    mergeFieldInPlace(changes, result, "id", group1, group2);
    mergeFieldInPlace(changes, result, "originatingDataSourceId", group1, group2, mergeOriginatingSourceId);
    mergeFieldInPlace(changes, result, "title", group1, group2);
    mergeFieldInPlace(changes, result, "typeName", group1, group2);
    mergeFieldInPlace(changes, result, "items", group1, group2, mergeItems);
    mergeFieldInPlace(changes, result, "requiredItems", group1, group2, mergeRequiredItems);
    mergeFieldInPlace(changes, result, "tagNames", group1, group2, mergeTagNames);
    mergeFieldInPlace(changes, result, "people", group1, group2, mergeGroupPeople);
    mergeFieldInPlace(changes, result, "hallways", group1, group2, mergeGroupHallways);

    changes.push({
        location: "ContentGroup",
        type: "MERGE_IMPORTED",
        description: "Merged two matching groups.",
        importData: [group1, group2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingGroup(
    groups: IntermediaryGroupDescriptor[],
    group: IntermediaryGroupDescriptor
): number | undefined {
    return (
        findMatch(groups, group, isMatch_Id) ??
        findMatch(groups, group, isMatch_OriginatingDataSourceId) ??
        findMatch(groups, group, isMatch_String_Exact("title")) ??
        findMatch(groups, group, isMatch_String_EditDistance("title"))
    );
}

function mergeHallway(
    item1: IntermediaryHallwayDescriptor,
    item2: IntermediaryHallwayDescriptor
): {
    result: IntermediaryHallwayDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result: IntermediaryHallwayDescriptor = {};

    mergeFieldInPlace(changes, result, "id", item1, item2);
    mergeFieldInPlace(changes, result, "name", item1, item2);
    mergeFieldInPlace(changes, result, "colour", item1, item2);
    mergeFieldInPlace(changes, result, "priority", item1, item2);

    changes.push({
        location: "Hallway",
        type: "MERGE_IMPORTED",
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
    items: IntermediaryHallwayDescriptor[],
    item: IntermediaryHallwayDescriptor
): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_String_Exact("name")) ??
        findMatch(items, item, isMatch_String_EditDistance("name"))
    );
}

function mergeOriginatingData(
    item1: IntermediaryOriginatingDataDescriptor,
    item2: IntermediaryOriginatingDataDescriptor
): {
    result: IntermediaryOriginatingDataDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result: IntermediaryOriginatingDataDescriptor = {};

    // TODO

    changes.push({
        location: "OriginatingData",
        type: "MERGE_IMPORTED",
        description: "Merged two matching originating data.",
        importData: [item1, item2],
        newData: result,
    });

    return {
        result,
        changes,
    };
}

function findExistingOriginatingData(
    items: IntermediaryOriginatingDataDescriptor[],
    item: IntermediaryOriginatingDataDescriptor
): number | undefined {
    return findMatch(items, item, isMatch_Id);
    // TODO
}

function mergePerson(
    item1: IntermediaryPersonDescriptor,
    item2: IntermediaryPersonDescriptor
): {
    result: IntermediaryPersonDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result: IntermediaryPersonDescriptor = {};

    mergeFieldInPlace(changes, result, "id", item1, item2);
    mergeFieldInPlace(changes, result, "originatingDataSourceId", item1, item2, mergeOriginatingSourceId);
    mergeFieldInPlace(changes, result, "name", item1, item2);
    mergeFieldInPlace(changes, result, "affiliation", item1, item2);
    mergeFieldInPlace(changes, result, "email", item1, item2);

    changes.push({
        location: "Person",
        type: "MERGE_IMPORTED",
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
    items: IntermediaryPersonDescriptor[],
    item: IntermediaryPersonDescriptor
): number | undefined {
    const generateMatchableName = (x: IntermediaryPersonDescriptor): string | undefined => {
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
            return matchDistance(left, right);
        })
    );
}

function mergeImportedData(
    importData: Record<string, IntermediaryData>
): {
    data: IntermediaryData;
    changes: ChangeSummary[];
} {
    const dataKeys = Object.keys(importData);
    if (dataKeys.length === 0) {
        throw new Error("No data available");
    }

    const key1 = dataKeys.pop();
    assert(key1);
    const result: IntermediaryData = {};
    const changes: ChangeSummary[] = [];

    for (const dataKey of dataKeys) {
        const data = importData[dataKey];

        mergeFieldInPlace(changes, result, "groups", importData[key1], data, (items1, items2) =>
            mergeLists("ContentGroup", "Inserted unmatched group", items1, items2, findExistingGroup, mergeGroup)
        );

        mergeFieldInPlace(changes, result, "hallways", importData[key1], data, (items1, items2) =>
            mergeLists("Hallway", "Inserted unmatched hallway", items1, items2, findExistingHallway, mergeHallway)
        );

        mergeFieldInPlace(changes, result, "originatingDatas", importData[key1], data, (items1, items2) =>
            mergeLists(
                "OriginatingData",
                "Inserted unmatched originating data",
                items1,
                items2,
                findExistingOriginatingData,
                mergeOriginatingData
            )
        );

        mergeFieldInPlace(changes, result, "people", importData[key1], data, (items1, items2) =>
            mergeLists("Person", "Inserted unmatched person", items1, items2, findExistingPerson, mergePerson)
        );

        if (data.people) {
            // TODO
        }

        if (data.tags) {
            // TODO
        }
    }

    return {
        data: result,
        changes,
    };
}

function mergeContent(
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
    // Step 1: Attempt to merge the imported datas together
    // Step 2: Attempt to merge the import data with the original data
    //         inc. remapping Intermediary Data onto full data (i.e. sort out mapping tag
    //         names to proper ids and stuff, using existing ids where possible)
    const changes: ChangeSummary[] = [];
    const newContentGroups = new Map<string, ContentGroupDescriptor>();
    const newPeople = new Map<string, ContentPersonDescriptor>();
    const newTags = new Map<string, TagDescriptor>();
    const newOriginatingDatas = new Map<string, OriginatingDataDescriptor>();
    const newHallways = new Map<string, HallwayDescriptor>();

    const { data: mergedImportData, changes: mergeImportsChanges } = mergeImportedData(importData);
    changes.push(...mergeImportsChanges);

    return {
        changes,
        newContentGroups: originalContentGroups,
        newPeople: originalPeople,
        newTags: originalTags,
        newOriginatingDatas: originalOriginatingDatas,
        newHallways: originalHallways,
    };
}

export default function MergePanel({ data }: { data: Record<string, IntermediaryData> }): JSX.Element {
    const {
        errorContent,
        loadingContent,
        originalContentGroups,
        originalHallways,
        originalOriginatingDatas,
        originalPeople,
        originalTags,
    } = useSaveContentDiff();

    const [mergedGroupsMap, setMergedContentGroupsMap] = useState<Map<string, ContentGroupDescriptor>>();
    const [mergedPeopleMap, setMergedPeopleMap] = useState<Map<string, ContentPersonDescriptor>>();
    const [mergedHallwaysMap, setMergedHallwaysMap] = useState<Map<string, HallwayDescriptor>>();
    const [mergedTagsMap, setMergedTagsMap] = useState<Map<string, TagDescriptor>>();
    const [mergedOriginatingDatasMap, setMergedOriginatingDatasMap] = useState<
        Map<string, OriginatingDataDescriptor>
    >();
    const [changes, setChanges] = useState<ChangeSummary[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (originalContentGroups && originalHallways && originalOriginatingDatas && originalPeople && originalTags) {
            try {
                setError(null);
                const merged = mergeContent(
                    data,
                    originalContentGroups,
                    originalHallways,
                    originalOriginatingDatas,
                    originalPeople,
                    originalTags
                );
                setMergedContentGroupsMap(merged.newContentGroups);
                setMergedPeopleMap(merged.newPeople);
                setMergedHallwaysMap(merged.newHallways);
                setMergedTagsMap(merged.newTags);
                setMergedOriginatingDatasMap(merged.newOriginatingDatas);
                setChanges(merged.changes);
                console.log("Merged", merged);
            } catch (e) {
                setMergedContentGroupsMap(originalContentGroups);
                setMergedPeopleMap(originalPeople);
                setMergedHallwaysMap(originalHallways);
                setMergedTagsMap(originalTags);
                setMergedOriginatingDatasMap(originalOriginatingDatas);
                setChanges([]);
                setError(e.message);
            }
        }
    }, [data, originalContentGroups, originalHallways, originalOriginatingDatas, originalPeople, originalTags]);

    return loadingContent &&
        (!mergedGroupsMap || !mergedTagsMap || !mergedPeopleMap || !mergedOriginatingDatasMap || !mergedHallwaysMap) ? (
        <Spinner />
    ) : errorContent ? (
        <>An error occurred loading in data - please see further information in notifications.</>
    ) : (
        <>
            {error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>An error occurred</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : undefined}
            {changes ? (
                <Alert status="info" mb={2}>
                    <AlertIcon />
                    <AlertTitle mr={2}>
                        {changes.length} change{changes.length !== 1 ? "s" : ""} detected.
                    </AlertTitle>
                    <AlertDescription>
                        <Button
                            aria-label="Copy changes summary JSON"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(changes, null, 2));
                            }}
                        >
                            <FAIcon iconStyle="r" icon="clipboard" />
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            <JSONataQueryModal data={changes} buttonText="Changes Query Tool" defaultQuery={"*"} />
            <Box mt={2}>TODO: Review all final data</Box>
        </>
    );
}
