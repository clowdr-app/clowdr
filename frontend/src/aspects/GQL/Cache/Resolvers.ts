import type { Cache, ResolveInfo, Variables } from "@urql/exchange-graphcache";
import type {
    Bigint_Comparison_Exp,
    Boolean_Comparison_Exp,
    Float_Comparison_Exp,
    GraphCacheResolvers,
    Int_Comparison_Exp,
    Jsonb_Comparison_Exp,
    Numeric_Comparison_Exp,
    String_Comparison_Exp,
    Timestamptz_Comparison_Exp,
    Uuid_Comparison_Exp,
} from "../../../generated/graphql";

type DiadicBooleanClauses = {
    _and?: ReadonlyArray<ConditionalClauses> | null;
    _or?: ReadonlyArray<ConditionalClauses> | null;
    _not?: ConditionalClauses | null;
};
type FieldClauses =
    | Bigint_Comparison_Exp
    | Boolean_Comparison_Exp
    | Float_Comparison_Exp
    | Int_Comparison_Exp
    | Jsonb_Comparison_Exp
    | Numeric_Comparison_Exp
    | String_Comparison_Exp
    | Timestamptz_Comparison_Exp
    | Uuid_Comparison_Exp;

type ConditionalClauses<FieldKeys extends string = any> = DiadicBooleanClauses &
    {
        [fieldKey in Exclude<keyof DiadicBooleanClauses | keyof FieldClauses, FieldKeys>]:
            | FieldClauses
            | ConditionalClauses
            | null;
    };

function satisfiesScalarConditions(where: FieldClauses, fieldValue: any, _args: Variables, _cache: Cache): boolean {
    // TODO
    console.log("Scalar condition", { where, fieldValue });

    if ("_eq" in where && where._eq) {
        if (typeof where._eq === "string") {
            // TODO
        } else {
            // TODO
        }
    } else if ("_gt" in where && where._gt) {
        // TODO
    } else if ("_gte" in where && where._gte) {
        // TODO
    } else if ("_in" in where && where._in) {
        // TODO
    } else if ("_is_null" in where && where._is_null) {
        // TODO
    } else if ("_lt" in where && where._lt) {
        // TODO
    } else if ("_lte" in where && where._lte) {
        // TODO
    } else if ("_neq" in where && where._neq) {
        // TODO
    } else if ("_nin" in where && where._nin) {
        // TODO
    } else if ("_contained_in" in where && where._contained_in) {
        // TODO
    } else if ("_contains" in where && where._contains) {
        // TODO
    } else if ("_has_key" in where && where._has_key) {
        // TODO
    } else if ("_has_keys_all" in where && where._has_keys_all) {
        // TODO
    } else if ("_has_keys_any" in where && where._has_keys_any) {
        // TODO
    } else if ("_ilike" in where && where._ilike) {
        // TODO
    } else if ("_iregex" in where && where._iregex) {
        // TODO
    } else if ("_like" in where && where._like) {
        // TODO
    } else if ("_nilike" in where && where._nilike) {
        // TODO
    } else if ("_niregex" in where && where._niregex) {
        // TODO
    } else if ("_nlike" in where && where._nlike) {
        // TODO
    } else if ("_nregex" in where && where._nregex) {
        // TODO
    } else if ("_nsimilar" in where && where._nsimilar) {
        // TODO
    } else if ("_regex" in where && where._regex) {
        // TODO
    } else if ("_similar" in where && where._similar) {
        // TODO
    } else {
        return true;
    }

    return false;
}

function satisfiesConditions(where: ConditionalClauses, entityKey: string, args: Variables, cache: Cache): boolean {
    console.log("Conditions", { where, entityKey });

    for (const conditionKey in where) {
        if (conditionKey === "_and") {
            const conditions = where[conditionKey];
            if (conditions) {
                for (const innerCondition of conditions) {
                    if (!satisfiesConditions(innerCondition, entityKey, args, cache)) {
                        return false;
                    }
                }
            }
        } else if (conditionKey === "_or") {
            const conditions = where[conditionKey];
            if (conditions) {
                let ok = false;
                for (const innerCondition of conditions) {
                    if (satisfiesConditions(innerCondition, entityKey, args, cache)) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) {
                    return false;
                }
            }
        } else if (conditionKey === "_not") {
            const innerCondition = where[conditionKey];
            if (innerCondition) {
                if (satisfiesConditions(innerCondition, entityKey, args, cache)) {
                    return false;
                }
            }
        } else {
            const condition = (where as any)[conditionKey] as FieldClauses | ConditionalClauses | null;
            if (condition) {
                const conditionOps = Object.keys(condition);
                if (conditionOps.some((op) => op.startsWith("_") && op !== "_and" && op !== "_or" && op !== "_not")) {
                    // Scalar condition
                    const typedCondition: FieldClauses = condition as FieldClauses;
                    const fieldValue = cache.resolve(entityKey, conditionKey);
                    if (!satisfiesScalarConditions(typedCondition, fieldValue, args, cache)) {
                        return false;
                    }
                } else {
                    // Non-scalar condition
                    const typedCondition: ConditionalClauses = condition as ConditionalClauses;
                    const innerEntityKeys = cache.resolve(entityKey, conditionKey) as null | string | string[];
                    // TODO: This is the point at which the foreign key constraint needs inserting.
                    //  e.g. fetching `item` of `content_Element` requires lookup of items where `content_Item.id` equals `content_Element.itemId`
                    //  e.g. fetching `elements` of `content_Item` requires lookup of elements where `content_Element.itemId` equals `content_Item.id`
                    if (innerEntityKeys) {
                        if (innerEntityKeys instanceof Array) {
                            let ok = false;
                            for (const innerEntityKey of innerEntityKeys) {
                                if (satisfiesConditions(typedCondition, innerEntityKey, args, cache)) {
                                    ok = true;
                                    break;
                                }
                            }
                            if (!ok) {
                                return false;
                            }
                        } else {
                            if (!satisfiesConditions(typedCondition, innerEntityKeys, args, cache)) {
                                return false;
                            }
                        }
                    } else {
                        return false;
                    }
                }
            }
        }
    }

    return true;
}

// function logEntity(entityKey: string, cache: Cache): any {
//     const fieldInfos = cache.inspectFields(entityKey);
//     const result: any = {};
//     for (const fieldInfo of fieldInfos) {
//         const fieldValue = cache.resolve(entityKey, fieldInfo.fieldKey);
//         if (fieldValue instanceof Array) {
//             result[fieldInfo.fieldName] = [];
//             for (const val of fieldValue) {
//                 result[fieldInfo.fieldName].push(logEntity(val as string, cache));
//             }
//         } else {
//             result[fieldInfo.fieldName] = fieldValue;
//         }
//     }
//     console.log(`Entity: ${entityKey}`, result);
//     return result;
// }

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function genericConditionalLookup(parent: any, args: Variables, cache: Cache, info: ResolveInfo): any {
    // TODO: Do the simple test first - see if the exact desired key is in the cache

    console.log(`--------------- BEGIN CACHE LOOKUP (${info.fieldName}) ---------------`);
    const allFields = cache.inspectFields(info.parentKey);
    const fieldInfos = allFields.filter((fieldInfo) => fieldInfo.fieldName === info.fieldName);
    if (fieldInfos.length === 0) {
        console.log("--------------- END CACHE LOOKUP (0) ---------------");
        return undefined;
    }

    const result = new Set<string>();
    if (args.where) {
        console.log(`CONDITIONS:\n${JSON.stringify(args.where, null, 2)}`);

        const where = args.where;
        const keysToTest = new Set<string>();
        for (const fieldInfo of fieldInfos) {
            const keys = cache.resolve(parent, fieldInfo.fieldKey) as string | string[] | null;
            if (keys) {
                if (keys instanceof Array) {
                    keys.forEach((key) => {
                        keysToTest.add(key);
                    });
                } else {
                    keysToTest.add(keys);
                }
            }
        }

        for (const key of keysToTest) {
            if (satisfiesConditions(where, key, cache)) {
                result.add(key);
            }
        }
    } else {
        for (const fieldInfo of fieldInfos) {
            const keys = cache.resolve(parent, fieldInfo.fieldKey) as string | string[] | null;
            if (keys) {
                if (keys instanceof Array) {
                    keys.forEach((key) => result.add(key));
                } else {
                    result.add(keys);
                }
            }
        }
    }

    if (result.size === 0) {
        console.log("--------------- END CACHE LOOKUP (1) ---------------");
        return undefined;
    }

    // TODO: args.order_by
    // TODO: args.distinct_on
    // TODO: args.offset
    // TODO: args.limit

    console.log("--------------- END CACHE LOOKUP (2) ---------------");

    // TODO: This isn't good enough - we need to resolve links manually too
    // TODO: However, we should also account for nested data in case a field necessary for filtering was missing
    //       from the cached object but was known at the time the original query was made
    return [...result];
}

export const resolvers: GraphCacheResolvers = {
    query_root: {
        content_Item: genericConditionalLookup,
        content_Element: genericConditionalLookup,
        room_Participant: genericConditionalLookup,
    },
};

//     content_Element: {
//         item: (parent, _args, cache, _info) => {
//             const itemId = cache.resolve(parent, "itemId");
//             if (typeof itemId === "string") {
//                 return cache.keyOfEntity({
//                     __typename: "content_Item",
//                     id: itemId,
//                 });
//             }
//             return null;
//         },
//     },
// },
