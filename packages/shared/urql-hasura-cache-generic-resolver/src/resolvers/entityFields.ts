import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import { isObjectType } from "graphql";
import { getObjectTypeName, getTableFieldsSchema, isArrayOfObjectType } from "../schema";
import type { AugmentedIntrospectionData, InnerResolverConfig } from "../types";
import { arrayFieldResolver } from "./arrayField";
import { objectFieldResolver } from "./objectField";

export function entityFieldResolvers(
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
