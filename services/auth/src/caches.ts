import { Caches } from "@midspace/caches/caches";
import { createGQLClient } from "@midspace/component-clients/graphqlClient";
import { createRedisClientPool, createRedlockClient } from "@midspace/component-clients/redis";
import { awsClient } from "./awsClient";

export async function initializeCaches() {
    const clientPool = await createRedisClientPool(awsClient);
    const redlock = await createRedlockClient(awsClient);
    const gqlClient = await createGQLClient(awsClient);

    return new Caches(clientPool, redlock, gqlClient);
}

export const caches = initializeCaches();
