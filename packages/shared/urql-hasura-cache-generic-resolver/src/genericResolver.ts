import type { Cache, Entity, Resolver, ResolverConfig, Variables } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import type {
    IntrospectionField,
    IntrospectionObjectType,
    IntrospectionOutputTypeRef,
    ObjectFieldNode,
    ValueNode,
} from "graphql";
import { GraphQLError } from "graphql";
import _ from "lodash";
import type {
    AugmentedIntrospectionData,
    AugmentedIntrospectionField,
    AugmentedIntrospectionObjectType,
    Bigint_Comparison_Exp,
    Boolean_Comparison_Exp,
    Float_Comparison_Exp,
    Int_Comparison_Exp,
    Jsonb_Comparison_Exp,
    Numeric_Comparison_Exp,
    String_Comparison_Exp,
    Timestamptz_Comparison_Exp,
    Uuid_Comparison_Exp,
} from "./types";

interface InnerResolverConfig {
    [fieldName: string]: Resolver;
}

enum AggregateOperation {
    avg = "avg",
    count = "count",
    max = "max",
    min = "min",
    stddev = "stddev",
    stddev_pop = "stddev_pop",
    stddev_samp = "stddev_samp",
    sum = "sum",
    var_pop = "var_pop",
    var_samp = "var_samp",
    variance = "variance",
}

const AggregateOperations: string[] = [];
for (const key in AggregateOperation) {
    AggregateOperations.push(key);
}

function getTableSchema(
    name: string,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): undefined | { tableSchema: IntrospectionField; augTableSchema: AugmentedIntrospectionObjectType } {
    const querySchema = schema.__schema.types?.find(
        (x) => x.kind === "OBJECT" && x.name === schema.__schema.queryType.name
    );
    if (querySchema?.kind === "OBJECT") {
        const tableSchema = querySchema.fields.find((x) => x.name === name);
        const augTableSchema = augSchema.__schema.types.find((x) => x.kind === "OBJECT" && x.name === name);
        return tableSchema && augTableSchema
            ? {
                  tableSchema,
                  augTableSchema,
              }
            : undefined;
    }
    return undefined;
}

function getTableFieldsSchema(
    name: string,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): undefined | { tableSchema: IntrospectionObjectType; augTableSchema: AugmentedIntrospectionObjectType } {
    const tableSchema = schema.__schema.types?.find((x) => x.kind === "OBJECT" && x.name === name);
    const augTableSchema = augSchema.__schema.types.find((x) => x.kind === "OBJECT" && x.name === name);
    return tableSchema && augTableSchema && tableSchema.kind === "OBJECT"
        ? {
              tableSchema,
              augTableSchema,
          }
        : undefined;
}

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

enum ScalarComparisonType {
    Bigint = "bigint",
    Boolean = "boolean",
    Float = "float",
    Int = "int",
    Jsonb = "jsonb",
    Numeric = "numeric",
    String = "string",
    Timestamptz = "timestamptz",
    Uuid = "uuid",
}

type ConditionalClauses<FieldKeys extends string = any> = DiadicBooleanClauses & {
    [fieldKey in Exclude<keyof DiadicBooleanClauses | keyof FieldClauses, FieldKeys>]:
        | FieldClauses
        | ConditionalClauses
        | null;
};

function satisfiesScalarEquality(where: any, fieldValue: any, comparisonType: ScalarComparisonType): boolean {
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
    }
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function escapeSQLRegExp(string: string): string {
    return string.replace(/[.\\]/g, "\\$&"); // $& means the whole matched string
}

function satisfiesScalarConditions(
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

        return whereValue.some((x) => satisfiesScalarEquality(x, fieldValue, comparisonType));
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

        return !whereValue.some((x) => satisfiesScalarEquality(x, fieldValue, comparisonType));
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

function satisfiesConditions(
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData,
    conditionsInputObjectKey: string,
    where: ConditionalClauses,
    entityKey: string,
    args: Variables,
    cache: Cache
): boolean {
    // console.log("Conditions", { where, entityKey });
    const conditionsInputObject = schema.__schema.types?.find((x) => x.name === conditionsInputObjectKey);
    if (!conditionsInputObject || conditionsInputObject.kind !== "INPUT_OBJECT") {
        throw new GraphQLError("Conditions input object not found or incorrect type!");
    }

    for (const conditionKey in where) {
        if (conditionKey === "_and") {
            const conditions = where[conditionKey];
            if (conditions) {
                for (const innerCondition of conditions) {
                    if (
                        !satisfiesConditions(
                            schema,
                            augSchema,
                            conditionsInputObjectKey,
                            innerCondition,
                            entityKey,
                            args,
                            cache
                        )
                    ) {
                        return false;
                    }
                }
            }
        } else if (conditionKey === "_or") {
            const conditions = where[conditionKey];
            if (conditions) {
                let ok = false;
                for (const innerCondition of conditions) {
                    if (
                        satisfiesConditions(
                            schema,
                            augSchema,
                            conditionsInputObjectKey,
                            innerCondition,
                            entityKey,
                            args,
                            cache
                        )
                    ) {
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
                if (
                    satisfiesConditions(
                        schema,
                        augSchema,
                        conditionsInputObjectKey,
                        innerCondition,
                        entityKey,
                        args,
                        cache
                    )
                ) {
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
                    if (innerEntityKeys) {
                        if (innerEntityKeys instanceof Array) {
                            let ok = false;
                            for (const innerEntityKey of innerEntityKeys) {
                                if (
                                    satisfiesConditions(
                                        schema,
                                        augSchema,
                                        conditionInfo.type.name,
                                        typedCondition,
                                        innerEntityKey,
                                        args,
                                        cache
                                    )
                                ) {
                                    ok = true;
                                    break;
                                }
                            }
                            if (!ok) {
                                return false;
                            }
                        } else {
                            if (
                                !satisfiesConditions(
                                    schema,
                                    augSchema,
                                    conditionInfo.type.name,
                                    typedCondition,
                                    innerEntityKeys,
                                    args,
                                    cache
                                )
                            ) {
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

const entityResolver: (schema: IntrospectionData, augSchema: AugmentedIntrospectionData) => Resolver = (
    schema,
    augSchema
) =>
    function resolver(parent, args, cache, info) {
        const tableSchema = getTableSchema(info.fieldName, schema, augSchema);
        if (!tableSchema) {
            info.error = new GraphQLError(`Table schema not found! ${info.fieldName}`);
            return undefined;
        }

        const allFields = cache.inspectFields(info.parentKey);
        const fieldInfos = allFields.filter((fieldInfo) => fieldInfo.fieldName === info.fieldName);
        if (fieldInfos.length === 0) {
            return undefined;
        }

        const result = new Set<string>();
        if (args.where) {
            const whereSchema = tableSchema.tableSchema.args.find((x) => x.name === "where");
            if (!whereSchema || whereSchema.type.kind !== "INPUT_OBJECT") {
                info.error = new GraphQLError(`Table 'where' schema not found! ${info.fieldName}`);
                return undefined;
            }
            const boolExpSchemaName = whereSchema.type.name;

            // console.log(`CONDITIONS:\n${JSON.stringify(args.where, null, 2)}`);

            const where = args.where;
            const keysToTest = new Set<string>();
            for (const fieldInfo of fieldInfos) {
                const keys = cache.resolve(parent as Entity, fieldInfo.fieldKey) as string | string[] | null;
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
                if (satisfiesConditions(schema, augSchema, boolExpSchemaName, where, key, args, cache)) {
                    result.add(key);
                }
            }
        } else {
            for (const fieldInfo of fieldInfos) {
                const keys = cache.resolve(parent as Entity, fieldInfo.fieldKey) as string | string[] | null;
                if (keys) {
                    if (keys instanceof Array) {
                        keys.forEach((key) => result.add(key));
                    } else {
                        result.add(keys);
                    }
                }
            }
        }

        let resultArr = [...result];

        // TODO: args.order_by
        // TODO: args.distinct_on

        if (args.offset) {
            if (typeof args.offset === "number") {
                resultArr = resultArr.slice(args.offset);
            } else {
                info.error = new GraphQLError("Invalid offset value");
                return [];
            }
        }

        if (args.limit) {
            if (typeof args.limit === "number") {
                resultArr = resultArr.slice(0, args.limit);
            } else {
                info.error = new GraphQLError("Invalid limit value");
                return [];
            }
        }

        // console.log("--------------- END CACHE LOOKUP (2) ---------------", result);

        return resultArr;
    };

function queryRootResolvers(
    customResolvers: InnerResolverConfig,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): InnerResolverConfig {
    return new Proxy(customResolvers, {
        has: (target: InnerResolverConfig, prop: string) => {
            if (prop in target) {
                return true;
            }

            const tableSchema = getTableSchema(prop, schema, augSchema);
            return Boolean(tableSchema);
        },
        get: (target: InnerResolverConfig, prop: string) => {
            if (prop in target) {
                return target[prop];
            }

            const tableSchema = getTableSchema(prop, schema, augSchema);
            if (tableSchema) {
                return entityResolver(schema, augSchema);
            }
            return undefined;
        },
    });
}

function isObjectType(type: IntrospectionOutputTypeRef): boolean {
    if (type.kind === "OBJECT") {
        return true;
    }
    if (type.kind === "NON_NULL") {
        return isObjectType(type.ofType);
    }
    return false;
}

function isArrayOfObjectType(type: IntrospectionOutputTypeRef): boolean {
    if (type.kind === "LIST") {
        return isObjectType(type.ofType);
    }
    if (type.kind === "NON_NULL") {
        return isArrayOfObjectType(type.ofType);
    }
    return false;
}

function getObjectTypeName(type: IntrospectionOutputTypeRef): string | undefined {
    if (type.kind === "LIST") {
        return getObjectTypeName(type.ofType);
    }
    if (type.kind === "NON_NULL") {
        return getObjectTypeName(type.ofType);
    }
    if (type.kind === "OBJECT") {
        return type.name;
    }
    return undefined;
}

const objectFieldResolver: (schema: IntrospectionData, augSchema: AugmentedIntrospectionData) => Resolver = (
    schema,
    augSchema
) =>
    function resolver(_parent, args, cache, info) {
        const existingFields = cache.inspectFields(info.parentKey);
        const matchingFields = existingFields.filter((x) => x.fieldName === info.fieldName);
        const existingFieldValues = matchingFields.flatMap((field) => cache.resolve(info.parentKey, field.fieldKey));
        // N.B. Object fields do not have 'where' arguments
        if (existingFieldValues.length > 0) {
            return existingFieldValues[0];
        }

        const parentTableSchema = getTableFieldsSchema(info.parentTypeName, schema, augSchema);
        if (!parentTableSchema) {
            return undefined;
        }
        const fieldSchema = parentTableSchema.tableSchema.fields.find((x) => x.name === info.fieldName);
        const fieldAugSchema = parentTableSchema.augTableSchema.fields.find((x) => x.name === info.fieldName);
        if (!fieldSchema || !fieldAugSchema) {
            return undefined;
        }
        const fieldEntityTypeName = getObjectTypeName(fieldSchema.type);
        if (!fieldEntityTypeName) {
            return undefined;
        }

        const result = resolveRelation(fieldAugSchema, cache, info.parentKey, fieldEntityTypeName, args.where);

        // console.info(`Object field resolver for ${info.parentTypeName}.${info.fieldName}`, {
        //     parent,
        //     args,
        //     info,
        //     parentTableSchema,
        //     fieldSchema,
        //     fieldAugSchema,
        //     fieldEntityTypeName,
        //     existingFieldValues,
        //     result,
        // });

        if (result) {
            const possibleResults = result[fieldEntityTypeName];
            if (possibleResults && possibleResults instanceof Array) {
                if (possibleResults.length) {
                    return possibleResults[0];
                }
            } else if (typeof possibleResults === "string") {
                return possibleResults;
            }
        }
        return matchingFields.length > 0 ? null : undefined;
    };

const arrayFieldResolver: (schema: IntrospectionData, augSchema: AugmentedIntrospectionData) => Resolver = (
    schema,
    augSchema
) =>
    function resolver(parent, args, cache, info) {
        const parentTableSchema = getTableFieldsSchema(info.parentTypeName, schema, augSchema);
        if (!parentTableSchema) {
            return undefined;
        }
        const fieldSchema = parentTableSchema.tableSchema.fields.find((x) => x.name === info.fieldName);
        if (!fieldSchema) {
            return undefined;
        }
        const whereSchema = fieldSchema.args.find((x) => x.name === "where");
        const boolExpSchemaName = whereSchema?.type.kind === "INPUT_OBJECT" ? whereSchema.type.name : undefined;

        const existingFields = cache.inspectFields(parent as Entity);
        const matchingFields = existingFields.filter((x) => x.fieldName === info.fieldName);
        const allExistingFieldValues = matchingFields.flatMap((field) =>
            cache.resolve(parent as Entity, field.fieldKey)
        );
        const existingFieldValues =
            boolExpSchemaName && args.where
                ? allExistingFieldValues.filter((x) =>
                      typeof x === "string"
                          ? satisfiesConditions(schema, augSchema, boolExpSchemaName, args.where as any, x, args, cache)
                          : satisfiesConditions(
                                schema,
                                augSchema,
                                boolExpSchemaName,
                                args.where as any,
                                cache.keyOfEntity(x as Entity) as string,
                                args,
                                cache
                            )
                  )
                : allExistingFieldValues;

        const fieldAugSchema = parentTableSchema.augTableSchema.fields.find((x) => x.name === info.fieldName);
        if (!fieldAugSchema) {
            return undefined;
        }
        const fieldEntityTypeName = getObjectTypeName(fieldSchema.type);
        if (!fieldEntityTypeName) {
            return undefined;
        }

        const results = resolveRelation(fieldAugSchema, cache, info.parentKey, fieldEntityTypeName, args.where);

        // console.info(`Array field resolver for ${info.parentTypeName}.${info.fieldName}`, {
        //     parent,
        //     args,
        //     info,
        //     parentTableSchema,
        //     fieldSchema,
        //     fieldAugSchema,
        //     fieldEntityTypeName,
        //     matchingFields,
        //     allExistingFieldValues,
        //     existingFieldValues,
        //     results,
        // });
        const finalResults: Set<string | null> = new Set();
        let resolvedAny = false;
        if (matchingFields.length) {
            const keys = existingFieldValues.map((x) => cache.keyOfEntity(x as Entity));
            keys.map((key) => finalResults.add(key));
            resolvedAny = true;
        }
        if (results && results[fieldEntityTypeName] && results[fieldEntityTypeName] instanceof Array) {
            const keys = results[fieldEntityTypeName] as string[];
            keys.map((key) => finalResults.add(key));
            resolvedAny = true;
        }

        // console.log(
        //     `Array resolution for ${info.parentTypeName}.${info.fieldName}: ${resolvedAny ? "" : "No "}final results`,
        //     finalResults
        // );

        if (!resolvedAny) {
            return undefined;
        }

        let arrResults = [...finalResults];

        // TODO: order_by
        // TODO: distinct_on

        if (args.offset) {
            if (typeof args.offset === "number") {
                arrResults = arrResults.slice(args.offset);
            } else {
                info.error = new GraphQLError("Invalid offset value");
                return [];
            }
        }

        if (args.limit) {
            if (typeof args.limit === "number") {
                arrResults = arrResults.slice(0, args.limit);
            } else {
                info.error = new GraphQLError("Invalid limit value");
                return [];
            }
        }

        // console.log(
        //     `Array resolution for ${info.parentTypeName}.${info.fieldName}: Array results after ordering/distinction/offset/limit`,
        //     arrResults
        // );

        return arrResults;
    };

function appendTransformedConditions(conditions: ObjectFieldNode[], where: Record<string, any>): void {
    for (const key in where) {
        if (typeof where[key] === "object") {
            const innerConditions: ObjectFieldNode[] = [];
            appendTransformedConditions(innerConditions, where[key]);
            conditions.push({
                kind: "ObjectField",
                name: {
                    kind: "Name",
                    value: key,
                },
                value: {
                    kind: "ObjectValue",
                    fields: innerConditions,
                },
            });
        } else if (where[key] instanceof Array) {
            const conditionsList: ValueNode[] = [];
            for (const x of where[key]) {
                if (typeof x === "object") {
                    const innerConditions: ObjectFieldNode[] = [];
                    appendTransformedConditions(innerConditions, where[key]);
                    conditionsList.push({
                        kind: "ObjectValue",
                        fields: innerConditions,
                    });
                } else if (typeof x === "bigint" || typeof x === "number") {
                    conditionsList.push({
                        kind: "IntValue",
                        value: x.toString(),
                    });
                } else if (typeof x === "boolean") {
                    conditionsList.push({
                        kind: "BooleanValue",
                        value: x,
                    });
                } else if (typeof x === "string") {
                    conditionsList.push({
                        kind: "StringValue",
                        value: x,
                    });
                } else if (typeof x === "undefined") {
                    conditionsList.push({
                        kind: "NullValue",
                    });
                }
            }
            conditions.push({
                kind: "ObjectField",
                name: {
                    kind: "Name",
                    value: key,
                },
                value: {
                    kind: "ListValue",
                    values: conditionsList,
                },
            });
        } else {
            if (typeof where[key] === "bigint" || typeof where[key] === "number") {
                conditions.push({
                    kind: "ObjectField",
                    name: {
                        kind: "Name",
                        value: key,
                    },
                    value: {
                        kind: "IntValue",
                        value: where[key].toString(),
                    },
                });
            } else if (typeof where[key] === "boolean") {
                conditions.push({
                    kind: "ObjectField",
                    name: {
                        kind: "Name",
                        value: key,
                    },
                    value: {
                        kind: "BooleanValue",
                        value: where[key],
                    },
                });
            } else if (typeof where[key] === "string") {
                conditions.push({
                    kind: "ObjectField",
                    name: {
                        kind: "Name",
                        value: key,
                    },
                    value: {
                        kind: "StringValue",
                        value: where[key],
                    },
                });
            } else if (typeof where[key] === "undefined") {
                conditions.push({
                    kind: "ObjectField",
                    name: {
                        kind: "Name",
                        value: key,
                    },
                    value: {
                        kind: "NullValue",
                    },
                });
            }
        }
    }
}

function resolveRelation(
    fieldAugSchema: AugmentedIntrospectionField,
    cache: Cache,
    parentKey: string,
    fieldEntityTypeName: string,
    where: any
) {
    const lookupFieldConditions: ObjectFieldNode[] = [];
    const lookupConditions: ValueNode = {
        kind: "ObjectValue",
        fields: lookupFieldConditions,
    };
    for (const parentFieldKey in fieldAugSchema.type.columns) {
        const childFieldKey = fieldAugSchema.type.columns[parentFieldKey];
        lookupFieldConditions.push({
            kind: "ObjectField",
            name: {
                kind: "Name",
                value: childFieldKey,
            },
            value: {
                kind: "ObjectValue",
                fields: [
                    {
                        kind: "ObjectField",
                        name: {
                            kind: "Name",
                            value: "_eq",
                        },
                        value: {
                            kind: "StringValue",
                            value: cache.resolve(parentKey, parentFieldKey) as string,
                        },
                    },
                ],
            },
        });
    }
    appendTransformedConditions(lookupFieldConditions, where);

    // console.log(`Requesting resolution of ${fieldEntityTypeName}`, lookupConditions);
    const result = cache.readQuery({
        query: {
            kind: "Document",
            definitions: [
                {
                    kind: "OperationDefinition",
                    operation: "query",
                    selectionSet: {
                        kind: "SelectionSet",
                        selections: [
                            {
                                kind: "Field",
                                name: {
                                    kind: "Name",
                                    value: fieldEntityTypeName,
                                },
                                arguments: [
                                    {
                                        kind: "Argument",
                                        name: {
                                            kind: "Name",
                                            value: "where",
                                        },
                                        value: lookupConditions,
                                    },
                                ],
                            },
                        ],
                    },
                    directives: [],
                },
            ],
        },
    });
    return result;
}

function entityFieldResolvers(
    customResolvers: InnerResolverConfig,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData,
    entityName: string
): InnerResolverConfig {
    const tableSchema = getTableFieldsSchema(entityName, schema, augSchema);

    if (tableSchema) {
        return new Proxy(customResolvers, {
            has: (target: InnerResolverConfig, prop: string) => {
                if (prop in target) {
                    return true;
                }

                const fieldSchema = tableSchema.tableSchema.fields.find((x) => x.name === prop);
                const fieldAugSchema = tableSchema.augTableSchema.fields.find((x) => x.name === prop);
                if (fieldSchema && fieldAugSchema) {
                    if (getObjectTypeName(fieldSchema.type)) {
                        return true;
                    }
                }
                return false;
            },
            get: (target: InnerResolverConfig, prop: string) => {
                if (prop in target) {
                    return target[prop];
                }

                const fieldSchema = tableSchema.tableSchema.fields.find((x) => x.name === prop);
                if (fieldSchema) {
                    const fieldEntityTypeName = getObjectTypeName(fieldSchema.type);
                    if (fieldEntityTypeName) {
                        if (isObjectType(fieldSchema.type)) {
                            // console.info(
                            //     `Lookup of object field detected: ${entityName}.${prop} -> ${fieldEntityTypeName}`
                            // );
                            return objectFieldResolver(schema, augSchema);
                        } else if (isArrayOfObjectType(fieldSchema.type)) {
                            // console.info(
                            //     `Lookup of array of object field detected: ${entityName}.${prop} -> ${fieldEntityTypeName}`
                            // );
                            const result = arrayFieldResolver(schema, augSchema);
                            return result;
                        }
                    }
                }
                return undefined;
            },
        });
    }
    return customResolvers;
}

// function aggregateResolvers(
//     customResolvers: InnerResolverConfig,
//     _schema: IntrospectionData,
//     _augSchema: AugmentedIntrospectionData
// ): InnerResolverConfig {
//     // TODO
//     return customResolvers;
// }

// function aggregateFieldResolvers(
//     customResolvers: InnerResolverConfig,
//     _schema: IntrospectionData,
//     _augSchema: AugmentedIntrospectionData
// ): InnerResolverConfig {
//     // TODO
//     return customResolvers;
// }

// function aggregateOperationResolvers(
//     customResolvers: InnerResolverConfig,
//     _schema: IntrospectionData,
//     _augSchema: AugmentedIntrospectionData,
//     _operation: AggregateOperation
// ): InnerResolverConfig {
//     // TODO
//     return customResolvers;
// }

export function genericResolvers(
    customResolvers: ResolverConfig,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): ResolverConfig {
    return new Proxy(customResolvers, {
        has: (target: ResolverConfig, prop: string) => {
            if (prop in target) {
                return true;
            }

            if (prop === schema.__schema.queryType.name) {
                return true;
            }
            if (prop.endsWith("_aggregate")) {
                // TODO
                return false;
            }
            if (prop.endsWith("_aggregate_fields")) {
                // TODO
                return false;
            }
            if (AggregateOperations.some((op) => prop.endsWith(`_${op}_fields`))) {
                // TODO
                return false;
            }

            const tableSchema = getTableFieldsSchema(prop, schema, augSchema);
            return Boolean(tableSchema);
        },
        get: (target: ResolverConfig, prop: string) => {
            if (prop in target) {
                return target[prop];
            }

            if (prop === schema.__schema.queryType.name) {
                return queryRootResolvers(target[prop] ?? {}, schema, augSchema);
            }
            if (prop.endsWith("_aggregate")) {
                return undefined;
                // TODO: return aggregateResolvers(target[prop] ?? {}, schema, augSchema);
            }
            if (prop.endsWith("_aggregate_fields")) {
                return undefined;
                // TODO: return aggregateFieldResolvers(target[prop] ?? {}, schema, augSchema);
            }
            const op = AggregateOperations.find((op) => prop.endsWith(`_${op}_fields`));
            if (op) {
                return undefined;
                // TODO: return aggregateOperationResolvers(target[prop] ?? {}, schema, augSchema, op as AggregateOperation);
            }

            const tableSchema = getTableFieldsSchema(prop, schema, augSchema);
            if (tableSchema) {
                return entityFieldResolvers(target[prop] ?? {}, schema, augSchema, prop);
            }

            return undefined;
        },
    });
}
