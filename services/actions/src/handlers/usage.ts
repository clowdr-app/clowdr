import { gql } from "@apollo/client/core";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { P } from "pino";
import type {
    GetConferenceVideoChatNonEventRemainingQuotaQuery,
    GetConferenceVideoChatNonEventRemainingQuotaQueryVariables,
    GetRoomForUsageCalculationQuery,
    GetRoomForUsageCalculationQueryVariables,
    IncreaseConferenceVideoChatNonEventUsageMutation,
    IncreaseConferenceVideoChatNonEventUsageMutationVariables,
    UpdateEventUsageMutation,
    UpdateEventUsageMutationVariables,
} from "../generated/graphql";
import {
    GetConferenceVideoChatNonEventRemainingQuotaDocument,
    GetRoomForUsageCalculationDocument,
    IncreaseConferenceVideoChatNonEventUsageDocument,
    UpdateEventUsageDocument,
} from "../generated/graphql";

gql`
    mutation UpdateEventUsage {
        conference_updateEventUsage {
            id
        }
    }
`;

export async function handleUpdateEventUsage(logger: P.Logger): Promise<void> {
    logger.info("Calling update event usage");
    if (!gqlClient) {
        logger.error({ error: "No GQL client" }, "Update event usage failed");
    }
    gqlClient
        ?.mutation<UpdateEventUsageMutation, UpdateEventUsageMutationVariables>(UpdateEventUsageDocument)
        .toPromise()
        .catch((error) => {
            logger.error({ error }, "Update event usage failed");
        });
}

export async function handleUpdateVideoChatNonEventUsage(logger: P.Logger): Promise<void> {
    increaseVideoChatNonEventUsageByRoomParticipants(logger).catch((error) => {
        logger.error({ error }, "Update video-chat non-event usage failed");
    });
}

export async function handleSaveVideoChatNonEventUsage(logger: P.Logger): Promise<void> {
    const redisClient = await redisClientPool.acquire("handlers/usage/handleSaveVideoChatNonEventUsage");
    try {
        let [cursor, keys] = await redisClientP.scan(redisClient)("0", getVideoChatNonEventUsageRedisKey("*"));
        do {
            await Promise.all(
                keys.map(async (key) => {
                    try {
                        const conferenceId = key.substring(getVideoChatNonEventUsageRedisKey("").length);
                        await saveVideoChatNonEventUsage(conferenceId);
                    } catch (error: any) {
                        logger.error(
                            { error, key },
                            "Failed to increase video chat non-event usage for single conference"
                        );
                    }
                })
            );

            [cursor, keys] = await redisClientP.scan(redisClient)(cursor, getVideoChatNonEventUsageRedisKey("*"));
        } while (cursor !== "0");
    } catch (error: any) {
        logger.error({ error }, "Failed to save video chat non-event usage");
    } finally {
        await redisClientPool.release("handlers/usage/handleSaveVideoChatNonEventUsage", redisClient);
    }
}

function getVideoChatNonEventUsageRedisKey(conferenceId: string): string {
    return `VideoChatNonEventUsage:${conferenceId}`;
}

gql`
    query GetConferenceVideoChatNonEventRemainingQuota($conferenceId: uuid!) {
        conference_RemainingQuota(where: { conferenceId: { _eq: $conferenceId } }) {
            remainingVideoChatNonEventTotalMinutes
        }
    }

    mutation IncreaseConferenceVideoChatNonEventUsage($conferenceId: uuid!, $increase: Int!, $now: timestamptz!) {
        update_conference_Usage(
            where: { conferenceId: { _eq: $conferenceId } }
            _inc: { consumedVideoChatNonEventTotalMinutes: $increase }
            _set: { lastUpdatedConsumedVideoChatNonEventTotalMinutes: $now }
        ) {
            affected_rows
        }
    }
`;

export async function getVideoChatNonEventRemainingQuota(conferenceId: string): Promise<number> {
    const response = await gqlClient
        ?.query<
            GetConferenceVideoChatNonEventRemainingQuotaQuery,
            GetConferenceVideoChatNonEventRemainingQuotaQueryVariables
        >(GetConferenceVideoChatNonEventRemainingQuotaDocument, {
            conferenceId,
        })
        .toPromise();

    const quota = response?.data?.conference_RemainingQuota[0];
    if (!quota) {
        throw new Error("Unable to obtain remaining quota");
    }
    const remainingQuotaInDB = quota.remainingVideoChatNonEventTotalMinutes;
    if (remainingQuotaInDB === null || remainingQuotaInDB === undefined) {
        throw new Error("Remaining quota was null or undefined");
    }

    const redisKey = getVideoChatNonEventUsageRedisKey(conferenceId);
    const redisClient = await redisClientPool.acquire("handlers/usage/getVideoChatNonEventRemainingQuota");
    try {
        const valueStr = await redisClientP.get(redisClient)(redisKey);
        if (valueStr) {
            const unstoredUsage = parseInt(valueStr, 10);
            return remainingQuotaInDB - unstoredUsage;
        } else {
            return remainingQuotaInDB;
        }
    } finally {
        redisClientPool.release("handlers/usage/getVideoChatNonEventRemainingQuota", redisClient);
    }
}

export async function incrementVideoChatNonEventUsage(conferenceId: string, minutes: number): Promise<void> {
    const redisKey = getVideoChatNonEventUsageRedisKey(conferenceId);
    const redisClient = await redisClientPool.acquire("handlers/usage/incrementVideoChatNonEventUsage");
    try {
        await redisClientP.incrBy(redisClient)(redisKey, minutes);
    } finally {
        redisClientPool.release("handlers/usage/incrementVideoChatNonEventUsage", redisClient);
    }
}

gql`
    query GetRoomForUsageCalculation($id: uuid!, $now: timestamptz!) {
        room_Room_by_pk(id: $id) {
            id
            conferenceId
            events(where: { startTime: { _lte: $now }, endTime: { _gt: $now } }) {
                id
            }
        }
    }
`;

export async function increaseVideoChatNonEventUsageByRoomParticipants(logger: P.Logger): Promise<void> {
    const redisClient = await redisClientPool.acquire(
        "handlers/usage/increaseVideoChatNonEventUsageByRoomParticipants"
    );
    try {
        let [cursor, keys] = await redisClientP.scan(redisClient)("0", "RoomParticipants:*");
        do {
            await Promise.all(
                keys.map(async (key) => {
                    try {
                        const roomId = key.substring("RoomParticipants:".length);
                        const roomResponse = await gqlClient
                            ?.query<GetRoomForUsageCalculationQuery, GetRoomForUsageCalculationQueryVariables>(
                                GetRoomForUsageCalculationDocument,
                                {
                                    id: roomId,
                                    now: new Date().toISOString(),
                                }
                            )
                            .toPromise();
                        if (!roomResponse?.data?.room_Room_by_pk) {
                            throw new Error("Failed to fetch room info");
                        }

                        if (roomResponse.data.room_Room_by_pk.events.length === 0) {
                            const conferenceId = roomResponse.data.room_Room_by_pk.conferenceId;
                            const participantsCount = await redisClientP.zcard(redisClient)(key);
                            await incrementVideoChatNonEventUsage(conferenceId, participantsCount);
                        }
                    } catch (error: any) {
                        logger.error(
                            { error, key },
                            "Failed to increase video chat non-event usage by room participants for single room"
                        );
                    }
                })
            );

            [cursor, keys] = await redisClientP.scan(redisClient)(cursor, "RoomParticipants:*");
        } while (cursor !== "0");
    } catch (error: any) {
        logger.error({ error }, "Failed to increase video chat non-event usage by room participants");
    } finally {
        await redisClientPool.release("handlers/usage/increaseVideoChatNonEventUsageByRoomParticipants", redisClient);
    }
}

export async function saveVideoChatNonEventUsage(conferenceId: string): Promise<void> {
    const redisKey = getVideoChatNonEventUsageRedisKey(conferenceId);
    const redisClient = await redisClientPool.acquire("handlers/usage/incrementVideoChatNonEventUsage");
    try {
        const usage = await redisClientP.getset(redisClient)(redisKey, "0");
        if (usage !== null) {
            await gqlClient
                ?.mutation<
                    IncreaseConferenceVideoChatNonEventUsageMutation,
                    IncreaseConferenceVideoChatNonEventUsageMutationVariables
                >(IncreaseConferenceVideoChatNonEventUsageDocument, {
                    conferenceId,
                    increase: parseInt(usage, 10),
                    now: new Date().toISOString(),
                })
                .toPromise();
        }
    } finally {
        redisClientPool.release("handlers/usage/incrementVideoChatNonEventUsage", redisClient);
    }
}
