import { gql } from "@apollo/client/core";
import {
    ActiveShufflePeriodFragment,
    ActiveShuffleRoomFragment,
    AddPeopleToExistingShuffleRoomDocument,
    InsertManagedRoomDocument,
    InsertShuffleRoomDocument,
    Room_PersonRole_Enum,
    Room_ShuffleAlgorithm_Enum,
    SelectActiveShufflePeriodsDocument,
    SelectShufflePeriodDocument,
    SetShuffleRoomsEndedDocument,
    UnallocatedShuffleQueueEntryFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { kickRegistrantFromRoom } from "../lib/vonage/vonageTools";
import { Payload, ShuffleQueueEntryData } from "../types/hasura/event";

gql`
    fragment UnallocatedShuffleQueueEntry on room_ShuffleQueueEntry {
        registrantId
        id
        created_at
    }

    fragment ActiveShuffleRoom on room_ShuffleRoom {
        id
        startedAt
        durationMinutes
        room {
            id
            people: roomPeople {
                id
                registrantId
            }
            participants {
                id
                registrantId
            }
        }
    }

    fragment ActiveShufflePeriod on room_ShufflePeriod {
        conferenceId
        endAt
        id
        maxRegistrantsPerRoom
        name
        organiserId
        roomDurationMinutes
        startAt
        targetRegistrantsPerRoom
        waitRoomMaxDurationSeconds
        algorithm
        unallocatedQueueEntries: queueEntries(
            where: { allocatedShuffleRoomId: { _is_null: true } }
            order_by: { id: asc }
        ) {
            ...UnallocatedShuffleQueueEntry
        }
        activeRooms: shuffleRooms(where: { isEnded: { _eq: false } }) {
            ...ActiveShuffleRoom
        }
    }

    query SelectShufflePeriod($id: uuid!) {
        room_ShufflePeriod_by_pk(id: $id) {
            ...ActiveShufflePeriod
        }
    }

    query SelectActiveShufflePeriods($from: timestamptz!, $until: timestamptz!) {
        room_ShufflePeriod(where: { startAt: { _lte: $until }, endAt: { _gte: $from } }) {
            ...ActiveShufflePeriod
        }
    }

    mutation AddPeopleToExistingShuffleRoom(
        $shuffleRoomId: Int!
        $roomPeople: [room_RoomPerson_insert_input!]!
        $queueEntryIds: [bigint!]!
    ) {
        insert_room_RoomPerson(objects: $roomPeople) {
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
        insert_room_Room_one(
            object: {
                capacity: $capacity
                conferenceId: $conferenceId
                currentModeName: BREAKOUT
                name: $name
                managementModeName: MANAGED
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

type ShuffleRoomAllocationInfo = {
    id: number;
    roomId: string;
    peopleRegistrantIds: string[];
    durationMinutes: number;
    startedAt: string;
};

async function allocateToExistingRoom(
    entries: UnallocatedShuffleQueueEntryFragment[],
    room: ShuffleRoomAllocationInfo,
    unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>
): Promise<void> {
    await apolloClient.mutate({
        mutation: AddPeopleToExistingShuffleRoomDocument,
        variables: {
            queueEntryIds: entries.map((x) => x.id),
            shuffleRoomId: room.id,
            roomPeople: entries.map((entry) => ({
                registrantId: entry.registrantId,
                roomId: room.roomId,
                personRoleName: Room_PersonRole_Enum.Participant,
            })),
        },
    });

    // Bwweerrr mutable state bwweerrr
    for (const entry of entries) {
        unallocatedQueueEntries.delete(entry.id);
        room.peopleRegistrantIds.push(entry.registrantId);
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
): Promise<ShuffleRoomAllocationInfo> {
    const managedRoom = await apolloClient.mutate({
        mutation: InsertManagedRoomDocument,
        variables: {
            capacity,
            name,
            conferenceId,
        },
    });

    if (!managedRoom.data?.insert_room_Room_one) {
        throw new Error("Could not insert a new managed room for shuffle space! Room came back null.");
    }

    const startedAt = new Date().toISOString();
    const shuffleRoom = await apolloClient.mutate({
        mutation: InsertShuffleRoomDocument,
        variables: {
            durationMinutes,
            reshuffleUponEnd,
            roomId: managedRoom.data.insert_room_Room_one.id,
            shufflePeriodId: periodId,
            startedAt,
        },
    });

    if (!shuffleRoom.data?.insert_room_ShuffleRoom_one?.id) {
        throw new Error("Could not insert a new shuffle room! ShuffleRoom came back null.");
    }

    const newRoom: ShuffleRoomAllocationInfo = {
        durationMinutes,
        id: shuffleRoom.data.insert_room_ShuffleRoom_one.id,
        roomId: managedRoom.data.insert_room_Room_one.id,
        startedAt,
        peopleRegistrantIds: [],
    };

    await allocateToExistingRoom(entries, newRoom, unallocatedQueueEntries);

    return newRoom;
}

/**
 * First-come, first-serve algorithm with optional auto-creation of rooms
 */
async function attemptToMatchEntry_FCFS(
    activePeriod: ActiveShufflePeriodFragment,
    entry: UnallocatedShuffleQueueEntryFragment,
    unallocatedQueueEntries: Map<number, UnallocatedShuffleQueueEntryFragment>,
    activeRooms: ShuffleRoomAllocationInfo[],
    allocateNewRooms: boolean
): Promise<boolean> {
    const now = Date.now();

    // 1. Attempt to find an existing room to allocate them to
    for (const room of activeRooms) {
        const duration = room.durationMinutes * 60 * 1000;
        const startedAt = Date.parse(room.startedAt);
        const endsAt = startedAt + duration;
        const timeRemaining = endsAt - now;
        if (timeRemaining > 0.5 * duration) {
            if (
                room.peopleRegistrantIds.length < activePeriod.targetRegistrantsPerRoom &&
                !room.peopleRegistrantIds.some((x) => x === entry.registrantId)
            ) {
                await allocateToExistingRoom([entry], room, unallocatedQueueEntries);
                return true;
            }
        }
    }

    // 2. Attempt to find other unallocated entries to match with
    if (allocateNewRooms) {
        // Take as many as possible to group them all together right away
        // (minus one to allow space for the entry we are processing!)
        //    * Sorted by id so oldest entries come first
        const entriesToAllocate = Array.from(unallocatedQueueEntries.values())
            .sort((x, y) => x.id - y.id)
            .filter((x) => x.id !== entry.id)
            .splice(0, activePeriod.targetRegistrantsPerRoom - 1);
        if (entriesToAllocate.length > 0) {
            const roomDuration = activePeriod.roomDurationMinutes * 60 * 1000;
            const periodEndsAt = Date.parse(activePeriod.endAt);
            const timeRemaining = periodEndsAt - (now + roomDuration);
            const reshuffleUponEnd = timeRemaining > 60 * 1000;
            const nowDate = new Date();
            const timeStr = `${nowDate.getUTCFullYear()}/${nowDate.getUTCMonth().toString().padStart(2, "0")}/${nowDate
                .getUTCDate()
                .toString()
                .padStart(2, "0")} ${nowDate.getUTCHours().toString().padStart(2, "0")}:${nowDate
                .getUTCMinutes()
                .toString()
                .padStart(2, "0")}`;
            activeRooms.push(
                await allocateToNewRoom(
                    activePeriod.id,
                    activePeriod.maxRegistrantsPerRoom + 1,
                    activePeriod.name + " room: " + timeStr,
                    activePeriod.conferenceId,
                    activePeriod.roomDurationMinutes,
                    reshuffleUponEnd,
                    [...entriesToAllocate, entry],
                    unallocatedQueueEntries
                )
            );
            return true;
        }
    }

    // 3. If waiting longer than max period, attempt to find overflow space
    const enteredAt = Date.parse(entry.created_at);
    const expiresAt = enteredAt + activePeriod.waitRoomMaxDurationSeconds * 1000;
    if (expiresAt < now) {
        for (const room of activeRooms) {
            const duration = room.durationMinutes * 60 * 1000;
            const startedAt = Date.parse(room.startedAt);
            const endsAt = startedAt + duration;
            const timeRemaining = endsAt - now;
            if (timeRemaining > 0.3 * duration) {
                if (
                    room.peopleRegistrantIds.length < activePeriod.maxRegistrantsPerRoom &&
                    !room.peopleRegistrantIds.some((x) => x === entry.registrantId)
                ) {
                    await allocateToExistingRoom([entry], room, unallocatedQueueEntries);
                    return true;
                }
            }
        }
    }

    // We failed to match :(
    console.info(
        `[This is not an error]: Unable to match shuffle queue entry: ${entry.id} (Probably not enough people online!)`
    );
    return false;
}

/**
 * First-come, first-serve algorithm with optional auto-creation of rooms
 */
async function attemptToMatchEntries(
    activePeriod: ActiveShufflePeriodFragment,
    entryIds: number[],
    activeRooms: ActiveShuffleRoomFragment[],
    allocateNewRooms: boolean
): Promise<void> {
    const unallocatedQueueEntries = new Map(activePeriod.unallocatedQueueEntries.map((x) => [x.id, x]));
    let rooms = activeRooms.map((room) => ({
        id: room.id,
        roomId: room.room.id,
        durationMinutes: room.durationMinutes,
        startedAt: room.startedAt,
        peopleRegistrantIds: room.room.people.map((x) => x.registrantId),
    }));
    for (const entryId of entryIds) {
        const entry = unallocatedQueueEntries.get(entryId);
        if (entry) {
            try {
                rooms = rooms.sort((x, y) => x.peopleRegistrantIds.length - y.peopleRegistrantIds.length);
                await attemptToMatchEntry_FCFS(activePeriod, entry, unallocatedQueueEntries, rooms, allocateNewRooms);
            } catch (e) {
                console.error(`Error processing queue entry. Entry: ${entry.id}`, e);
            }
        }
    }
}

async function processShufflePeriod(period: ActiveShufflePeriodFragment, entryIds: number[]) {
    const now = Date.now();
    const activeRooms = period.activeRooms.filter((shuffleRoom) => {
        const startedAt = Date.parse(shuffleRoom.startedAt);
        const duration = shuffleRoom.durationMinutes * 60 * 1000;
        return startedAt + duration >= now - 5000;
    });
    switch (period.algorithm) {
        case Room_ShuffleAlgorithm_Enum.Fcfs:
            await attemptToMatchEntries(period, entryIds, activeRooms, true);
            break;
        case Room_ShuffleAlgorithm_Enum.FcfsFixedRooms:
            await attemptToMatchEntries(period, entryIds, activeRooms, false);
            break;
        case Room_ShuffleAlgorithm_Enum.None:
            // Do nothing
            break;
        default:
            console.warn("Unable to process shuffle period: Unrecognised algorithm", period);
            break;
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
            `Shuffle period of the queue entry not found! Entry: ${entry.id}, Period: ${entry.shufflePeriodId}, Registrant: ${entry.registrantId}`
        );
    }
    const startAt = Date.parse(result.data.room_ShufflePeriod_by_pk.startAt);
    if (startAt < Date.now()) {
        await processShufflePeriod(result.data.room_ShufflePeriod_by_pk, [entry.id]);
    }
}

async function endRooms(period: ActiveShufflePeriodFragment): Promise<void> {
    try {
        const now = Date.now();
        const endedRooms = period.activeRooms.filter((shuffleRoom) => {
            const startedAt = Date.parse(shuffleRoom.startedAt);
            const duration = shuffleRoom.durationMinutes * 60 * 1000;
            return startedAt + duration < now - 5000;
        });
        await Promise.all(
            endedRooms.map(async (shuffleRoom) => {
                console.info(`Ending shuffle room: ${shuffleRoom.id}`);
                await Promise.all(
                    shuffleRoom.room.participants.map(async (participant) => {
                        try {
                            console.info(`Kicking shuffle room participant: ${participant.id} from ${shuffleRoom.id}`);
                            await kickRegistrantFromRoom(shuffleRoom.room.id, participant.registrantId);
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
                ids: endedRooms.map((x) => x.id),
            },
        });
    } catch (e) {
        console.error(`Failed to terminate shuffle rooms. Period: ${period.id}`, e);
    }
}

export async function processShuffleQueues(): Promise<void> {
    const now = Date.now();

    console.info("Shuffle rooms: Fetching");

    const result = await apolloClient.query({
        query: SelectActiveShufflePeriodsDocument,
        variables: {
            from: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
            until: new Date(now + 60 * 1000).toISOString(),
        },
    });

    console.info("Shuffle rooms: Matching entries and ending rooms");
    await Promise.all([
        ...result.data.room_ShufflePeriod.map(async (period) => {
            await endRooms(period);
            if (Date.parse(period.startAt) <= now && Date.parse(period.endAt) >= now + 30000) {
                await processShufflePeriod(
                    period,
                    period.unallocatedQueueEntries.map((x) => x.id)
                );
            }
        }),
    ]);

    console.info("Shuffle rooms: Done.");
}
