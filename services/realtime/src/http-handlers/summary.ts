import { NextFunction, Request, Response } from "express";
import { promisify } from "util";
import { presenceListKey } from "../lib/presence";
import { redisClientPool } from "../redis";

export async function summary(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    if (process.env.SECRET_FOR_SUMMARY) {
        const providedSecret = req.query["secret"] ?? req.headers["x-hasura-presence-summary-secret"];
        if (process.env.SECRET_FOR_SUMMARY === providedSecret) {
            const basePresenceListKey = presenceListKey("");

            const redisClient = await redisClientPool.acquire("http-handlers/summary/summary");
            try {
                const scan = promisify<(...opts: string[]) => Promise<[string, string[]]>>(
                    redisClient.scan as unknown as any
                ).bind(redisClient);
                const smembers = promisify<(...opts: string[]) => Promise<string[]>>(
                    redisClient.smembers as unknown as any
                ).bind(redisClient);
                const scanAll = async (pattern: string) => {
                    const found = [];
                    let cursor = "0";

                    do {
                        const reply = await scan(cursor, "MATCH", pattern);

                        cursor = reply[0];
                        found.push(...reply[1]);
                    } while (cursor !== "0");

                    return found;
                };

                try {
                    const keys = await scanAll(`${basePresenceListKey}*`);
                    const interestingKeys = keys.filter(
                        (key) => key.lastIndexOf(":") === basePresenceListKey.length - 1
                    );
                    const results = await Promise.all(
                        interestingKeys.map(async (key) => ({ key, userIds: await smembers(key) }))
                    );
                    const userIds = new Set<string>();
                    for (const result of results) {
                        for (const userId of result.userIds) {
                            userIds.add(userId);
                        }
                    }

                    res.status(200).send({
                        total_unique_tabs: results.reduce((acc, x) => acc + x.userIds.length, 0),
                        total_unique_user_ids: userIds.size,
                        pages: results.reduce(
                            (acc, x) => ({
                                ...acc,
                                [x.key]: x.userIds.length,
                            }),
                            {}
                        ),
                    });
                } catch (e) {
                    res.status(500).send(e);
                }
            } finally {
                redisClientPool.release("http-handlers/summary/summary", redisClient);
            }
        } else {
            res.status(403).send("Secret mismatch");
        }
    } else {
        res.status(403).send("No secret configured");
    }
}
