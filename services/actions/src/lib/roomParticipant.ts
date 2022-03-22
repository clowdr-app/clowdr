import { gql } from "@apollo/client/core";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { VonageSessionLayoutData } from "@midspace/shared-types/vonage";
import { VonageSessionLayoutType } from "@midspace/shared-types/vonage";
import type { P } from "pino";
import { InsertVonageSessionLayoutDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { kickRegistrantFromRoom } from "./vonage/vonageTools";

export async function getRoomParticipantsCount(roomId: string): Promise<number> {
    const redisClient = await redisClientPool.acquire("lib/vonage/getRoomParticipantsCount");
    try {
        return await redisClientP.zcard(redisClient)(`RoomParticipants:${roomId}`);
    } finally {
        await redisClientPool.release("lib/vonage/getRoomParticipantsCount", redisClient);
    }
}

export async function getIsRoomParticipant(roomId: string, registrantId: string): Promise<boolean> {
    const redisClient = await redisClientPool.acquire("lib/vonage/getRoomParticipantsCount");
    try {
        const rank = await redisClientP.zrank(redisClient)(`RoomParticipants:${roomId}`, registrantId);
        return rank !== null;
    } finally {
        await redisClientPool.release("lib/vonage/getRoomParticipantsCount", redisClient);
    }
}

export async function addRoomParticipant(
    logger: P.Logger,
    roomId: string,
    identifier:
        | { vonageConnectionId: string; vonageSessionId: string }
        | { chimeRegistrantId: string; chimeMeetingId: string },
    registrantId: string
): Promise<void> {
    const redisClient = await redisClientPool.acquire("lib/vonage/sessionMonitoring");
    try {
        const alreadyExisted =
            (await redisClientP.zadd(redisClient)(`RoomParticipants:${roomId}`, Date.now(), registrantId)) === 0;

        if ("vonageConnectionId" in identifier) {
            await redisClientP.zadd(redisClient)(
                `VonageConnections:${identifier.vonageSessionId}`,
                Date.now(),
                identifier.vonageConnectionId
            );
        }

        if (alreadyExisted) {
            logger.info(
                {
                    roomId,
                    registrantId,
                },
                "Registrant is already connected to the room, kicking from previous session"
            );
            await kickRegistrantFromRoom(logger, roomId, registrantId, identifier, true);
        }
    } finally {
        await redisClientPool.release("lib/vonage/sessionMonitoring", redisClient);
    }
}

gql`
    mutation InsertVonageSessionLayout($object: video_VonageSessionLayout_insert_input!) {
        insert_video_VonageSessionLayout_one(object: $object) {
            id
        }
    }
`;

export async function removeAllRoomParticipants(
    logger: P.Logger,
    roomId: string,
    vonageSessionId: string | undefined
): Promise<void> {
    try {
        const redisClient = await redisClientPool.acquire("lib/roomParticipant");
        try {
            await redisClientP.del(redisClient)(`RoomParticipants:${roomId}`);
            if (vonageSessionId) {
                await redisClientP.del(redisClient)(`VonageConnections:${vonageSessionId}`);
            }
        } finally {
            await redisClientPool.release("lib/roomParticipant", redisClient);
        }
    } catch (err) {
        logger.error({ roomId, err }, "Failed to remove all RoomParticipants");
        throw new Error("Failed to remove all RoomParticipants");
    }
}

export async function removeRoomParticipant(
    logger: P.Logger,
    roomId: string,
    conferenceId: string | undefined,
    subconferenceId: string | undefined | null,
    registrantId: string,
    vonage: { sessionId: string; connectionId: string } | undefined,
    removeOnlyConnection: boolean
): Promise<void> {
    try {
        const redisClient = await redisClientPool.acquire("lib/roomParticipant");
        try {
            const redisKey = `RoomParticipants:${roomId}`;

            if (vonage) {
                logger.info({ registrantId, roomId, vonage }, "Removing vonage connection");
                const zremResult = await redisClientP.zrem(redisClient)(
                    `VonageConnections:${vonage.sessionId}`,
                    vonage.connectionId
                );
                removeOnlyConnection = removeOnlyConnection || zremResult === 0;
                logger.info(
                    { zremResult, registrantId, roomId, removeOnlyConnection, vonage },
                    "Removed vonage connection"
                );
            }

            if (!removeOnlyConnection) {
                logger.info({ registrantId, roomId }, "Removing registrant from room");
                await redisClientP.zrem(redisClient)(redisKey, registrantId);
            }

            if (vonage && conferenceId) {
                const count = await redisClientP.zcard(redisClient)(redisKey);
                if (count === 0) {
                    await apolloClient.mutate({
                        mutation: InsertVonageSessionLayoutDocument,
                        variables: {
                            object: {
                                conferenceId,
                                subconferenceId,
                                vonageSessionId: vonage.sessionId,
                                layoutData: {
                                    type: VonageSessionLayoutType.BestFit,
                                    screenShareType: "verticalPresentation",
                                } as VonageSessionLayoutData,
                            },
                        },
                    });
                }
            }
        } finally {
            await redisClientPool.release("lib/roomParticipant", redisClient);
        }
    } catch (err) {
        logger.error(
            { roomId, conferenceId, subconferenceId, registrantId, err },
            "Failed to remove RoomParticipant record"
        );
        throw new Error("Failed to remove RoomParticipant record");
    }
}

export async function deleteRoomParticipantsCreatedBefore(date: Date): Promise<number> {
    const cutoff = date.getTime();
    let totalRemoved = 0;

    const redisClient = await redisClientPool.acquire("lib/roomParticipant");
    try {
        let [cursor, keys] = await redisClientP.scan(redisClient)("0", "RoomParticipants:*");
        do {
            totalRemoved += (
                await Promise.all(keys.map((key) => redisClientP.zremrangebyscore(redisClient)(key, 0, cutoff)))
            ).reduce((acc, x) => acc + x, 0);

            [cursor, keys] = await redisClientP.scan(redisClient)(cursor, "RoomParticipants:*");
        } while (cursor !== "0");

        [cursor, keys] = await redisClientP.scan(redisClient)("0", "VonageConnections:*");
        do {
            await Promise.all(keys.map((key) => redisClientP.zremrangebyscore(redisClient)(key, 0, cutoff)));

            [cursor, keys] = await redisClientP.scan(redisClient)(cursor, "VonageConnections:*");
        } while (cursor !== "0");
    } finally {
        await redisClientPool.release("lib/roomParticipant", redisClient);
    }

    return totalRemoved;
}
