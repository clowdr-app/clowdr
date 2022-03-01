import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import type { IntrospectionField, IntrospectionObjectType, IntrospectionOutputTypeRef } from "graphql";
import type { AugmentedIntrospectionData, AugmentedIntrospectionObjectType } from "./types";

export function getTableSchema(
    name: string,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): undefined | { tableSchema: IntrospectionField; augTableSchema: AugmentedIntrospectionObjectType } {
    const querySchema = schema.__schema.types?.find(
        (x) => x.kind === "OBJECT" && x.name === schema.__schema.queryType.name
    );
    if (querySchema?.kind === "OBJECT") {
        const tableSchema = querySchema.fields.find((x) => x.name === name);
        const baseName = name.endsWith("_by_pk")
            ? name.substring(0, name.length - "_by_pk".length)
            : name.endsWith("_aggregate")
            ? name.substring(0, name.length - "_aggregate".length)
            : name;
        const augTableSchema = augSchema.__schema.types.find((x) => x.kind === "OBJECT" && x.name === baseName);
        return tableSchema && augTableSchema
            ? {
                  tableSchema,
                  augTableSchema,
              }
            : undefined;
    }
    return undefined;
}

export function getTableMutationSchema(
    name: string,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): undefined | { tableSchema: IntrospectionField; augTableSchema: AugmentedIntrospectionObjectType } {
    const mutationSchema = schema.__schema.types?.find(
        (x) => x.kind === "OBJECT" && x.name === schema.__schema.mutationType?.name
    );
    if (mutationSchema?.kind === "OBJECT") {
        const tableSchema = mutationSchema.fields.find((x) => x.name === name);
        let entityName = tableSchema && getObjectTypeName(tableSchema.type);
        if (entityName?.endsWith("_mutation_response")) {
            const responseSchema = schema.__schema.types?.find((x) => x.kind === "OBJECT" && x.name === entityName);
            const returningFieldSchema =
                responseSchema?.kind === "OBJECT"
                    ? responseSchema.fields.find((x) => x.name === "returning")
                    : undefined;
            entityName = returningFieldSchema && getObjectTypeName(returningFieldSchema?.type);
        }
        const augTableSchema =
            entityName && augSchema.__schema.types.find((x) => x.kind === "OBJECT" && x.name === entityName);
        return tableSchema && augTableSchema
            ? {
                  tableSchema,
                  augTableSchema,
              }
            : undefined;
    }
    return undefined;
}

export function getTableFieldsSchema(
    name: string,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): undefined | { tableSchema: IntrospectionObjectType; augTableSchema: AugmentedIntrospectionObjectType } {
    const tableSchema = schema.__schema.types?.find((x) => x.kind === "OBJECT" && x.name === name);
    const baseName = name.endsWith("_by_pk")
        ? name.substring(0, name.length - "_by_pk".length)
        : name.endsWith("_aggregate")
        ? name.substring(0, name.length - "_aggregate".length)
        : name;
    const augTableSchema = augSchema.__schema.types.find((x) => x.kind === "OBJECT" && x.name === baseName);
    return tableSchema && augTableSchema && tableSchema.kind === "OBJECT"
        ? {
              tableSchema,
              augTableSchema,
          }
        : undefined;
}

export function isObjectType(type: IntrospectionOutputTypeRef): boolean {
    if (type.kind === "OBJECT") {
        return true;
    }
    if (type.kind === "NON_NULL") {
        return isObjectType(type.ofType);
    }
    return false;
}

export function isArrayOfObjectType(type: IntrospectionOutputTypeRef): boolean {
    if (type.kind === "LIST") {
        return isObjectType(type.ofType);
    }
    if (type.kind === "NON_NULL") {
        return isArrayOfObjectType(type.ofType);
    }
    return false;
}

export function getObjectTypeName(type: IntrospectionOutputTypeRef): string | undefined {
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
