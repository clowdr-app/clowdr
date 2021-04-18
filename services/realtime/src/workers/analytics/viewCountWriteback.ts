// Set this up as a CronToGo task
// CRON_TO_GO_ACTIVE=true heroku run node build/workers/analytics/viewCountWriteback.js

import { gql } from "@apollo/client/core";
import assert from "assert";
import { InsertViewCountsDocument, SelectViewCountsDocument } from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { redisClientP } from "../../redis";

gql`
    query SelectViewCounts($contentGroupIds: [uuid!]!, $contentItemIds: [uuid!]!, $roomIds: [uuid!]!) {
        analytics_ContentGroupStats(where: { contentGroupId: { _in: $contentGroupIds } }) {
            contentGroupId
            viewCount
        }
        analytics_ContentItemStats(where: { contentItemId: { _in: $contentItemIds } }) {
            contentItemId
            viewCount
        }
        analytics_RoomStats(where: { roomId: { _in: $roomIds } }) {
            roomId
            hlsViewCount
        }
    }

    mutation InsertViewCounts(
        $contentGroupStats: [analytics_ContentGroupStats_insert_input!]!
        $contentItemStats: [analytics_ContentItemStats_insert_input!]!
        $roomStats: [analytics_RoomStats_insert_input!]!
    ) {
        insert_analytics_ContentGroupStats(
            objects: $contentGroupStats
            on_conflict: { constraint: ContentGroupStats_pkey, update_columns: [viewCount] }
        ) {
            affected_rows
        }
        insert_analytics_ContentItemStats(
            objects: $contentItemStats
            on_conflict: { constraint: ContentItemStats_pkey, update_columns: [viewCount] }
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
        assert(apolloClient, "Apollo client needed for analytics view count writeback");

        console.info("Writing back analytics view counts");

        const contentGroupResults: {
            identifier: string;
            count: number;
        }[] = [];
        const contentItemResults: {
            identifier: string;
            count: number;
        }[] = [];
        const roomHLSResults: {
            identifier: string;
            count: number;
        }[] = [];

        let [cursor, keys] = await redisClientP.scan("0", "analytics.view.count:*");
        let partial = (
            await Promise.all(
                keys.map(async (key) => {
                    const value = Number.parseInt(await redisClientP.getset(key, "0"), 10);
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
            if (pair.contentType === "ContentGroup") {
                contentGroupResults.push(pair);
            } else if (pair.contentType === "ContentItem") {
                contentItemResults.push(pair);
            } else if (pair.contentType === "Room.HLSStream") {
                roomHLSResults.push(pair);
            }
        });
        while (cursor !== "0") {
            [cursor, keys] = await redisClientP.scan(cursor, "analytics.view.count:*");
            partial = (
                await Promise.all(
                    keys.map(async (key) => {
                        const value = Number.parseInt(await redisClientP.getset(key, "0"), 10);
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
                if (pair.contentType === "ContentGroup") {
                    contentGroupResults.push(pair);
                } else if (pair.contentType === "ContentItem") {
                    contentItemResults.push(pair);
                } else if (pair.contentType === "Room.HLSStream") {
                    roomHLSResults.push(pair);
                }
            });
        }

        //         console.info(`View counts to write back:
        //     ContentGroup: ${JSON.stringify(contentGroupResults, null, 2)}

        //     ContentItem: ${JSON.stringify(contentItemResults, null, 2)}

        //     Room.HLSStream: ${JSON.stringify(roomHLSResults, null, 2)}
        // `);

        const contentGroupIds = contentGroupResults.map((x) => x.identifier);
        const contentItemIds = contentItemResults.map((x) => x.identifier);
        const roomIds = roomHLSResults.map((x) => x.identifier);
        const existingCounts = await apolloClient.query({
            query: SelectViewCountsDocument,
            variables: {
                contentGroupIds,
                contentItemIds,
                roomIds,
            },
        });
        await apolloClient.mutate({
            mutation: InsertViewCountsDocument,
            variables: {
                contentGroupStats: contentGroupResults.map((result) => {
                    const existing = existingCounts.data.analytics_ContentGroupStats.find(
                        (x) => x.contentGroupId === result.identifier
                    );
                    return {
                        contentGroupId: result.identifier,
                        viewCount: (existing?.viewCount ?? 0) + result.count,
                    };
                }),
                contentItemStats: contentItemResults.map((result) => {
                    const existing = existingCounts.data.analytics_ContentItemStats.find(
                        (x) => x.contentItemId === result.identifier
                    );
                    return {
                        contentItemId: result.identifier,
                        viewCount: (existing?.viewCount ?? 0) + result.count,
                    };
                }),
                roomStats: roomHLSResults.map((result) => {
                    const existing = existingCounts.data.analytics_RoomStats.find(
                        (x) => x.roomId === result.identifier
                    );
                    return {
                        roomId: result.identifier,
                        hlsViewCount: (existing?.hlsViewCount ?? 0) + result.count,
                    };
                }),
            },
        });

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
