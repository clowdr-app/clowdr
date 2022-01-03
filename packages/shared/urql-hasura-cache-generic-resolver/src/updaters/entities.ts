import type { Data, QueryInput, UpdateResolver } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import type { DocumentNode, IntrospectionObjectType, SelectionNode } from "graphql";
import { GraphQLError, isObjectType } from "graphql";
import { getObjectTypeName, getTableFieldsSchema, getTableMutationSchema, isArrayOfObjectType } from "../schema";
import type { AugmentedIntrospectionData, InnerResolverConfig } from "../types";

function buildSelectionSet(
    datas: any[],
    tableSchema: IntrospectionObjectType,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): SelectionNode[] {
    const result: SelectionNode[] = [];

    for (const data of datas) {
        for (const key in data) {
            if (result.some((x) => x.kind === "Field" && x.name.value === key)) {
                continue;
            }

            const value = data[key];
            const fieldSchema = tableSchema.fields.find((x) => x.name === key);
            if (!fieldSchema) {
                continue;
            }

            if (isArrayOfObjectType(fieldSchema.type)) {
                const fieldObjectTypeName = getObjectTypeName(fieldSchema.type);
                if (!fieldObjectTypeName) {
                    continue;
                }
                const fieldTableFieldsSchema = getTableFieldsSchema(fieldObjectTypeName, schema, augSchema);
                if (!fieldTableFieldsSchema) {
                    continue;
                }
                result.push({
                    kind: "Field",
                    name: {
                        kind: "Name",
                        value: key,
                    },
                    selectionSet: {
                        kind: "SelectionSet",
                        selections: buildSelectionSet(value, fieldTableFieldsSchema.tableSchema, schema, augSchema),
                    },
                });
            } else if (isObjectType(fieldSchema.type)) {
                const fieldObjectTypeName = getObjectTypeName(fieldSchema.type);
                if (!fieldObjectTypeName) {
                    continue;
                }
                const fieldTableFieldsSchema = getTableFieldsSchema(fieldObjectTypeName, schema, augSchema);
                if (!fieldTableFieldsSchema) {
                    continue;
                }
                result.push({
                    kind: "Field",
                    name: {
                        kind: "Name",
                        value: key,
                    },
                    selectionSet: {
                        kind: "SelectionSet",
                        selections: buildSelectionSet([value], fieldTableFieldsSchema.tableSchema, schema, augSchema),
                    },
                });
            } else {
                result.push({
                    kind: "Field",
                    name: {
                        kind: "Name",
                        value: key,
                    },
                });
            }
        }
    }

    return result;
}

const entityUpdater: (schema: IntrospectionData, augSchema: AugmentedIntrospectionData) => UpdateResolver = (
    schema,
    augSchema
) =>
    function updater(parent, args, cache, info) {
        const rawOperation: string = info.fieldName.split("_")[0];
        const operation: "insert" | "update" | "delete" | undefined =
            rawOperation === "insert" || rawOperation === "update" || rawOperation === "delete"
                ? rawOperation
                : undefined;
        if (!operation) {
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

        console.info("Cache entity update", {
            schema,
            augSchema,
            parent,
            args,
            cache,
            info,
            tableSchema,
            tableFieldsSchema,
            newObjects,
            operation,
        });

        if (operation === "insert") {
            const selections: SelectionNode[] = buildSelectionSet(
                newObjects,
                tableFieldsSchema.tableSchema,
                schema,
                augSchema
            );
            const query: QueryInput = {
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
                                            value: entityName,
                                        },
                                        selectionSet: {
                                            kind: "SelectionSet",
                                            selections,
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            };
            cache.updateQuery(query, (existingQueryData): Data | null => {
                const d = existingQueryData?.[entityName];

                if (!d) {
                    return {
                        [entityName]: newObjects,
                    } as Data;
                }
                if (d instanceof Array) {
                    return {
                        [entityName]: [...d, ...newObjects],
                    } as Data;
                } else {
                    return {
                        [entityName]: [d, ...newObjects],
                    } as Data;
                }
            });

            // TODO: Insert links into existing fields...not this update query nonsense
            //       Need to evaluate "where" conditions before inserting - except Urql
            //       cache (in its infinite wisdom) will not execute "resolvers" during
            //       "updaters" so it's likely that our conditionals code will break...
        } else if (operation === "update") {
            const selections: SelectionNode[] = buildSelectionSet(
                _newObjects,
                tableFieldsSchema.tableSchema,
                schema,
                augSchema
            );

            const fragment: DocumentNode = {
                kind: "Document",
                definitions: [
                    {
                        kind: "FragmentDefinition",
                        name: {
                            kind: "Name",
                            value: "_",
                        },
                        typeCondition: {
                            kind: "NamedType",
                            name: {
                                kind: "Name",
                                value: entityName,
                            },
                        },
                        selectionSet: {
                            kind: "SelectionSet",
                            selections,
                        },
                    },
                ],
            };
            for (const data of _newObjects) {
                cache.writeFragment(fragment, data);
            }

            // TODO: Not sure if this writeFragment approach is sufficient?
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

            // TODO: Delete links from nested fields?
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
