import { EventCache } from "@midspace/caches/event";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import assert from "assert";
import gql from "graphql-tag";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import type {
    GetExistingProgramPersonQuery,
    GetExistingProgramPersonQueryVariables,
    InsertEventParticipantMutation,
    InsertEventParticipantMutationVariables,
} from "../generated/graphql";
import {
    GetExistingProgramPersonDocument,
    InsertEventParticipantDocument,
    Schedule_EventProgramPersonRole_Enum,
} from "../generated/graphql";
import { generateEventHandsRaisedKeyName, generateEventHandsRaisedRoomName } from "../lib/handRaise";
import { logger } from "../lib/logger";
import { canAccessEvent } from "../lib/permissions";
import { socketServer } from "../servers/socket-server";

gql`
    query GetExistingProgramPerson($conferenceId: uuid!, $userId: String!) {
        collection_ProgramPerson(
            where: { conferenceId: { _eq: $conferenceId }, registrant: { userId: { _eq: $userId } } }
        ) {
            id
        }
        registrant_Registrant(where: { conferenceId: { _eq: $conferenceId }, userId: { _eq: $userId } }) {
            id
            displayName
        }
    }

    mutation InsertEventParticipant($eventPerson: schedule_EventProgramPerson_insert_input!) {
        insert_schedule_EventProgramPerson_one(
            object: $eventPerson
            on_conflict: { constraint: EventProgramPerson_eventId_personId_roleName_key, update_columns: [roleName] }
        ) {
            id
            # Needs to match Room.tsx: fragment Room_EventSummary.eventPeople.person
            person {
                id
                name
                affiliation
                registrantId
            }
        }
    }
`;

export function onRaiseHand(userId: string, socketId: string, _socket: Socket): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (await canAccessEvent(userId, eventId)) {
                    const redisClient = await redisClientPool.acquire("socket-handlers/handRaise/onRaiseHand");
                    try {
                        await redisClientP.zadd(redisClient)(
                            generateEventHandsRaisedKeyName(eventId),
                            Date.now(),
                            userId
                        );
                    } finally {
                        redisClientPool.release("socket-handlers/handRaise/onRaiseHand", redisClient);
                    }

                    socketServer
                        .in(generateEventHandsRaisedRoomName(eventId))
                        .emit("event.handRaise.raised", { eventId, userId });
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing event.handRaise.raise (socket: ${socketId}, eventId: ${eventId})`
                );
            }
        }
    };
}

export function onLowerHand(userId: string, socketId: string, _socket: Socket): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (await canAccessEvent(userId, eventId)) {
                    const redisClient = await redisClientPool.acquire("socket-handlers/handRaise/onLowerHand");
                    try {
                        await redisClientP.zrem(redisClient)(generateEventHandsRaisedKeyName(eventId), userId);
                    } finally {
                        redisClientPool.release("socket-handlers/handRaise/onLowerHand", redisClient);
                    }

                    socketServer
                        .in(generateEventHandsRaisedRoomName(eventId))
                        .emit("event.handRaise.lowered", { eventId, userId });
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing event.handRaise.lower (socket: ${socketId}, eventId: ${eventId})`
                );
            }
        }
    };
}

export function onFetchHandsRaised(userId: string, socketId: string, socket: Socket): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (await canAccessEvent(userId, eventId)) {
                    const redisClient = await redisClientPool.acquire("socket-handlers/handRaise/onFetchHandsRaised");
                    try {
                        const userIds = await redisClientP.zrange(redisClient)(
                            generateEventHandsRaisedKeyName(eventId),
                            0,
                            -1
                        );
                        socket.emit("event.handRaise.listing", { eventId, userIds });
                    } finally {
                        redisClientPool.release("socket-handlers/handRaise/onFetchHandsRaised", redisClient);
                    }
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing event.handRaise.fetch (socket: ${socketId}, eventId: ${eventId})`
                );
            }
        }
    };
}

export function onAcceptHandRaised(
    userId: string,
    socketId: string,
    _socket: Socket
): (eventId: any, targetUserId: any) => Promise<void> {
    return async (eventId, targetUserId) => {
        if (eventId && targetUserId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");
                assert(is<string>(targetUserId), "Data does not match expected type.");

                const roleName = Schedule_EventProgramPersonRole_Enum.Participant;

                const eventInfo = await new EventCache(logger).getEntity(eventId);
                if (
                    eventInfo &&
                    // TODO: Enforce event person role
                    (await canAccessEvent(userId, eventId))
                ) {
                    const response = await gqlClient
                        ?.query<GetExistingProgramPersonQuery, GetExistingProgramPersonQueryVariables>(
                            GetExistingProgramPersonDocument,
                            {
                                conferenceId: eventInfo.conferenceId,
                                userId: targetUserId,
                            }
                        )
                        .toPromise();

                    const existingPersonId = response?.data?.collection_ProgramPerson.length
                        ? response.data.collection_ProgramPerson[0].id
                        : undefined;
                    const registrant = response?.data?.registrant_Registrant.length
                        ? response.data.registrant_Registrant[0]
                        : undefined;
                    if (existingPersonId || registrant) {
                        const innerResponse = await gqlClient
                            ?.mutation<InsertEventParticipantMutation, InsertEventParticipantMutationVariables>(
                                InsertEventParticipantDocument,
                                {
                                    eventPerson: {
                                        eventId,
                                        personId: existingPersonId,
                                        person:
                                            !existingPersonId && registrant
                                                ? {
                                                      data: {
                                                          conferenceId: eventInfo.conferenceId,
                                                          name: registrant.displayName,
                                                          registrantId: registrant.id,
                                                      },
                                                  }
                                                : undefined,
                                        roleName,
                                    },
                                }
                            )
                            .toPromise();

                        if (innerResponse?.data?.insert_schedule_EventProgramPerson_one) {
                            const redisClient = await redisClientPool.acquire(
                                "socket-handlers/handRaise/onAcceptHandRaised"
                            );
                            try {
                                await redisClientP.zrem(redisClient)(
                                    generateEventHandsRaisedKeyName(eventId),
                                    targetUserId
                                );
                            } finally {
                                redisClientPool.release("socket-handlers/handRaise/onAcceptHandRaised", redisClient);
                            }

                            socketServer
                                .in(generateEventHandsRaisedRoomName(eventId))
                                .emit("event.handRaise.accepted", {
                                    eventId,
                                    userId: targetUserId,
                                    eventPerson: {
                                        id: innerResponse.data.insert_schedule_EventProgramPerson_one.id,
                                        eventId,
                                        roleName,
                                        person: innerResponse.data.insert_schedule_EventProgramPerson_one.person,
                                    },
                                });
                        }
                    }
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing event.handRaise.accept (socket: ${socketId}, eventId: ${eventId})`
                );
            }
        }
    };
}

export function onRejectHandRaised(
    userId: string,
    socketId: string,
    _socket: Socket
): (eventId: any, targetUserId: any) => Promise<void> {
    return async (eventId, targetUserId) => {
        if (eventId && targetUserId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");
                assert(is<string>(targetUserId), "Data does not match expected type.");

                if (
                    // TODO: Enforce event person role
                    await canAccessEvent(userId, eventId)
                ) {
                    const redisClient = await redisClientPool.acquire("socket-handlers/handRaise/onRejectHandRaised");
                    try {
                        await redisClientP.zrem(redisClient)(generateEventHandsRaisedKeyName(eventId), targetUserId);
                    } finally {
                        redisClientPool.release("socket-handlers/handRaise/onRejectHandRaised", redisClient);
                    }
                    socketServer
                        .in(generateEventHandsRaisedRoomName(eventId))
                        .emit("event.handRaise.rejected", { eventId, userId: targetUserId });
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing event.handRaise.reject (socket: ${socketId}, eventId: ${eventId})`
                );
            }
        }
    };
}

export function onObserveEvent(userId: string, socketId: string, socket: Socket): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (
                    // TODO: Enforce event person role
                    await canAccessEvent(userId, eventId)
                ) {
                    await socket.join(generateEventHandsRaisedRoomName(eventId));
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing event.handRaise.observe (socket: ${socketId}, eventId: ${eventId})`
                );
            }
        }
    };
}

export function onUnobserveEvent(_userId: string, socketId: string, socket: Socket): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                // if (
                //     // TODO: Enforce event person role
                //     await canAccessEvent(
                //         userId,
                //         eventId,
                //         conferenceSlugs,
                //         "event:test-registrant-id",
                //         "event:test-conference-id",
                //         "event:test-room-id",
                //         "event:test-room-name",
                //         Room_ManagementMode_Enum.Public,
                //         []
                //     )
                // ) {
                await socket.leave(generateEventHandsRaisedRoomName(eventId));
                // }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing event.handRaise.unobserve (socket: ${socketId}, eventId: ${eventId})`
                );
            }
        }
    };
}

export function onConnect(_userId: string, _socketId: string): void {
    // TODO: If needed
}

export function onDisconnect(_socketId: string, _userId: string): void {
    // TODO: If needed
}
