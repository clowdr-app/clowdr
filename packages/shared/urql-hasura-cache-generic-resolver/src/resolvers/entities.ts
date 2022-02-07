import type { Entity, Resolver } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import { GraphQLError } from "graphql";
import _ from "lodash";
import { satisfiesConditions } from "../conditionals";
import { getTableSchema } from "../schema";
import type { AugmentedIntrospectionData, InnerResolverConfig } from "../types";

const entityResolver: (schema: IntrospectionData, augSchema: AugmentedIntrospectionData) => Resolver = (
    schema,
    augSchema
) =>
    function resolver(parent, args, cache, info) {
        const isObjectByPkQuery = info.fieldName.endsWith("_by_pk");

        const tableSchema = getTableSchema(info.fieldName, schema, augSchema);
        if (!tableSchema) {
            info.error = new GraphQLError("Table schema not found");
            return undefined;
        }

        const allFields = cache.inspectFields(info.parentKey);
        const fieldInfos = allFields.filter(
            (fieldInfo) =>
                fieldInfo.fieldName === tableSchema.augTableSchema.name ||
                fieldInfo.fieldName === tableSchema.augTableSchema.name + "_by_pk"
        );
        // console.info(`Field infos for ${info.parentKey}.${info.fieldName}`, fieldInfos);
        if (fieldInfos.length === 0) {
            info.partial = true;
            return undefined;
        }

        const result = new Set<string>();
        let exactQueryExistsInCache = false;
        if (isObjectByPkQuery) {
            for (const fieldInfo of fieldInfos) {
                const key = cache.resolve(info.parentKey, fieldInfo.fieldKey) as string | null;
                if (key && _.isEqual(fieldInfo.arguments, args)) {
                    exactQueryExistsInCache = true;
                    result.add(key);
                } else if (key) {
                    let ok = true;
                    for (const argFieldName in args) {
                        const val = cache.resolve(key, argFieldName);
                        if (val !== args[argFieldName]) {
                            ok = false;
                            break;
                        }
                    }
                    if (ok) {
                        exactQueryExistsInCache = true;
                        result.add(key);
                    }
                }
            }
        } else if (args.where) {
            const whereSchema = tableSchema.tableSchema.args.find((x) => x.name === "where");
            if (!whereSchema || whereSchema.type.kind !== "INPUT_OBJECT") {
                info.error = new GraphQLError("Table 'where' schema not found");
                return undefined;
            }
            const boolExpSchemaName = whereSchema.type.name;

            // console.log(`CONDITIONS:\n${JSON.stringify(args.where, null, 2)}`);

            const where = args.where;
            const keysToTest = new Set<string>();
            for (const fieldInfo of fieldInfos) {
                if (_.isEqual(fieldInfo.arguments, args)) {
                    const key = cache.resolve(parent as Entity, fieldInfo.fieldKey) as string | string[] | null;
                    if (key) {
                        exactQueryExistsInCache = true;
                        if (key instanceof Array) {
                            key.forEach((x) => result.add(x));
                        } else {
                            result.add(key);
                        }
                    }
                } else {
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
            }

            for (const key of keysToTest) {
                const conditionResult = satisfiesConditions(
                    schema,
                    augSchema,
                    boolExpSchemaName,
                    where,
                    key,
                    args,
                    cache
                );
                if (conditionResult === "partial") {
                    info.partial = true;
                    continue;
                }
                if (conditionResult) {
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

        if (result.size === 0) {
            // There has to be a better test than this for detecting the difference between:
            // "Get me this registrant with this exact Id...oh, it's not in the cache"
            // versus
            // "Find me all events of this conference in this time range...oh the cache says there are none"
            // versus
            // "Find me all events with ids in this array...oh, one of them isn't in the cache yet"

            // This hack essentially tries to determine whether the cache already contains an answer to the
            // exact query that was asked here. If so, we don't mark this result as partial (in order to avoid
            // an infinite loop).
            info.partial = !exactQueryExistsInCache;
        }

        let resultArr = [...result];

        if (!isObjectByPkQuery) {
            // TODO: args.order_by
            // TODO: args.distinct_on

            if (args.offset) {
                if (typeof args.offset === "number") {
                    resultArr = resultArr.slice(args.offset);
                } else {
                    info.error = new GraphQLError("Invalid offset value");
                    return info.fieldName.endsWith("_by_pk") ? null : [];
                }
            }

            if (args.limit) {
                if (typeof args.limit === "number") {
                    resultArr = resultArr.slice(0, args.limit);
                } else {
                    info.error = new GraphQLError("Invalid limit value");
                    return info.fieldName.endsWith("_by_pk") ? null : [];
                }
            }
        }

        // console.log("--------------- END CACHE LOOKUP (2) ---------------", result);

        return isObjectByPkQuery ? resultArr[0] ?? null : resultArr;
    };

export function queryRootResolvers(
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
