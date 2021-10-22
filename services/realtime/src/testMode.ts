import type { ApolloClient, NormalizedCacheObject } from "@apollo/client/core";
import { apolloClient } from "./graphqlClient";

const isInTestMode = process.env.TEST_MODE === "true";

export function testMode<T>(
    normal: (apolloClient: ApolloClient<NormalizedCacheObject>) => Promise<T>,
    mock: () => Promise<T>
): Promise<T> {
    if (apolloClient) {
        return normal(apolloClient);
    } else if (isInTestMode) {
        return mock();
    } else {
        throw new Error("Apollo client not available and not in test mode!");
    }
}
