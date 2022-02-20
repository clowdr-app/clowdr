import type { Data, UpdateResolver } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import { GraphQLError } from "graphql";
import { getObjectTypeName, getTableFieldsSchema, getTableMutationSchema } from "../schema";
import type { AugmentedIntrospectionData, InnerResolverConfig } from "../types";

/**
 * If you're going to edit this code, you'll probably want to know about the
 * impact the Urql Garbage Collector has on data written to the cache and thus
 * why this code chooses to update existing queries rather than insert fresh
 * ('unconnected') queries.
 *
 * https://github.com/FormidableLabs/urql/discussions/2219
 */

const entityUpdater: (schema: IntrospectionData, augSchema: AugmentedIntrospectionData) => UpdateResolver = (
    schema,
    augSchema
) =>
    function updater(parent, _args, cache, info) {
        const rawOperation: string = info.fieldName.split("_")[0];
        const operation: "insert" | "update" | "delete" | undefined =
            rawOperation === "insert" || rawOperation === "update" || rawOperation === "delete"
                ? rawOperation
                : undefined;
        if (!operation || operation === "update") {
            return;
        }

        const tableSchema = getTableMutationSchema(info.fieldName, schema, augSchema);
        if (!tableSchema) {
            info.error = new GraphQLError("Table mutation schema not found");
            return;
        }
        let _entityName = tableSchema && getObjectTypeName(tableSchema.tableSchema.type);
        const rawNewObjects = parent[info.fieldName];
        let _newObjects: Data[] | null = null;
        if (_entityName?.endsWith("_mutation_response")) {
            const responseSchema = schema.__schema.types?.find((x) => x.kind === "OBJECT" && x.name === _entityName);
            const returningFieldSchema =
                responseSchema?.kind === "OBJECT"
                    ? responseSchema.fields.find((x) => x.name === "returning")
                    : undefined;
            _entityName = returningFieldSchema && getObjectTypeName(returningFieldSchema?.type);
            _newObjects = ((rawNewObjects as Data | null)?.returning as Data[] | undefined) ?? null;
        } else if (rawNewObjects && !(rawNewObjects instanceof Array)) {
            _newObjects = [rawNewObjects as Data];
        }
        if (!_entityName) {
            info.error = new GraphQLError("Could not identify entity name");
            return;
        }
        const entityName: string = _entityName;

        if (!_newObjects) {
            return;
        }
        const newObjects = _newObjects;

        const tableFieldsSchema = getTableFieldsSchema(entityName, schema, augSchema);
        if (!tableFieldsSchema) {
            info.error = new GraphQLError("Table fields schema not found");
            return;
        }

        // console.info("Cache entity update", {
        //     schema,
        //     augSchema,
        //     parent,
        //     args,
        //     cache,
        //     info,
        //     tableSchema,
        //     tableFieldsSchema,
        //     newObjects,
        //     operation,
        // });

        if (operation === "insert") {
            const keysToInsert = newObjects.map((x) => cache.keyOfEntity(x));
            const allFields = cache.inspectFields(schema.__schema.queryType.name);
            const fieldInfos = allFields.filter((fieldInfo) => fieldInfo.fieldName === entityName);
            // We're going to cheat. We know that the data we just inserted probably doesn't meet
            // the conditions of most (or any) of the queries we've just extracted. But it
            // shouldn't matter: the generic resolvers are going to re-filter the data anyway thus
            // removing any erroneously inserted links. It's self-healing!
            fieldInfos.forEach((fieldInfo) => {
                const keys = cache.resolve(schema.__schema.queryType.name, fieldInfo.fieldKey) as string[] | null;
                if (keys) {
                    const newKeys = [...keys, ...keysToInsert];
                    cache.link(schema.__schema.queryType.name, fieldInfo.fieldName, fieldInfo.arguments, newKeys);
                } else {
                    cache.link(schema.__schema.queryType.name, fieldInfo.fieldName, fieldInfo.arguments, keysToInsert);
                }
            });
        } else if (operation === "delete") {
            const keysToDelete = newObjects.map((x) => cache.keyOfEntity(x));
            const allFields = cache.inspectFields(schema.__schema.queryType.name);
            const fieldInfos = allFields.filter((fieldInfo) => fieldInfo.fieldName === entityName);
            fieldInfos.forEach((fieldInfo) => {
                const keys = cache.resolve(schema.__schema.queryType.name, fieldInfo.fieldKey) as string[] | null;
                if (keys) {
                    const newKeys = keys.filter((x) => !keysToDelete.includes(x));
                    cache.link(schema.__schema.queryType.name, fieldInfo.fieldName, fieldInfo.arguments, newKeys);
                }
            });
        }
    };

export function queryRootUpdaters(
    customResolvers: InnerResolverConfig,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): InnerResolverConfig {
    return new Proxy(customResolvers, {
        has: (target: InnerResolverConfig, prop: string) => {
            if (prop in target) {
                return true;
            }

            const tableSchema = getTableMutationSchema(prop, schema, augSchema);
            return Boolean(tableSchema);
        },
        get: (target: InnerResolverConfig, prop: string) => {
            if (prop in target) {
                return target[prop];
            }

            const tableSchema = getTableMutationSchema(prop, schema, augSchema);
            if (tableSchema) {
                return entityUpdater(schema, augSchema);
            }
            return undefined;
        },
    });
}
