import type { ResolverConfig } from "@urql/exchange-graphcache";
import type { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import type { AugmentedIntrospectionData } from "./types";
import { queryRootUpdaters } from "./updaters/entities";

export function genericUpdaters(
    customResolvers: ResolverConfig,
    schema: IntrospectionData,
    augSchema: AugmentedIntrospectionData
): ResolverConfig {
    return new Proxy(customResolvers, {
        has: (target: ResolverConfig, prop: string) => {
            if (prop === "Mutation") {
                return true;
            }

            if (prop in target) {
                return true;
            }

            if (prop === schema.__schema.mutationType?.name) {
                return true;
            }

            return false;
        },
        get: (target: ResolverConfig, prop: string) => {
            if (prop in target) {
                return target[prop];
            }

            if (prop === schema.__schema.mutationType?.name || prop === "Mutation") {
                return queryRootUpdaters(target[prop] ?? {}, schema, augSchema);
            }

            return undefined;
        },
    });
}
