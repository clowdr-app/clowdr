import type { Cache } from "@urql/exchange-graphcache";
import type { ObjectFieldNode, ValueNode } from "graphql";
import type { AugmentedIntrospectionRelationshipKeyMapRef } from "../types";

export function appendTransformedConditions(conditions: ObjectFieldNode[], where: Record<string, any>): void {
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

export function resolveRelation(
    fieldAugSchema: AugmentedIntrospectionRelationshipKeyMapRef,
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
    for (const parentFieldKey in fieldAugSchema.columns) {
        const childFieldKey = fieldAugSchema.columns[parentFieldKey];
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
