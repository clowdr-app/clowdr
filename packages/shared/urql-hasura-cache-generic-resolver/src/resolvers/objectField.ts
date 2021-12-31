import type { Resolver } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import { getObjectTypeName, getTableFieldsSchema } from "../schema";
import type { AugmentedIntrospectionData } from "../types";
import { resolveRelation } from "./relation";

export const objectFieldResolver: (schema: IntrospectionData, augSchema: AugmentedIntrospectionData) => Resolver = (
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
        const fieldAugSchema = parentTableSchema.augTableSchema.fields.find(
            (x) =>
                (x.type.kind === "ARRAY_RELATIONSHIP_KEY_MAP" || x.type.kind === "OBJECT_RELATIONSHIP_KEY_MAP") &&
                x.name === info.fieldName
        );
        if (
            !fieldSchema ||
            !fieldAugSchema ||
            !(
                fieldAugSchema.type.kind === "ARRAY_RELATIONSHIP_KEY_MAP" ||
                fieldAugSchema.type.kind === "OBJECT_RELATIONSHIP_KEY_MAP"
            )
        ) {
            return undefined;
        }
        const fieldEntityTypeName = getObjectTypeName(fieldSchema.type);
        if (!fieldEntityTypeName) {
            return undefined;
        }

        const result = resolveRelation(fieldAugSchema.type, cache, info.parentKey, fieldEntityTypeName, args.where);

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
