// Set this up as a CronToGo task
// CRON_TO_GO_ACTIVE=true node services/realtime/build/workers/analytics/viewCountWriteback.js

import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import assert from "assert";
import { gql } from "graphql-tag";
import { InsertViewCountsDocument, SelectViewCountsDocument } from "../../generated/graphql";

gql`
    query SelectViewCounts($cutoff: timestamptz!, $itemIds: [uuid!]!, $elementIds: [uuid!]!, $roomIds: [uuid!]!) {
        analytics_ContentItemStats(where: { itemId: { _in: $itemIds }, created_at: { _gt: $cutoff } }) {
            id
            itemId
            viewCount
        }
        analytics_ContentElementStats(where: { elementId: { _in: $elementIds }, created_at: { _gt: $cutoff } }) {
            id
            elementId
            viewCount
        }
        analytics_RoomStats(where: { roomId: { _in: $roomIds }, created_at: { _gt: $cutoff } }) {
            id
            roomId
            hlsViewCount
        }
    }

    mutation InsertViewCounts(
        $itemStats: [analytics_ContentItemStats_insert_input!]!
        $elementStats: [analytics_ContentElementStats_insert_input!]!
        $roomStats: [analytics_RoomStats_insert_input!]!
    ) {
        insert_analytics_ContentItemStats(
            objects: $itemStats
            on_conflict: { constraint: ContentItemStats_pkey, update_columns: [viewCount] }
        ) {
            affected_rows
        }
        insert_analytics_ContentElementStats(
            objects: $elementStats
            on_conflict: { constraint: ContentElementStats_pkey, update_columns: [viewCount] }
        ) {
            affected_rows
        }
        insert_analytics_RoomStats(
            objects: $roomStats
            on_conflict: { constraint: RoomStats_pkey, update_columns: [hlsViewCount] }
        ) {
            affected_rows
        }
    }
`;

async function Main(continueExecuting = false) {
    try {
        assert(gqlClient, "Apollo client needed for analytics view count writeback");

        console.info("Writing back analytics view counts");

        const itemResults: {
            identifier: string;
            count: number;
        }[] = [];
        const elementResults: {
            identifier: string;
            count: number;
        }[] = [];
        const roomHLSResults: {
            identifier: string;
            count: number;
        }[] = [];

        const client = await redisClientPool.acquire("workers/analytics/viewCountWriteback/Main");
        let clientReleased = false;
        try {
            let [cursor, keys] = await redisClientP.scan(client)("0", "analytics.view.count:*");
            let partial = (
                await Promise.all(
                    keys.map(async (key) => {
                        const value = Number.parseInt(await redisClientP.getset(client)(key, "0"), 10);
                        if (value) {
                            return {
                                contentType: key.split(":")[1],
                                identifier: key.split(":")[2],
                                count: value,
                            };
                        }
                        return undefined;
                    })
                )
            ).filter((x) => !!x) as {
                identifier: string;
                contentType: string;
                count: number;
            }[];
            partial.forEach((pair) => {
                if (pair.contentType === "Item") {
                    itemResults.push(pair);
                } else if (pair.contentType === "Element") {
                    elementResults.push(pair);
                } else if (pair.contentType === "Room.HLSStream") {
                    roomHLSResults.push(pair);
                }
            });
            while (cursor !== "0") {
                [cursor, keys] = await redisClientP.scan(client)(cursor, "analytics.view.count:*");
                partial = (
                    await Promise.all(
                        keys.map(async (key) => {
                            const value = Number.parseInt(await redisClientP.getset(client)(key, "0"), 10);
                            if (value) {
                                return {
                                    contentType: key.split(":")[1],
                                    identifier: key.split(":")[2],
                                    count: value,
                                };
                            }
                            return undefined;
                        })
                    )
                ).filter((x) => !!x) as {
                    identifier: string;
                    contentType: string;
                    count: number;
                }[];
                partial.forEach((pair) => {
                    if (pair.contentType === "Item") {
                        itemResults.push(pair);
                    } else if (pair.contentType === "Element") {
                        elementResults.push(pair);
                    } else if (pair.contentType === "Room.HLSStream") {
                        roomHLSResults.push(pair);
                    }
                });
            }

            redisClientPool.release("workers/analytics/viewCountWriteback/Main", client);
            clientReleased = true;

            //         console.info(`View counts to write back:
            //     Item: ${JSON.stringify(itemResults, null, 2)}

            //     Element: ${JSON.stringify(elementResults, null, 2)}

            //     Room.HLSStream: ${JSON.stringify(roomHLSResults, null, 2)}
            // `);

            const itemIds = itemResults.map((x) => x.identifier);
            const elementIds = elementResults.map((x) => x.identifier);
            const roomIds = roomHLSResults.map((x) => x.identifier);
            const existingCounts = await gqlClient.query({
                query: SelectViewCountsDocument,
                variables: {
                    itemIds,
                    elementIds,
                    roomIds,
                    cutoff: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                },
            });
            await gqlClient.mutate({
                mutation: InsertViewCountsDocument,
                variables: {
                    itemStats: itemResults.map((result) => {
                        const existing = existingCounts.data.analytics_ContentItemStats.find(
                            (x) => x.itemId === result.identifier
                        );
                        return {
                            id: existing?.id,
                            itemId: result.identifier,
                            viewCount: (existing?.viewCount ?? 0) + result.count,
                        };
                    }),
                    elementStats: elementResults.map((result) => {
                        const existing = existingCounts.data.analytics_ContentElementStats.find(
                            (x) => x.elementId === result.identifier
                        );
                        return {
                            id: existing?.id,
                            elementId: result.identifier,
                            viewCount: (existing?.viewCount ?? 0) + result.count,
                        };
                    }),
                    roomStats: roomHLSResults.map((result) => {
                        const existing = existingCounts.data.analytics_RoomStats.find(
                            (x) => x.roomId === result.identifier
                        );
                        return {
                            id: existing?.id,
                            roomId: result.identifier,
                            hlsViewCount: (existing?.hlsViewCount ?? 0) + result.count,
                        };
                    }),
                },
            });
        } finally {
            if (!clientReleased) {
                redisClientPool.release("workers/analytics/viewCountWriteback/Main", client);
            }
        }

        if (!continueExecuting) {
            process.exit(0);
        }
    } catch (e) {
        console.error("SEVERE ERROR: Cannot write back analytics view counts!", e);

        if (!continueExecuting) {
            process.exit(-1);
        }
    }
}

if (!process.env.CRON_TO_GO_ACTIVE) {
    if (!process.env.CRONTOGO_API_KEY) {
        setInterval(() => Main(true), 60 * 1000);
    }
} else {
    Main();
}
