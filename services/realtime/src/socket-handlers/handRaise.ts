import assert from "assert";
import gql from "graphql-tag";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import {
    GetExistingProgramPersonDocument,
    InsertEventParticipantDocument,
    Room_ManagementMode_Enum,
    Schedule_EventProgramPersonRole_Enum,
} from "../generated/graphql";
import { getEventInfo } from "../lib/cache/roomInfo";
import { generateEventHandsRaisedKeyName, generateEventHandsRaisedRoomName } from "../lib/handRaise";
import { canAccessEvent } from "../lib/permissions";
import { redisClientP } from "../redis";
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
            on_conflict: { constraint: EventProgramPerson_eventId_personId_roleName_key, update_columns: [] }
        ) {
            id
        }
    }
`;

export function onRaiseHand(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (chatId: any) => Promise<void> {
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
                        Room_ManagementMode_Enum.Public,
                        []
                    )
                ) {
                    await redisClientP.zadd(generateEventHandsRaisedKeyName(eventId), Date.now(), userId);
                    socket
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
    socket: Socket
): (chatId: any) => Promise<void> {
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
                        Room_ManagementMode_Enum.Public,
                        []
                    )
                ) {
                    await redisClientP.zrem(generateEventHandsRaisedKeyName(eventId), userId);
                    socket
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
): (chatId: any) => Promise<void> {
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
                        Room_ManagementMode_Enum.Public,
                        []
                    )
                ) {
                    const userIds = redisClientP.zrange(generateEventHandsRaisedKeyName(eventId), 0, -1);
                    socket.emit("event.handRaise.listing", { eventId, userIds });
                }
            } catch (e) {
                console.error(`Error processing event.handRaise.check (socket: ${socketId}, eventId: ${eventId})`, e);
            }
        }
    };
}

export function onAcceptHandRaised(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (chatId: any) => Promise<void> {
    return async (eventId) => {
        if (eventId) {
            try {
                assert(is<string>(eventId), "Data does not match expected type.");

                const eventInfo = await getEventInfo(eventId, {
                    conference: { id: "event:test-conference-id", slug: conferenceSlugs[0] },
                    room: {
                        id: "event:test-room-id",
                        name: "event:test-room-name",
                        people: [{ registrantId: "event:test-registrant-id", userId }],
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
                        [],
                        eventInfo
                    ))
                ) {
                    const existingPeople = await testMode(
                        async (apolloClient) => {
                            const response = await apolloClient.query({
                                query: GetExistingProgramPersonDocument,
                                variables: {
                                    conferenceId: eventInfo.conference.id,
                                    userId,
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
                        await testMode(
                            async (apolloClient) => {
                                await apolloClient.mutate({
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
                                            roleName: Schedule_EventProgramPersonRole_Enum.Participant,
                                        },
                                    },
                                });
                            },
                            async () => undefined
                        );

                        await redisClientP.zrem(generateEventHandsRaisedKeyName(eventId), userId);
                        socket
                            .in(generateEventHandsRaisedRoomName(eventId))
                            .emit("event.handRaise.accepted", { eventId, userId });
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
    socket: Socket
): (chatId: any) => Promise<void> {
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
                        Room_ManagementMode_Enum.Public,
                        []
                    )
                ) {
                    await redisClientP.zrem(generateEventHandsRaisedKeyName(eventId), userId);
                    socket
                        .in(generateEventHandsRaisedRoomName(eventId))
                        .emit("event.handRaise.rejected", { eventId, userId });
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
): (chatId: any) => Promise<void> {
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
                        Room_ManagementMode_Enum.Public,
                        []
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
): (chatId: any) => Promise<void> {
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
