import type { Cache, Variables } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import { GraphQLError } from "graphql";
import _ from "lodash";
import type { AugmentedIntrospectionData, ConditionalClauses, FieldClauses } from "./types";
import { ScalarComparisonType } from "./types";

export function satisfiesScalarEquality(where: any, fieldValue: any, comparisonType: ScalarComparisonType): boolean {
    if (where === undefined || where === null) {
        return false;
    }

    switch (comparisonType) {
        case ScalarComparisonType.Bigint:
        case ScalarComparisonType.Boolean:
        case ScalarComparisonType.Float:
        case ScalarComparisonType.Int:
        case ScalarComparisonType.Numeric:
        case ScalarComparisonType.String:
        case ScalarComparisonType.Uuid:
            return where === fieldValue;
        case ScalarComparisonType.Jsonb:
            return _.isEqual(where, fieldValue);
        case ScalarComparisonType.Timestamptz: {
            const d1 = where instanceof Date ? where : new Date(where);
            const d2 = fieldValue instanceof Date ? fieldValue : new Date(fieldValue);
            return d1.getTime() === d2.getTime();
        }
        default:
            // Things like enum comparisons slip through to here
            return where === fieldValue;
    }
}

export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function escapeSQLRegExp(string: string): string {
    return string.replace(/[.\\]/g, "\\$&"); // $& means the whole matched string
}

export function satisfiesScalarConditions(
    where: FieldClauses,
    fieldValue: any,
    comparisonType: ScalarComparisonType
): boolean {
    // console.log("Scalar condition", { where, fieldValue });

    // Postgresql NULL comparison behaviour
    if ((fieldValue === undefined || fieldValue === null) && !("_is_null" in where)) {
        return false;
    }

    if ("_eq" in where) {
        const whereValue = where._eq;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        return satisfiesScalarEquality(whereValue, fieldValue, comparisonType);
    } else if ("_gt" in where) {
        const whereValue = where._gt;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        switch (comparisonType) {
            case ScalarComparisonType.Bigint:
            case ScalarComparisonType.Boolean:
            case ScalarComparisonType.Float:
            case ScalarComparisonType.Int:
            case ScalarComparisonType.Numeric:
                return whereValue > fieldValue;
            case ScalarComparisonType.String:
            case ScalarComparisonType.Uuid:
                return whereValue.localeCompare(fieldValue) === 1;
            case ScalarComparisonType.Jsonb:
                return JSON.stringify(whereValue).localeCompare(JSON.stringify(fieldValue)) === 1;
            case ScalarComparisonType.Timestamptz: {
                const d1 = whereValue instanceof Date ? whereValue : new Date(whereValue);
                const d2 = fieldValue instanceof Date ? fieldValue : new Date(fieldValue);
                return d1.getTime() > d2.getTime();
            }
        }
    } else if ("_gte" in where) {
        const whereValue = where._gte;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        switch (comparisonType) {
            case ScalarComparisonType.Bigint:
            case ScalarComparisonType.Boolean:
            case ScalarComparisonType.Float:
            case ScalarComparisonType.Int:
            case ScalarComparisonType.Numeric:
                return whereValue >= fieldValue;
            case ScalarComparisonType.String:
            case ScalarComparisonType.Uuid:
                return whereValue.localeCompare(fieldValue) >= 0;
            case ScalarComparisonType.Jsonb:
                return JSON.stringify(whereValue).localeCompare(JSON.stringify(fieldValue)) >= 0;
            case ScalarComparisonType.Timestamptz: {
                const d1 = whereValue instanceof Date ? whereValue : new Date(whereValue);
                const d2 = fieldValue instanceof Date ? fieldValue : new Date(fieldValue);
                return d1.getTime() >= d2.getTime();
            }
        }
    } else if ("_in" in where) {
        const whereValue = where._in;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        const whereValues = whereValue instanceof Array ? whereValue : Object.values(whereValue);
        return whereValues.some((x) => satisfiesScalarEquality(x, fieldValue, comparisonType));
    } else if ("_is_null" in where) {
        const whereValue = where._gte;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        return whereValue
            ? fieldValue !== undefined && fieldValue !== null
            : fieldValue === undefined || fieldValue === null;
    } else if ("_lt" in where) {
        const whereValue = where._lt;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        switch (comparisonType) {
            case ScalarComparisonType.Bigint:
            case ScalarComparisonType.Boolean:
            case ScalarComparisonType.Float:
            case ScalarComparisonType.Int:
            case ScalarComparisonType.Numeric:
                return whereValue < fieldValue;
            case ScalarComparisonType.String:
            case ScalarComparisonType.Uuid:
                return whereValue.localeCompare(fieldValue) === -1;
            case ScalarComparisonType.Jsonb:
                return JSON.stringify(whereValue).localeCompare(JSON.stringify(fieldValue)) === -1;
            case ScalarComparisonType.Timestamptz: {
                const d1 = whereValue instanceof Date ? whereValue : new Date(whereValue);
                const d2 = fieldValue instanceof Date ? fieldValue : new Date(fieldValue);
                return d1.getTime() < d2.getTime();
            }
        }
    } else if ("_lte" in where) {
        const whereValue = where._lte;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        switch (comparisonType) {
            case ScalarComparisonType.Bigint:
            case ScalarComparisonType.Boolean:
            case ScalarComparisonType.Float:
            case ScalarComparisonType.Int:
            case ScalarComparisonType.Numeric:
                return whereValue <= fieldValue;
            case ScalarComparisonType.String:
            case ScalarComparisonType.Uuid:
                return whereValue.localeCompare(fieldValue) <= 0;
            case ScalarComparisonType.Jsonb:
                return JSON.stringify(whereValue).localeCompare(JSON.stringify(fieldValue)) <= 0;
            case ScalarComparisonType.Timestamptz: {
                const d1 = whereValue instanceof Date ? whereValue : new Date(whereValue);
                const d2 = fieldValue instanceof Date ? fieldValue : new Date(fieldValue);
                return d1.getTime() <= d2.getTime();
            }
        }
    } else if ("_neq" in where) {
        const whereValue = where._neq;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        return !satisfiesScalarEquality(whereValue, fieldValue, comparisonType);
    } else if ("_nin" in where) {
        const whereValue = where._nin;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        const whereValues = whereValue instanceof Array ? whereValue : Object.values(whereValue);
        return !whereValues.some((x) => satisfiesScalarEquality(x, fieldValue, comparisonType));
    } else if ("_contained_in" in where) {
        const whereValue = where._contained_in;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        // Postgres <@ jsonb operator
        // https://www.postgresql.org/docs/14/functions-json.html
        // https://www.postgresql.org/docs/14/datatype-json.html#JSON-CONTAINMENT
        // See also: https://hasura.io/docs/latest/graphql/core/api-reference/graphql-api/query.html#jsonb-operators
        if (
            typeof whereValue === "bigint" ||
            typeof whereValue === "boolean" ||
            typeof whereValue === "number" ||
            typeof whereValue === "string" ||
            typeof whereValue === "undefined"
        ) {
            return fieldValue === whereValue;
        } else if (whereValue instanceof Array) {
            if (fieldValue instanceof Array) {
                for (const value of fieldValue) {
                    if (!whereValue.some((x) => _.isEqual(x, value))) {
                        return false;
                    }
                }
                return true;
            } else {
                return whereValue.some((x) => _.isEqual(x, fieldValue));
            }
        } else {
            for (const key in fieldValue) {
                if (!(key in whereValue)) {
                    return false;
                }
                if (!_.isEqual(fieldValue[key], whereValue[key]) && Object.keys(fieldValue[key]).length > 0) {
                    return false;
                }
            }
            return true;
        }
    } else if ("_contains" in where) {
        const whereValue = where._contains;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        // Postgres @> jsonb operator
        // https://www.postgresql.org/docs/14/functions-json.html
        // https://www.postgresql.org/docs/14/datatype-json.html#JSON-CONTAINMENT
        // See also: https://hasura.io/docs/latest/graphql/core/api-reference/graphql-api/query.html#jsonb-operators
        if (
            typeof fieldValue === "bigint" ||
            typeof fieldValue === "boolean" ||
            typeof fieldValue === "number" ||
            typeof fieldValue === "string" ||
            typeof fieldValue === "undefined"
        ) {
            return fieldValue === whereValue;
        } else if (fieldValue instanceof Array) {
            if (whereValue instanceof Array) {
                for (const value of whereValue) {
                    if (!fieldValue.some((x) => _.isEqual(x, value))) {
                        return false;
                    }
                }
                return true;
            } else {
                return fieldValue.some((x) => _.isEqual(x, whereValue));
            }
        } else {
            for (const key in whereValue) {
                if (!(key in fieldValue)) {
                    return false;
                }
                if (!_.isEqual(fieldValue[key], whereValue[key]) && Object.keys(whereValue[key]).length > 0) {
                    return false;
                }
            }
            return true;
        }
    } else if ("_has_key" in where) {
        const whereValue = where._has_key;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        return Object.keys(fieldValue).includes(whereValue);
    } else if ("_has_keys_all" in where) {
        const whereValue = where._has_keys_all;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        const objKeys = Object.keys(fieldValue);
        return whereValue.every((x) => objKeys.includes(x));
    } else if ("_has_keys_any" in where) {
        const whereValue = where._has_keys_any;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        const objKeys = Object.keys(fieldValue);
        return whereValue.some((x) => objKeys.includes(x));
    } else if ("_ilike" in where) {
        const whereValue = where._ilike;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return (
            fieldValue.match(
                new RegExp("^" + escapeRegExp(whereValue).replace(/_/g, ".").replace(/%/g, ".*") + "$", "gi")
            ) !== null
        );
    } else if ("_iregex" in where) {
        const whereValue = where._iregex;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return fieldValue.match(new RegExp(whereValue, "gi")) !== null;
    } else if ("_like" in where) {
        const whereValue = where._like;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return (
            fieldValue.match(
                new RegExp("^" + escapeRegExp(whereValue).replace(/_/g, ".").replace(/%/g, ".*") + "$", "g")
            ) !== null
        );
    } else if ("_nilike" in where) {
        const whereValue = where._ilike;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return (
            fieldValue.match(
                new RegExp("^" + escapeRegExp(whereValue).replace(/_/g, ".").replace(/%/g, ".*") + "$", "gi")
            ) === null
        );
    } else if ("_niregex" in where) {
        const whereValue = where._niregex;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return fieldValue.match(new RegExp(whereValue, "gi")) === null;
    } else if ("_nlike" in where) {
        const whereValue = where._like;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return (
            fieldValue.match(
                new RegExp("^" + escapeRegExp(whereValue).replace(/_/g, ".").replace(/%/g, ".*") + "$", "g")
            ) === null
        );
    } else if ("_nregex" in where) {
        const whereValue = where._nregex;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return fieldValue.match(new RegExp(whereValue, "g")) === null;
    } else if ("_nsimilar" in where) {
        const whereValue = where._nsimilar;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return (
            fieldValue.match(
                new RegExp("^" + escapeSQLRegExp(whereValue).replace(/_/g, ".").replace(/%/g, ".*") + "$", "g")
            ) === null
        );
    } else if ("_regex" in where) {
        const whereValue = where._regex;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return fieldValue.match(new RegExp(whereValue, "g")) !== null;
    } else if ("_similar" in where) {
        const whereValue = where._similar;

        if (whereValue === undefined || whereValue === null) {
            return false;
        }

        if (typeof fieldValue !== "string" || typeof whereValue !== "string") {
            throw new Error("Invalid types for string pattern match operator");
        }

        return (
            fieldValue.match(
                new RegExp("^" + escapeSQLRegExp(whereValue).replace(/_/g, ".").replace(/%/g, ".*") + "$", "g")
            ) !== null
        );
    } else {
        return false;
    }
}

export function satisfiesConditions(
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData,
    conditionsInputObjectKey: string,
    where: ConditionalClauses,
    entityKey: string,
    args: Variables,
    cache: Cache
): boolean | "partial" {
    // console.log("Conditions", { where, entityKey });
    const conditionsInputObject = schema.__schema.types?.find((x) => x.name === conditionsInputObjectKey);
    if (!conditionsInputObject || conditionsInputObject.kind !== "INPUT_OBJECT") {
        throw new GraphQLError("Conditions input object not found or incorrect type!");
    }

    for (const conditionKey in where) {
        if (conditionKey === "_and") {
            const conditions = where[conditionKey];
            if (conditions) {
                const conditionsArray = conditions instanceof Array ? conditions : Object.values(conditions);
                for (const innerCondition of conditionsArray) {
                    const result = satisfiesConditions(
                        schema,
                        augSchema,
                        conditionsInputObjectKey,
                        innerCondition,
                        entityKey,
                        args,
                        cache
                    );
                    if (result === "partial") {
                        return "partial";
                    }
                    if (!result) {
                        return false;
                    }
                }
            }
        } else if (conditionKey === "_or") {
            const conditions = where[conditionKey];
            if (conditions) {
                let ok = false;
                const conditionsArray = conditions instanceof Array ? conditions : Object.values(conditions);
                for (const innerCondition of conditionsArray) {
                    const result = satisfiesConditions(
                        schema,
                        augSchema,
                        conditionsInputObjectKey,
                        innerCondition,
                        entityKey,
                        args,
                        cache
                    );
                    if (result === "partial") {
                        return "partial";
                    }
                    if (result) {
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
                const result = satisfiesConditions(
                    schema,
                    augSchema,
                    conditionsInputObjectKey,
                    innerCondition,
                    entityKey,
                    args,
                    cache
                );
                if (result === "partial") {
                    return "partial";
                }
                if (result) {
                    return false;
                }
            }
        } else {
            const condition = (where as any)[conditionKey] as FieldClauses | ConditionalClauses | null;
            if (condition) {
                const conditionInfo = conditionsInputObject.inputFields.find((x) => x.name === conditionKey);
                if (!conditionInfo || conditionInfo.type.kind !== "INPUT_OBJECT") {
                    throw new GraphQLError("Condition info not found in schema or invalid!");
                }
                if (conditionInfo.type.name.endsWith("_comparison_exp")) {
                    // Scalar condition
                    const typedCondition: FieldClauses = condition as FieldClauses;
                    const fieldValue = cache.resolve(entityKey, conditionKey);
                    if (
                        !satisfiesScalarConditions(
                            typedCondition,
                            fieldValue,
                            conditionInfo.type.name
                                .substring(0, conditionInfo.type.name.length - "_comparison_exp".length)
                                .toLowerCase() as ScalarComparisonType
                        )
                    ) {
                        return false;
                    }
                } else {
                    // Non-scalar condition
                    const typedCondition: ConditionalClauses = condition as ConditionalClauses;
                    const innerEntityKeys = cache.resolve(entityKey, conditionKey) as null | string | string[];
                    if (innerEntityKeys !== null) {
                        if (innerEntityKeys instanceof Array) {
                            let ok = false;
                            for (const innerEntityKey of innerEntityKeys) {
                                const result = satisfiesConditions(
                                    schema,
                                    augSchema,
                                    conditionInfo.type.name,
                                    typedCondition,
                                    innerEntityKey,
                                    args,
                                    cache
                                );
                                if (result === "partial") {
                                    return "partial";
                                }
                                if (result) {
                                    ok = true;
                                    break;
                                }
                            }
                            if (!ok) {
                                return false;
                            }
                        } else {
                            const result = satisfiesConditions(
                                schema,
                                augSchema,
                                conditionInfo.type.name,
                                typedCondition,
                                innerEntityKeys,
                                args,
                                cache
                            );
                            if (result === "partial") {
                                return "partial";
                            }
                            if (!result) {
                                return false;
                            }
                        }
                    } else {
                        return "partial";
                    }
                }
            }
        }
    }

    return true;
}
