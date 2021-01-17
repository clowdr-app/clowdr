import { gql } from "@apollo/client/core";
import {
    ActiveShufflePeriodFragment,
    SelectActiveShufflePeriodsDocument,
    SelectShufflePeriodDocument,
    UnallocatedShuffleQueueEntryFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { ShuffleQueueEntryData } from "../types/hasura/event";

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
                people: roomPeople_aggregate {
                    aggregate {
                        count
                    }
                }
            }
            startedAt
        }
    }

    query SelectShufflePeriod($id: uuid!) {
        room_ShufflePeriod_by_pk(id: $id) {
            ...ActiveShufflePeriod
        }
    }

    query SelectActiveShufflePeriods($from: timestamptz!, $until: timestamptz!) {
        room_ShufflePeriod(where: { startAt: { _lte: $from }, endAt: { _gte: $until } }) {
            ...ActiveShufflePeriod
        }
    }
`;

async function allocateToExistingRoom(entries: UnallocatedShuffleQueueEntryFragment[], shuffleRoomId: string, unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>): Promise<void> {
    // Bwweerrr mutable state bwweerrr
    for (const entry of entries) {
        unallocatedQueueEntries.delete(entry.id);
    }

    // TODO
}

async function allocateToNewRoom(entries: UnallocatedShuffleQueueEntryFragment[], unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>): Promise<void> {
    // Bwweerrr mutable state bwweerrr
    for (const entry of entries) {
        unallocatedQueueEntries.delete(entry.id);
    }

    // TODO
}

async function attemptToMatchEntry(
    activePeriod: ActiveShufflePeriodFragment,
    entry: UnallocatedShuffleQueueEntryFragment,
    unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>
): Promise<boolean> {

    // 1. Attempt to find an existing room to allocate them to
    for (const room of activePeriod.activeRooms) {
        if (typeof room.room.people.aggregate?.count === "number") {
            const duration = room.durationMinutes * 60 * 1000;
            const startedAt = Date.parse(room.startedAt);
            const endsAt = startedAt + duration;
            const now = Date.now();
            const timeRemaining = endsAt - now;
            if (timeRemaining > 0.5 * duration) {
                // Add one because we allow space for the organiser to be in every room
                if (room.room.people.aggregate.count < activePeriod.targetAttendeesPerRoom + 1) {
                    await allocateToExistingRoom([entry], room.id, unallocatedQueueEntries);
                    return true;
                }
            }
        }
    }

    // 2. Attempt to find other unallocated entries to match with
    if (unallocatedQueueEntries.size > 0) {
        // Take as many as possible to group them all together right away 
        // (minus one to allow space for the entry we are processing!)
        //    * Sorted by id so oldest entries come first
        const entriesToAllocate = Array.from(unallocatedQueueEntries.values())
            .sort((x, y) => x.id - y.id)
            .splice(0, activePeriod.targetAttendeesPerRoom - 1);
        await allocateToNewRoom([...entriesToAllocate, entry], unallocatedQueueEntries);
        return true;
    }

    // 3. If waiting longer than max period, attempt to find overflow space
    const enteredAt = Date.parse(entry.created_at);
    const expiresAt = enteredAt + (activePeriod.waitRoomMaxDurationSeconds * 1000);
    const now = Date.now();
    if (expiresAt < now) {
        for (const room of activePeriod.activeRooms) {
            if (typeof room.room.people.aggregate?.count === "number") {
                const duration = room.durationMinutes * 60 * 1000;
                const startedAt = Date.parse(room.startedAt);
                const endsAt = startedAt + duration;
                const now = Date.now();
                const timeRemaining = endsAt - now;
                if (timeRemaining > 0.3 * duration) {
                    // Add one because we allow space for the organiser to be in every room
                    if (room.room.people.aggregate.count < activePeriod.maxAttendeesPerRoom + 1) {
                        await allocateToExistingRoom([entry], room.id, unallocatedQueueEntries);
                        return true;
                    }
                }
            }
        }
    }

    // We failed to match :(
    console.log(`[This is not an error]: Unable to match entry: ${entry.id}`);
    return false;
}

async function attemptToMatchEntries(
    activePeriod: ActiveShufflePeriodFragment,
    entryIds: number[]
): Promise<void> {
    const unallocatedQueueEntries = new Map(activePeriod.unallocatedQueueEntries.map(x => [x.id, x]));
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
            }
            catch (e) {
                console.error(`Error processing queue entry. Entry: ${entry.id}. Error: ${e.toString()}`);
            }
        }
    }
}

export async function handleShuffleQueueEntered(entry: ShuffleQueueEntryData): Promise<void> {
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
    await attemptToMatchEntries(result.data.room_ShufflePeriod_by_pk, [entry.id]);
}

export async function processShuffleQueues(): Promise<void> {
    const now = Date.now();
    const from = now - 30000;
    const until = now + 30000;

    const result = await apolloClient.query({
        query: SelectActiveShufflePeriodsDocument,
        variables: {
            from: new Date(from).toISOString(),
            until: new Date(until).toISOString(),
        },
    });

    await Promise.all(result.data.room_ShufflePeriod.map(async period => {
        await attemptToMatchEntries(period, period.unallocatedQueueEntries.map(x => x.id));
    }));
}
