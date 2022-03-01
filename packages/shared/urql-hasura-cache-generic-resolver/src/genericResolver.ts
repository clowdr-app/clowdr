import type { ResolverConfig } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import { queryRootResolvers } from "./resolvers/entities";
import { entityFieldResolvers } from "./resolvers/entityFields";
import { getTableFieldsSchema } from "./schema";
import type { AugmentedIntrospectionData } from "./types";
import { AggregateOperations } from "./types";

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
