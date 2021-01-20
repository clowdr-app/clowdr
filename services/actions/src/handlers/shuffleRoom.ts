import { gql } from "@apollo/client/core";
import {
    ActiveShufflePeriodFragment,
    AddPeopleToExistingShuffleRoomDocument,
    InsertManagedRoomDocument,
    InsertShuffleRoomDocument,
    RoomPersonRole_Enum,
    RoomsToEndOfShufflePeriodFragment,
    SelectActiveShufflePeriodsDocument,
    SelectShufflePeriodDocument,
    SetShuffleRoomsEndedDocument,
    UnallocatedShuffleQueueEntryFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { kickAttendeeFromRoom } from "../lib/vonage/vonageTools";
import { Payload, ShuffleQueueEntryData } from "../types/hasura/event";

gql`
    fragment UnallocatedShuffleQueueEntry on room_ShuffleQueueEntry {
        attendeeId
        id
        created_at
    }

    fragment ActiveShufflePeriod on room_ShufflePeriod {
        conferenceId
        endAt
        id
        maxAttendeesPerRoom
        name
        organiserId
        roomDurationMinutes
        startAt
        targetAttendeesPerRoom
        waitRoomMaxDurationSeconds
        unallocatedQueueEntries: queueEntries(
            where: { allocatedShuffleRoomId: { _is_null: true } }
            order_by: { id: asc }
        ) {
            ...UnallocatedShuffleQueueEntry
        }
        activeRooms: shuffleRooms(where: { isEnded: { _eq: false } }) {
            id
            durationMinutes
            room {
                id
                people: roomPeople {
                    id
                    attendeeId
                }
            }
            startedAt
        }
    }

    fragment RoomsToEndOfShufflePeriod on room_ShufflePeriod {
        id
        roomsToEnd: shuffleRooms(where: { startedAt: { _lte: $atLatest }, isEnded: { _eq: false } }) {
            id
            startedAt
            durationMinutes
            room {
                id
                participants {
                    id
                    attendeeId
                }
            }
        }
    }

    query SelectShufflePeriod($id: uuid!) {
        room_ShufflePeriod_by_pk(id: $id) {
            ...ActiveShufflePeriod
        }
    }

    query SelectActiveShufflePeriods(
        $from: timestamptz!
        $until: timestamptz!
        $untilExtended: timestamptz!
        $atLatest: timestamptz!
    ) {
        active: room_ShufflePeriod(where: { startAt: { _lte: $from }, endAt: { _gte: $until } }) {
            ...ActiveShufflePeriod
        }
        ending: room_ShufflePeriod(where: { endAt: { _lte: $untilExtended } }) {
            ...RoomsToEndOfShufflePeriod
        }
    }

    mutation AddPeopleToExistingShuffleRoom(
        $shuffleRoomId: Int!
        $roomPeople: [RoomPerson_insert_input!]!
        $queueEntryIds: [bigint!]!
    ) {
        insert_RoomPerson(objects: $roomPeople) {
            affected_rows
        }
        update_room_ShuffleQueueEntry(
            where: { id: { _in: $queueEntryIds }, allocatedShuffleRoomId: { _is_null: true } }
            _set: { allocatedShuffleRoomId: $shuffleRoomId }
        ) {
            affected_rows
            returning {
                id
            }
        }
    }

    mutation InsertShuffleRoom(
        $durationMinutes: Int!
        $reshuffleUponEnd: Boolean!
        $roomId: uuid!
        $shufflePeriodId: uuid!
        $startedAt: timestamptz!
    ) {
        insert_room_ShuffleRoom_one(
            object: {
                durationMinutes: $durationMinutes
                isEnded: false
                reshuffleUponEnd: $reshuffleUponEnd
                roomId: $roomId
                shufflePeriodId: $shufflePeriodId
                startedAt: $startedAt
            }
        ) {
            id
        }
    }

    mutation InsertManagedRoom($conferenceId: uuid!, $capacity: Int!, $name: String!) {
        insert_Room_one(
            object: {
                capacity: $capacity
                conferenceId: $conferenceId
                currentModeName: BREAKOUT
                name: $name
                roomPrivacyName: MANAGED
            }
        ) {
            id
        }
    }

    mutation SetShuffleRoomsEnded($ids: [bigint!]!) {
        update_room_ShuffleRoom(where: { id: { _in: $ids } }, _set: { isEnded: true }) {
            affected_rows
            returning {
                id
            }
        }
    }
`;

async function allocateToExistingRoom(
    entries: UnallocatedShuffleQueueEntryFragment[],
    shuffleRoomId: number,
    roomId: string,
    unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>
): Promise<void> {
    await apolloClient.mutate({
        mutation: AddPeopleToExistingShuffleRoomDocument,
        variables: {
            queueEntryIds: entries.map((x) => x.id),
            shuffleRoomId,
            roomPeople: entries.map((entry) => ({
                attendeeId: entry.attendeeId,
                roomId,
                roomPersonRoleName: RoomPersonRole_Enum.Participant,
            })),
        },
    });

    // Bwweerrr mutable state bwweerrr
    for (const entry of entries) {
        unallocatedQueueEntries.delete(entry.id);
    }
}

async function allocateToNewRoom(
    periodId: string,
    capacity: number,
    name: string,
    conferenceId: string,
    durationMinutes: number,
    reshuffleUponEnd: boolean,
    entries: UnallocatedShuffleQueueEntryFragment[],
    unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>
): Promise<void> {
    const managedRoom = await apolloClient.mutate({
        mutation: InsertManagedRoomDocument,
        variables: {
            capacity,
            name,
            conferenceId,
        },
    });

    if (!managedRoom.data?.insert_Room_one) {
        throw new Error("Could not insert a new managed room for shuffle space! Room came back null.");
    }

    const shuffleRoom = await apolloClient.mutate({
        mutation: InsertShuffleRoomDocument,
        variables: {
            durationMinutes,
            reshuffleUponEnd,
            roomId: managedRoom.data.insert_Room_one.id,
            shufflePeriodId: periodId,
            startedAt: new Date().toISOString(),
        },
    });

    if (!shuffleRoom.data?.insert_room_ShuffleRoom_one?.id) {
        throw new Error("Could not insert a new shuffle room! ShuffleRoom came back null.");
    }

    await allocateToExistingRoom(
        entries,
        shuffleRoom.data.insert_room_ShuffleRoom_one.id,
        managedRoom.data.insert_Room_one.id,
        unallocatedQueueEntries
    );
}

async function attemptToMatchEntry(
    activePeriod: ActiveShufflePeriodFragment,
    entry: UnallocatedShuffleQueueEntryFragment,
    unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>
): Promise<boolean> {
    // 1. Attempt to find an existing room to allocate them to
    for (const room of activePeriod.activeRooms) {
        if (room.room.people) {
            const duration = room.durationMinutes * 60 * 1000;
            const startedAt = Date.parse(room.startedAt);
            const endsAt = startedAt + duration;
            const now = Date.now();
            const timeRemaining = endsAt - now;
            if (timeRemaining > 0.5 * duration) {
                // Add one because we allow space for the organiser to be in every room
                if (
                    room.room.people.length < activePeriod.targetAttendeesPerRoom + 1 &&
                    !room.room.people.some((x) => x?.attendeeId === entry.attendeeId)
                ) {
                    await allocateToExistingRoom([entry], room.id, room.room.id, unallocatedQueueEntries);
                    return true;
                }
            }
        }
    }

    // 2. Attempt to find other unallocated entries to match with
    if (unallocatedQueueEntries.size > 1) {
        // Take as many as possible to group them all together right away
        // (minus one to allow space for the entry we are processing!)
        //    * Sorted by id so oldest entries come first
        const entriesToAllocate = Array.from(unallocatedQueueEntries.values())
            .sort((x, y) => x.id - y.id)
            .filter((x) => x.id !== entry.id)
            .splice(0, activePeriod.targetAttendeesPerRoom - 1);
        const now = Date.now();
        const roomDuration = activePeriod.roomDurationMinutes * 60 * 1000;
        const periodEndsAt = Date.parse(activePeriod.endAt);
        const timeRemaining = periodEndsAt - (now + roomDuration);
        const reshuffleUponEnd = timeRemaining > 60 * 1000;
        await allocateToNewRoom(
            activePeriod.id,
            activePeriod.maxAttendeesPerRoom + 1,
            activePeriod.name + " room " + new Date().toISOString(),
            activePeriod.conferenceId,
            activePeriod.roomDurationMinutes,
            reshuffleUponEnd,
            [...entriesToAllocate, entry],
            unallocatedQueueEntries
        );
        return true;
    }

    // 3. If waiting longer than max period, attempt to find overflow space
    const enteredAt = Date.parse(entry.created_at);
    const expiresAt = enteredAt + activePeriod.waitRoomMaxDurationSeconds * 1000;
    const now = Date.now();
    if (expiresAt < now) {
        for (const room of activePeriod.activeRooms) {
            if (room.room.people) {
                const duration = room.durationMinutes * 60 * 1000;
                const startedAt = Date.parse(room.startedAt);
                const endsAt = startedAt + duration;
                const now = Date.now();
                const timeRemaining = endsAt - now;
                if (timeRemaining > 0.3 * duration) {
                    // Add one because we allow space for the organiser to be in every room
                    if (
                        room.room.people.length < activePeriod.maxAttendeesPerRoom + 1 &&
                        !room.room.people.some((x) => x?.attendeeId === entry.attendeeId)
                    ) {
                        await allocateToExistingRoom([entry], room.id, room.room.id, unallocatedQueueEntries);
                        return true;
                    }
                }
            }
        }
    }

    // We failed to match :(
    console.log(
        `[This is not an error]: Unable to match shuffle queue entry: ${entry.id} (Probably not enough people online!)`
    );
    return false;
}

async function attemptToMatchEntries(activePeriod: ActiveShufflePeriodFragment, entryIds: number[]): Promise<void> {
    const unallocatedQueueEntries = new Map(activePeriod.unallocatedQueueEntries.map((x) => [x.id, x]));
    for (const entryId of entryIds) {
        const entry = unallocatedQueueEntries.get(entryId);
        if (entry) {
            try {
                const matched = await attemptToMatchEntry(activePeriod, entry, unallocatedQueueEntries);
                // If we failed to match someone, that means there's really no options left for anybody
                // else either
                if (!matched) {
                    break;
                }
            } catch (e) {
                console.error(`Error processing queue entry. Entry: ${entry.id}`, e);
            }
        }
    }
}

export async function handleShuffleQueueEntered(payload: Payload<ShuffleQueueEntryData>): Promise<void> {
    if (!payload.event.data.new) {
        throw new Error("Shuffled queue entered: 'new' data is null?!");
    }
    const entry = payload.event.data.new;

    const result = await apolloClient.query({
        query: SelectShufflePeriodDocument,
        variables: {
            id: entry.shufflePeriodId,
        },
    });
    if (!result.data.room_ShufflePeriod_by_pk) {
        throw new Error(
            `Shuffle period of the queue entry not found! Entry: ${entry.id}, Period: ${entry.shufflePeriodId}, Attendee: ${entry.attendeeId}`
        );
    }
    const startAt = Date.parse(result.data.room_ShufflePeriod_by_pk.startAt);
    if (startAt < Date.now()) {
        await attemptToMatchEntries(result.data.room_ShufflePeriod_by_pk, [entry.id]);
    }
}

async function endRooms(period: RoomsToEndOfShufflePeriodFragment): Promise<void> {
    try {
        const now = Date.now();
        await Promise.all(
            period.roomsToEnd
                .filter((shuffleRoom) => {
                    const startedAt = Date.parse(shuffleRoom.startedAt);
                    const duration = shuffleRoom.durationMinutes * 60 * 1000;
                    return startedAt + duration < now - 5000;
                })
                .map(async (shuffleRoom) => {
                    console.log(`Ending shuffle room: ${shuffleRoom.id}`);
                    await Promise.all(
                        shuffleRoom.room.participants.map(async (participant) => {
                            try {
                                console.log(
                                    `Kicking shuffle room participant: ${participant.id} from ${shuffleRoom.id}`
                                );
                                await kickAttendeeFromRoom(shuffleRoom.room.id, participant.attendeeId);
                            } catch (e) {
                                console.error(
                                    `Failed to kick participant while terminating shuffle room. Participant: ${participant.id}`,
                                    e
                                );
                            }
                        })
                    );
                })
        );

        await apolloClient.mutate({
            mutation: SetShuffleRoomsEndedDocument,
            variables: {
                ids: period.roomsToEnd.map((x) => x.id),
            },
        });
    } catch (e) {
        console.error(`Failed to terminate shuffle rooms. Period: ${period.id}`, e);
    }
}

export async function processShuffleQueues(): Promise<void> {
    const now = Date.now();
    const from = now - 30000;
    const until = now + 30000;

    console.log("Processing end of shuffle rooms");

    const result = await apolloClient.query({
        query: SelectActiveShufflePeriodsDocument,
        variables: {
            from: new Date(from).toISOString(),
            until: new Date(until).toISOString(),
            untilExtended: new Date(until + 30000).toISOString(),
            atLatest: new Date(now - 30 * 1000).toISOString(),
        },
    });

    await Promise.all([
        ...result.data.active.map(async (period) => {
            await attemptToMatchEntries(
                period,
                period.unallocatedQueueEntries.map((x) => x.id)
            );
        }),
        ...result.data.ending.map(async (period) => {
            await endRooms(period);
        }),
    ]);
}
