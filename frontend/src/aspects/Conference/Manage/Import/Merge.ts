import type { IntermediaryOriginatingDataDescriptor } from "@clowdr-app/shared-types/build/import/intermediary";
import levenshtein from "levenshtein-edit-distance";
import { v4 as uuidv4 } from "uuid";
import type { OriginatingDataDescriptor } from "../Shared/Types";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function Set_toJSON(key: string, value: any): any {
    if (typeof value === "object" && value instanceof Set) {
        return [...value];
    }
    return value;
}

export interface ChangeSummary {
    location: string;
    type: "MERGE" | "INSERT" | "UPDATE" | "DELETE";
    description: string;

    importData: any[];
    newData: any;
}

export type Defined<T> = T extends undefined ? never : T;

export function defaultMerger<C, T>(
    _ctx: C,
    x: T,
    y: T,
    prefer: "VAL1" | "VAL2"
): {
    result: T;
    changes: ChangeSummary[];
} {
    if (typeof x === "string" && typeof y === "string") {
        if (x !== "" && y === "") {
            return {
                changes: [
                    {
                        type: "MERGE",
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
                        type: "MERGE",
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
                type: "MERGE",
                location: "Unknown - default merger",
                description: `Chose the ${prefer === "VAL1" ? "left" : "right"} of the two values.`,
                importData: [x, y],
                newData: [prefer === "VAL1" ? x : y],
            },
        ],
        result: prefer === "VAL1" ? x : y,
    };
}

export function mergeField<C, S, T extends S, K extends keyof (S | T)>(
    context: C,
    k: K,
    item1: S,
    item2: T,
    prefer: "VAL1" | "VAL2",
    merge: (
        context: C,
        val1: Defined<S[K]>,
        val2: Defined<T[K]>,
        prefer: "VAL1" | "VAL2"
    ) =>
        | {
              changes: ChangeSummary[];
              result: S[K];
          }
        | undefined = defaultMerger
):
    | {
          changes: ChangeSummary[];
          result: S[K];
      }
    | undefined {
    if (k in item1 && item1[k] !== undefined) {
        if (k in item2 && item2[k] !== undefined) {
            return merge(context, item1[k] as Defined<T[K]>, item2[k] as Defined<T[K]>, prefer);
        }
        return {
            changes: [
                {
                    type: "MERGE",
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
                    type: "MERGE",
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

export function mergeFieldInPlace<C, S, T extends S, K extends keyof (S | T)>(
    context: C,
    changes: ChangeSummary[],
    itemO: Partial<S>,
    k: K,
    item1: S,
    item2: T,
    preferNew = true,
    merge: (
        context: C,
        val1: Defined<S[K]>,
        val2: Defined<T[K]>,
        prefer: "VAL1" | "VAL2"
    ) =>
        | {
              changes: ChangeSummary[];
              result: S[K];
          }
        | undefined = defaultMerger
): void {
    const item1IsNew = "isNew" in item1 && (item1 as any).isNew;
    const item2IsNew = "isNew" in item2 && (item2 as any).isNew;
    const prefer = preferNew
        ? item1IsNew && !item2IsNew
            ? "VAL1"
            : "VAL2"
        : !item1IsNew && item2IsNew
        ? "VAL1"
        : "VAL2";

    const merged = mergeField(context, k, item1, item2, prefer, merge);
    if (merged !== undefined) {
        itemO[k] = merged.result;
        changes.push(...merged.changes);
    } else {
        delete itemO[k];
    }
}

export function mergeLists<C, S, T>(
    ctx: C,
    tableName: string,
    list1: S[],
    list2: (S | T)[],
    find: (context: C, items: S[], item: S | T) => number | undefined,
    convert: (context: C, item: S | T) => S,
    merge: (
        context: C,
        item1: S,
        item2: S
    ) => {
        changes: ChangeSummary[];
        result: S;
    } = (c, x, y) => defaultMerger(c, x, y, "VAL2")
): {
    changes: ChangeSummary[];
    result: S[];
} {
    const results = [...list1];
    const changes: ChangeSummary[] = [];

    for (const item2 of list2) {
        const existingIdx = find(ctx, results, item2);
        if (existingIdx !== undefined) {
            const existingItem = results[existingIdx];
            const { result: newItem, changes: newChanges } = merge(ctx, existingItem, convert(ctx, item2));
            results.splice(existingIdx, 1, newItem);
            changes.push(...newChanges);
            changes.push({
                location: tableName,
                type: "UPDATE",
                description: "Updated matched",
                importData: [existingItem, item2],
                newData: newItem,
            });
        } else {
            const newItem = convert(ctx, item2);
            changes.push({
                location: tableName,
                type: "INSERT",
                description: "Inserted unmatched",
                importData: [item2],
                newData: newItem,
            });
            results.push(newItem);
        }
    }

    return {
        result: results,
        changes,
    };
}

export function findMatch<C, S, T>(
    ctx: C,
    items: S[],
    item: T,
    isMatch: (ctx: C, item1: S, item2: T) => boolean
): number | undefined {
    for (let idx = 0; idx < items.length; idx++) {
        if (isMatch(ctx, items[idx], item)) {
            return idx;
        }
    }
    return undefined;
}

/**
 * The real object id -> list of other ids that have been merged into/absorbed by the object
 */
export type IdMap = Map<string, Set<string>>;

export type IdRemappingContext<TableNames extends keyof any> = {
    idMaps: Record<TableNames, IdMap>;
};

function isMatch_Id_internal<TableName extends string, C extends IdRemappingContext<TableName>>(
    ctx: C,
    tableName: TableName,
    id1: string,
    id2: string
): boolean {
    if (id1 === id2) {
        return true;
    }

    const idMap = ctx.idMaps[tableName];
    const map1 = idMap.get(id1);
    const map2 = idMap.get(id2);
    const id1Vals = [id1, ...(map1?.values() ?? [])];
    const id2Vals = [id2, ...(map2?.values() ?? [])];
    return id1Vals.some((id1) => id2Vals.includes(id1));
}

export function isMatch_Id_Generalised<
    TableName extends string,
    IdFieldName1 extends string,
    IdFieldName2 extends string,
    C extends IdRemappingContext<TableName>,
    S extends Partial<Record<IdFieldName1, string>>,
    T extends Partial<Record<IdFieldName2, string>>
>(
    tableName: TableName,
    idFieldName1: IdFieldName1,
    idFieldName2: IdFieldName2
): (ctx: C, item1: S, item2: T) => boolean {
    return (ctx, item1, item2) => {
        const f1: string | undefined = item1[idFieldName1];
        const f2: string | undefined = item2[idFieldName2];
        if (!f1 || !f2) {
            return false;
        }
        return isMatch_Id_internal(ctx, tableName, f1, f2);
    };
}

export function isMatch_Id<
    TableName extends string,
    C extends IdRemappingContext<TableName>,
    T extends { id?: string },
    S extends T
>(tableName: TableName): (ctx: C, item1: S, item2: T) => boolean {
    return isMatch_Id_Generalised<TableName, "id", "id", C, S, T>(tableName, "id", "id");
}

function isMatch_OriginatingData<
    C extends IdRemappingContext<"OriginatingData">,
    T extends { id?: string; sourceId?: string; originatingDataId?: string; originatingDataSourceId?: string },
    S extends { id?: string; sourceId?: string; originatingDataId?: string; originatingDataSourceId?: string }
>(ctx: C, item1: S, item2: T): boolean {
    if (item1.id) {
        if (item2.id) {
            if (isMatch_Id_internal(ctx, "OriginatingData", item1.id, item2.id)) {
                return true;
            }
        }

        if (item2.originatingDataId) {
            if (isMatch_Id_internal(ctx, "OriginatingData", item1.id, item2.originatingDataId)) {
                return true;
            }
        }
    }

    if (item2.id) {
        if (item1.originatingDataId) {
            if (isMatch_Id_internal(ctx, "OriginatingData", item1.originatingDataId, item2.id)) {
                return true;
            }
        }
    }

    const id1 = item1.originatingDataSourceId || item1.sourceId;
    const id2 = item2.originatingDataSourceId || item2.sourceId;
    if (!id1 || !id2) {
        return false;
    }

    const parts1 = id1.split("¬");
    const parts2 = id2.split("¬");
    return parts1.every((part) => parts2.includes(part)) && parts2.every((part) => parts1.includes(part));
}

export function isMatch_OriginatingDataId<
    C extends IdRemappingContext<"OriginatingData"> & {
        originatingDatas: OriginatingDataDescriptor[];
    },
    T extends { originatingDataId?: string; originatingDataSourceId?: string },
    S extends { originatingDataId?: string; originatingDataSourceId?: string }
>(ctx: C, item1: S, item2: T): boolean {
    const id1Index = item1.originatingDataSourceId
        ? findExistingOriginatingData(ctx, ctx.originatingDatas, item1)
        : undefined;
    const id1 = id1Index !== undefined ? ctx.originatingDatas[id1Index].id : item1.originatingDataId;

    const id2Index = item2.originatingDataSourceId
        ? findExistingOriginatingData(ctx, ctx.originatingDatas, item2)
        : undefined;
    const id2 = id2Index !== undefined ? ctx.originatingDatas[id2Index].id : item2.originatingDataId;

    if (!id1 || !id2) {
        return false;
    }

    return id1 === id2;
}

export function isMatch_String_Exact<C, T, S extends T>(k?: keyof (S | T)): (ctx: C, item1: S, item2: T) => boolean {
    return (_ctx, item1, item2) => {
        const v1 = k ? item1[k] : item1;
        const v2 = k ? item2[k] : item2;

        if (
            v1 === undefined ||
            v2 === undefined ||
            v1 === null ||
            v2 === null ||
            typeof v1 !== "string" ||
            typeof v2 !== "string" ||
            v1 === "" ||
            v2 === ""
        ) {
            return false;
        }

        return v1.toLowerCase() === v2.toLowerCase();
    };
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function isMatch_String_EditDistance<C, T, S extends T>(
    k?: keyof (S | T)
): (ctx: C, item1: S, item2: T) => boolean {
    return (_ctx, item1, item2) => {
        const _v1 = k ? item1[k] : item1;
        const _v2 = k ? item2[k] : item2;

        if (_v1 === undefined || _v2 === undefined || typeof _v1 !== "string" || typeof _v2 !== "string") {
            return false;
        }

        const v1: string = _v1;
        const v2: string = _v2;

        const lengthDiff = Math.abs(v1.length - v2.length);
        const longerLength = Math.max(v1.length, v2.length);
        const shorterLength = Math.min(v1.length, v2.length);
        const threshhold = 0.15;
        if (shorterLength <= 8 || lengthDiff / shorterLength > threshhold) {
            return false;
        }

        const editDistance = levenshtein(v1.toLowerCase(), v2.toLowerCase());
        if (editDistance / longerLength >= threshhold) {
            return false;
        }

        // Ignore purely numeric differences such as "XYZ Part 1" // "XYZ Part 2"
        const testStr = "^" + escapeRegExp(v1).replace(/[0-9]/g, "[0-9]+") + "$";
        return !new RegExp(testStr).test(v2);
    };
}

export function findExistingOriginatingData<
    C extends IdRemappingContext<"OriginatingData">,
    T extends { id?: string; sourceId?: string; originatingDataId?: string; originatingDataSourceId?: string }
>(ctx: C, items: OriginatingDataDescriptor[], item: T): number | undefined {
    return findMatch(ctx, items, item, isMatch_OriginatingData);
}

export function findExistingNamedItem<
    TableName extends string,
    C extends IdRemappingContext<TableName | "OriginatingData">,
    T extends {
        id?: string;
        name?: string;
    },
    S extends T
>(tableName: TableName): (ctx: C, items: S[], item: T) => number | undefined {
    return (ctx, items, item) => {
        return (
            findMatch(ctx, items, item, isMatch_Id(tableName)) ??
            findMatch(ctx, items, item, isMatch_String_Exact("name")) ??
            findMatch(ctx, items, item, isMatch_String_EditDistance("name"))
        );
    };
}

export function findExistingEmailItem<
    TableName extends string,
    C extends IdRemappingContext<TableName | "OriginatingData">,
    T extends {
        id?: string;
        email?: string;
    },
    S extends T
>(tableName: TableName): (ctx: C, items: S[], item: T) => number | undefined {
    return (ctx, items, item) => {
        return (
            findMatch(ctx, items, item, isMatch_Id(tableName)) ??
            findMatch(ctx, items, item, isMatch_String_Exact("email"))
        );
    };
}

export function findExistingString<C>(ctx: C, items: string[], item: string): number | undefined {
    return (
        findMatch(ctx, items, item, isMatch_String_Exact()) ||
        findMatch(ctx, items, item, isMatch_String_EditDistance())
    );
}

export function mergeIdInPlace<
    TableName extends string,
    C extends IdRemappingContext<TableName>,
    S extends { id?: string; isNew?: boolean }
>(
    tableName: TableName,
    ctx: C,
    changes: ChangeSummary[],
    result: S,
    item1: S,
    item2: S,
    treatNoIdAsError = true
): void {
    function absorbId(concreteId: string, absorbedId: string) {
        let concreteSet = idMap.get(concreteId);
        if (concreteSet) {
            concreteSet.add(absorbedId);
        } else {
            concreteSet = new Set([absorbedId]);
            idMap.set(concreteId, concreteSet);
        }
        const concreteSet_TypeCorrect: Set<string> = concreteSet;

        const absorbedSet = idMap.get(absorbedId);
        if (absorbedSet) {
            idMap.delete(absorbedId);
            absorbedSet.forEach((id) => concreteSet_TypeCorrect.add(id));
        }
    }

    const idMap = ctx.idMaps[tableName];

    if (item1.id && !item1.isNew) {
        result.id = item1.id;
        changes.push({
            location: tableName + ".id",
            description: "Chose left value as it was not new.",
            type: "MERGE",
            importData: [item1.id, item2.id],
            newData: item1.id,
        });

        if (item2.id) {
            absorbId(item1.id, item2.id);
        }
    } else if (item2.id && !item2.isNew) {
        result.id = item2.id;
        changes.push({
            location: tableName + ".id",
            description: "Chose right value as it was not new.",
            type: "MERGE",
            importData: [item1.id, item2.id],
            newData: item2.id,
        });

        if (item1.id) {
            absorbId(item2.id, item1.id);
        }
    } else if (item1.id) {
        result.id = item1.id;
        changes.push({
            location: tableName + ".id",
            description: "Chose left value as it was preferred.",
            type: "MERGE",
            importData: [item1.id, item2.id],
            newData: item1.id,
        });

        if (item2.id) {
            absorbId(item1.id, item2.id);
        }
    } else if (item2.id) {
        result.id = item2.id;
        changes.push({
            location: tableName + ".id",
            description: "Chose right value as it was preferred.",
            type: "MERGE",
            importData: [item1.id, item2.id],
            newData: item2.id,
        });

        if (item1.id) {
            absorbId(item2.id, item1.id);
        }
    } else if (treatNoIdAsError) {
        throw new Error("No available Id to merge!");
    }
}

export function mergeIsNewInPlace<C, S extends { isNew?: boolean }>(_context: C, result: S, item1: S, item2: S): void {
    if (item1.isNew && item2.isNew) {
        result.isNew = true;
    } else {
        delete result.isNew;
    }
}

export function sourceIdsEquivalent(
    sId1: string,
    sId2: string,
    treatExactAs: "L" | "R" | undefined = undefined
): "L" | "R" | undefined {
    const ps1 = sId1.split("¬");
    const ps2 = sId2.split("¬");
    if (ps1.length > ps2.length) {
        if (ps2.every((id) => ps1.includes(id))) {
            return "R";
        } else if (ps1.every((id) => ps2.includes(id))) {
            return "L";
        }
    } else if (ps1.length < ps2.length) {
        if (ps1.every((id) => ps2.includes(id))) {
            return "L";
        } else if (ps2.every((id) => ps1.includes(id))) {
            return "R";
        }
    } else if (ps1.every((id) => ps2.includes(id)) && ps2.every((id) => ps1.includes(id))) {
        return treatExactAs;
    }
    return undefined;
}

export function mergeOriginatingDataIdInPlace<
    C extends IdRemappingContext<"OriginatingData"> & { originatingDatas: OriginatingDataDescriptor[] },
    S extends { originatingDataId?: string }
>(ctx: C, changes: ChangeSummary[], result: S, item1: S, item2: S): void {
    if (item1.originatingDataId && item2.originatingDataId) {
        if (item1.originatingDataId === item2.originatingDataId) {
            result.originatingDataId = item1.originatingDataId;
        } else {
            const data1Idx = findExistingOriginatingData<C, S>(ctx, ctx.originatingDatas, item1);
            const data2Idx = findExistingOriginatingData<C, S>(ctx, ctx.originatingDatas, item2);
            if (data1Idx !== undefined && data2Idx !== undefined) {
                const data1 = ctx.originatingDatas[data1Idx];
                const data2 = ctx.originatingDatas[data2Idx];

                const d1SParts = data1.sourceId.split("¬");
                const d2SParts = data2.sourceId.split("¬");
                const existingMergedData = ctx.originatingDatas.find((d) => {
                    const sParts = d.sourceId.split("¬");
                    if (
                        d1SParts.every((id) => sParts.includes(id)) &&
                        d2SParts.every((id) => sParts.includes(id)) &&
                        sParts.every((id) => d1SParts.includes(id) || d2SParts.includes(id))
                    ) {
                        return d;
                    }
                    return undefined;
                });
                if (existingMergedData) {
                    const mergedId = existingMergedData.id;

                    changes.push({
                        location: "Unknown - Originating data id",
                        description: "Used merged data for existing single source.",
                        type: "MERGE",
                        importData: [item1.originatingDataId, item2.originatingDataId],
                        newData: mergedId,
                    });
                    result.originatingDataId = mergedId;
                } else {
                    const newData: OriginatingDataDescriptor = {
                        id: uuidv4(),
                        isNew: true,
                        sourceId: data1.sourceId + "¬" + data2.sourceId,
                        data: [...data1.data, ...data2.data],
                    };
                    ctx.originatingDatas.push(newData);
                    const mergedId = newData.id;

                    changes.push({
                        location: "Unknown - Originating data id",
                        description: "Merged datas into a single source.",
                        type: "MERGE",
                        importData: [item1.originatingDataId, item2.originatingDataId],
                        newData: mergedId,
                    });
                    result.originatingDataId = mergedId;
                }
            } else if (data1Idx !== undefined) {
                result.originatingDataId = item1.originatingDataId;
                changes.push({
                    location: "Unknown - Originating data id",
                    description: "Chose only available value (lefthand) (righthand originating data not found)",
                    type: "MERGE",
                    importData: [item1.originatingDataId],
                    newData: item1.originatingDataId,
                });
            } else if (data2Idx !== undefined) {
                result.originatingDataId = item2.originatingDataId;
                changes.push({
                    location: "Unknown - Originating data id",
                    description: "Chose only available value (righthand) (lefthand originating data not found)",
                    type: "MERGE",
                    importData: [item2.originatingDataId],
                    newData: item2.originatingDataId,
                });
            } else {
                delete result.originatingDataId;
            }
        }
    } else if (item1.originatingDataId) {
        result.originatingDataId = item1.originatingDataId;
        changes.push({
            location: "Unknown - Originating data id",
            description: "Chose only available value (lefthand)",
            type: "MERGE",
            importData: [item1.originatingDataId],
            newData: item1.originatingDataId,
        });
    } else if (item2.originatingDataId) {
        result.originatingDataId = item2.originatingDataId;
        changes.push({
            location: "Unknown - Originating data id",
            description: "Chose only available value (righthand)",
            type: "MERGE",
            importData: [item2.originatingDataId],
            newData: item2.originatingDataId,
        });
    } else {
        delete result.originatingDataId;
    }
}

export function convertOriginatingData<C>(
    context: C,
    item: IntermediaryOriginatingDataDescriptor | OriginatingDataDescriptor
): OriginatingDataDescriptor {
    const result = {
        id: ("id" in item ? item.id : undefined) ?? uuidv4(),
        isNew: ("isNew" in item && item.isNew) || !("id" in item ? item.id : undefined),

        data: "data" in item ? item.data : [],
        sourceId: "sourceId" in item ? item.sourceId : undefined,
    } as OriginatingDataDescriptor;

    return result;
}

export function mergeOriginatingData<C>(
    context: C,
    item1: OriginatingDataDescriptor,
    item2: OriginatingDataDescriptor
): {
    result: OriginatingDataDescriptor;
    changes: ChangeSummary[];
} {
    const changes: ChangeSummary[] = [];

    const result = {} as OriginatingDataDescriptor;

    const sIdD = sourceIdsEquivalent(item1.sourceId, item2.sourceId);
    if (sIdD === "L") {
        result.id = item1.id;
        if (item1.isNew) {
            result.isNew = true;
        }
        result.data = [...item1.data];
        result.sourceId = item1.sourceId;
    } else if (sIdD === "R") {
        result.id = item2.id;
        if (item2.isNew) {
            result.isNew = true;
        }
        result.data = [...item2.data];
        result.sourceId = item2.sourceId;
    } else {
        if (!item1.isNew) {
            result.id = item1.id;
            result.isNew = false;
            result.data = [...item1.data, ...item2.data];
            result.sourceId =
                item1.sourceId === item2.sourceId ? item1.sourceId : item1.sourceId + "¬" + item2.sourceId;
        } else if (!item2.isNew) {
            result.id = item2.id;
            result.isNew = false;
            result.data = [...item2.data, ...item1.data];
            result.sourceId =
                item1.sourceId === item2.sourceId ? item1.sourceId : item1.sourceId + "¬" + item2.sourceId;
        } else {
            result.id = uuidv4();
            result.isNew = true;
            result.data = [...item1.data, ...item2.data];
            result.sourceId =
                item1.sourceId === item2.sourceId ? item1.sourceId : item1.sourceId + "¬" + item2.sourceId;
        }
    }

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
