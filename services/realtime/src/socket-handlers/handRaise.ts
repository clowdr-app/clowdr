import assert from "assert";
import gql from "graphql-tag";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import {
    GetExistingProgramPersonDocument,
    InsertEventParticipantDocument,
    Permissions_Permission_Enum,
    Room_ManagementMode_Enum,
    Schedule_EventProgramPersonRole_Enum,
} from "../generated/graphql";
import { getEventInfo } from "../lib/cache/roomInfo";
import { generateEventHandsRaisedKeyName, generateEventHandsRaisedRoomName } from "../lib/handRaise";
import { canAccessEvent } from "../lib/permissions";
import { redisClientP, redisClientPool } from "../redis";
import { socketServer } from "../servers/socket-server";
import { testMode } from "../testMode";

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

export function onRaiseHand(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    _socket: Socket
): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (
                    await canAccessEvent(
                        userId,
                        eventId,
                        conferenceSlugs,
                        "event:test-registrant-id",
                        "event:test-conference-id",
                        "event:test-room-id",
                        "event:test-room-name",
                        Room_ManagementMode_Enum.Public
                    )
                ) {
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
            } catch (e) {
                console.error(`Error processing event.handRaise.raise (socket: ${socketId}, eventId: ${eventId})`, e);
            }
        }
    };
}

export function onLowerHand(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    _socket: Socket
): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (
                    await canAccessEvent(
                        userId,
                        eventId,
                        conferenceSlugs,
                        "event:test-registrant-id",
                        "event:test-conference-id",
                        "event:test-room-id",
                        "event:test-room-name",
                        Room_ManagementMode_Enum.Public
                    )
                ) {
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
            } catch (e) {
                console.error(`Error processing event.handRaise.lower (socket: ${socketId}, eventId: ${eventId})`, e);
            }
        }
    };
}

export function onFetchHandsRaised(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (
                    await canAccessEvent(
                        userId,
                        eventId,
                        conferenceSlugs,
                        "event:test-registrant-id",
                        "event:test-conference-id",
                        "event:test-room-id",
                        "event:test-room-name",
                        Room_ManagementMode_Enum.Public
                    )
                ) {
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
            } catch (e) {
                console.error(`Error processing event.handRaise.fetch (socket: ${socketId}, eventId: ${eventId})`, e);
            }
        }
    };
}

export function onAcceptHandRaised(
    conferenceSlugs: string[],
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

                const eventInfo = await getEventInfo(eventId, {
                    conference: { id: "event:test-conference-id", slug: conferenceSlugs[0] },
                    room: {
                        id: "event:test-room-id",
                        name: "event:test-room-name",
                        people: [{ registrantId: "event:test-registrant-id", userId: targetUserId }],
                        managementMode: Room_ManagementMode_Enum.Public,
                    },
                });
                if (
                    eventInfo &&
                    // TODO: Enforce event person role
                    (await canAccessEvent(
                        userId,
                        eventId,
                        conferenceSlugs,
                        "event:test-registrant-id",
                        "event:test-conference-id",
                        "event:test-room-id",
                        "event:test-room-name",
                        Room_ManagementMode_Enum.Public,
                        [
                            Permissions_Permission_Enum.ConferenceViewAttendees,
                            Permissions_Permission_Enum.ConferenceManageSchedule,
                            Permissions_Permission_Enum.ConferenceModerateAttendees,
                            Permissions_Permission_Enum.ConferenceManageAttendees,
                        ],
                        eventInfo
                    ))
                ) {
                    const existingPeople = await testMode(
                        async (apolloClient) => {
                            const response = await apolloClient.query({
                                query: GetExistingProgramPersonDocument,
                                variables: {
                                    conferenceId: eventInfo.conference.id,
                                    userId: targetUserId,
                                },
                            });

                            return {
                                people: response.data?.collection_ProgramPerson,
                                registrants: response.data?.registrant_Registrant,
                            };
                        },
                        async () => ({
                            people: [],
                            registrants: [],
                        })
                    );

                    const existingPersonId = existingPeople.people?.length ? existingPeople.people[0].id : undefined;
                    const registrant = existingPeople.registrants?.length ? existingPeople.registrants[0] : undefined;
                    if (existingPersonId || registrant) {
                        const insertResult = await testMode(
                            async (apolloClient) => {
                                const response = await apolloClient.mutate({
                                    mutation: InsertEventParticipantDocument,
                                    variables: {
                                        eventPerson: {
                                            eventId,
                                            personId: existingPersonId,
                                            person:
                                                !existingPersonId && registrant
                                                    ? {
                                                          data: {
                                                              conferenceId: eventInfo.conference.id,
                                                              name: registrant.displayName,
                                                              registrantId: registrant.id,
                                                          },
                                                      }
                                                    : undefined,
                                            roleName,
                                        },
                                    },
                                });
                                return response.data?.insert_schedule_EventProgramPerson_one;
                            },
                            async () => ({
                                id: "test-EventProgramPerson-id",
                                person: {
                                    id: "test-ProgramPerson-id",
                                },
                            })
                        );

                        if (insertResult) {
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
                                        id: insertResult.id,
                                        eventId,
                                        roleName,
                                        person: insertResult.person,
                                    },
                                });
                        }
                    }
                }
            } catch (e) {
                console.error(`Error processing event.handRaise.accept (socket: ${socketId}, eventId: ${eventId})`, e);
            }
        }
    };
}

export function onRejectHandRaised(
    conferenceSlugs: string[],
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
                    await canAccessEvent(
                        userId,
                        eventId,
                        conferenceSlugs,
                        "event:test-registrant-id",
                        "event:test-conference-id",
                        "event:test-room-id",
                        "event:test-room-name",
                        Room_ManagementMode_Enum.Public
                    )
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
            } catch (e) {
                console.error(`Error processing event.handRaise.reject (socket: ${socketId}, eventId: ${eventId})`, e);
            }
        }
    };
}

export function onObserveEvent(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (eventId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                if (
                    // TODO: Enforce event person role
                    await canAccessEvent(
                        userId,
                        eventId,
                        conferenceSlugs,
                        "event:test-registrant-id",
                        "event:test-conference-id",
                        "event:test-room-id",
                        "event:test-room-name",
                        Room_ManagementMode_Enum.Public
                    )
                ) {
                    await socket.join(generateEventHandsRaisedRoomName(eventId));
                }
            } catch (e) {
                console.error(`Error processing event.handRaise.observe (socket: ${socketId}, eventId: ${eventId})`, e);
            }
        }
    };
}

export function onUnobserveEvent(
    _conferenceSlugs: string[],
    _userId: string,
    socketId: string,
    socket: Socket
): (eventId: any) => Promise<void> {
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
            } catch (e) {
                console.error(
                    `Error processing event.handRaise.unobserve (socket: ${socketId}, eventId: ${eventId})`,
                    e
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
