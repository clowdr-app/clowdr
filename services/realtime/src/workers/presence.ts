import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { RedisClient } from "redis";
import { logger } from "../lib/logger";
import { presenceListKey } from "../lib/presence";
import { maintainPresenceList } from "../socket-handlers/presence";

async function processKeys(redisClient: RedisClient, keys: string[]) {
    for (const key of keys) {
        try {
            await maintainPresenceList(redisClient, key);
        } catch (error: any) {
            logger.error({ error, listKey: key }, "SEVERE ERROR: Cannot maintain one of the presence lists!");
        }
    }
}

async function maintainPresenceLists(continueExecuting = false) {
    try {
        logger.info("Maintaining presence lists");

        const redisClient = await redisClientPool.acquire("/workers/presence/maintainPresenceLists");

        try {
            let [cursor, keys] = await redisClientP.scan(redisClient)("0", presenceListKey("*"));
            await processKeys(redisClient, keys);
            while (cursor !== "0") {
                [cursor, keys] = await redisClientP.scan(redisClient)(cursor, presenceListKey("*"));
                await processKeys(redisClient, keys);
            }
        } finally {
            await redisClientPool.release("/workers/presence/maintainPresenceLists", redisClient);
        }

        if (!continueExecuting) {
            process.exit(0);
        }
    } catch (error: any) {
        logger.error({ error }, "SEVERE ERROR: Cannot maintain presence lists!");

        if (!continueExecuting) {
            process.exit(-1);
        }
    }
}

if (!process.env.CRON_TO_GO_ACTIVE) {
    if (!process.env.CRONTOGO_API_KEY) {
        setInterval(() => maintainPresenceLists(true), 60 * 1000);
    }
} else {
    maintainPresenceLists();
}
