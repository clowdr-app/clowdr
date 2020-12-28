import levenshtein from "levenshtein-edit-distance";
import type { OriginatingDataDescriptor } from "../Content/Types";

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

    originalData?: any;
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
        result: x,
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
    context: C,
    tableName: string,
    list1: S[],
    list2: (S | T)[],
    find: (items: S[], item: S | T) => number | undefined,
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
        const existingIdx = find(results, item2);
        if (existingIdx !== undefined) {
            const existingItem = results[existingIdx];
            const { result: newItem, changes: newChanges } = merge(context, existingItem, convert(context, item2));
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
            const newItem = convert(context, item2);
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

export function findMatch<S, T>(items: S[], item: T, isMatch: (item1: S, item2: T) => boolean): number | undefined {
    for (let idx = 0; idx < items.length; idx++) {
        if (isMatch(items[idx], item)) {
            return idx;
        }
    }
    return undefined;
}

// TODO: Handle remappings
export function isMatch_Id<T extends { id?: string }, S extends T>(item1: S, item2: T): boolean {
    return !!item1.id && !!item2.id && item1.id === item2.id;
}

export function isMatch_OriginatingData<
    T extends { id?: string; sourceId?: string; originatingDataId?: string; originatingDataSourceId?: string },
    S extends { id?: string; sourceId?: string; originatingDataId?: string; originatingDataSourceId?: string }
>(item1: S, item2: T): boolean {
    if (item1.id) {
        if (item2.id) {
            if (item1.id === item2.id) {
                return true;
            }
        }

        if (item2.originatingDataId) {
            if (item1.id === item2.originatingDataId) {
                return true;
            }
        }
    }

    if (item2.id) {
        if (item1.originatingDataId) {
            if (item2.id === item1.originatingDataId) {
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
    return parts1.some((part) => parts2.includes(part));
}

export function isMatch_OriginatingDataId<
    T extends { originatingDataId?: string; originatingDataSourceId?: string },
    S extends { originatingDataId?: string; originatingDataSourceId?: string }
>(item1: S, item2: T): boolean {
    const id1 = item1.originatingDataSourceId || item1.originatingDataId;
    const id2 = item2.originatingDataSourceId || item2.originatingDataId;
    if (!id1 || !id2) {
        return false;
    }

    const parts1 = id1.split("¬");
    const parts2 = id2.split("¬");
    return parts1.some((part) => parts2.includes(part));
}

export function isMatch_String_Exact<T, S extends T>(k?: keyof (S | T)): (item1: S, item2: T) => boolean {
    return (item1, item2) => {
        const v1 = k ? item1[k] : item1;
        const v2 = k ? item2[k] : item2;

        if (v1 === undefined || v2 === undefined || typeof v1 !== "string" || typeof v2 !== "string") {
            return false;
        }

        return v1.toLowerCase() === v2.toLowerCase();
    };
}

export function isMatch_String_EditDistance<T, S extends T>(k?: keyof (S | T)): (item1: S, item2: T) => boolean {
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

export function findExistingOriginatingData<
    T extends { id?: string; sourceId?: string; originatingDataId?: string; originatingDataSourceId?: string }
>(items: OriginatingDataDescriptor[], item: T): number | undefined {
    return findMatch(items, item, isMatch_OriginatingData);
}

export function findExistingNamedItem<
    T extends {
        id?: string;
        originatingDataId?: string;
        originatingDataSourceId?: string;
        name?: string;
    },
    S extends T
>(items: S[], item: T): number | undefined {
    return (
        findMatch(items, item, isMatch_Id) ??
        findMatch(items, item, isMatch_OriginatingDataId) ??
        findMatch(items, item, isMatch_String_Exact("name")) ??
        findMatch(items, item, isMatch_String_EditDistance("name"))
    );
}

export function findExistingString(items: string[], item: string): number | undefined {
    return findMatch(items, item, isMatch_String_Exact()) || findMatch(items, item, isMatch_String_EditDistance());
}

export function mergeIsNewInPlace<C, S extends { isNew?: boolean }>(_context: C, result: S, item1: S, item2: S): void {
    if (item1.isNew && item2.isNew) {
        result.isNew = true;
    } else {
        delete result.isNew;
    }
}
