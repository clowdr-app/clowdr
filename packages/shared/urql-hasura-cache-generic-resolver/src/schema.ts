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

export function getTableFieldsSchema(
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
