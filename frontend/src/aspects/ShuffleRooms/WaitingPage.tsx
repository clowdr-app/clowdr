import { gql } from "@apollo/client";
import {
    Button,
    CircularProgress,
    CircularProgressLabel,
    Grid,
    GridItem,
    Heading,
    Spinner,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redirect } from "react-router-dom";
import {
    PrefetchShuffleQueueEntryDataFragment,
    ShufflePeriodDataFragment,
    useGetShuffleRoomQuery,
    useJoinShuffleQueueMutation,
    useMyShuffleQueueEntrySubscription,
    useShufflePeriodsQuery,
} from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { ConferenceInfoFragment, useConference } from "../Conference/useConference";
import useCurrentRegistrant from "../Conference/useCurrentRegistrant";
import { useRealTime } from "../Generic/useRealTime";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { useTitle } from "../Utils/useTitle";

gql`
    fragment ShufflePeriodData on room_ShufflePeriod {
        id
        conferenceId
        endAt
        maxRegistrantsPerRoom
        name
        queueEntries(distinct_on: [registrantId], order_by: { registrantId: asc, id: desc }) {
            ...PrefetchShuffleQueueEntryData
        }
        roomDurationMinutes
        startAt
        targetRegistrantsPerRoom
        waitRoomMaxDurationSeconds
    }

    fragment PrefetchShuffleQueueEntryData on room_ShuffleQueueEntry {
        id
        registrantId
        created_at
        updated_at
        shuffleRoom {
            id
            startedAt
            isEnded
            roomId
        }
    }

    fragment SubdShuffleQueueEntryData on room_ShuffleQueueEntry {
        id
        allocatedShuffleRoomId
    }

    subscription MyShuffleQueueEntry($id: bigint!) {
        room_ShuffleQueueEntry_by_pk(id: $id) {
            ...SubdShuffleQueueEntryData
        }
    }

    query GetShuffleRoom($id: bigint!) {
        room_ShuffleRoom_by_pk(id: $id) {
            id
            roomId
        }
    }

    query ShufflePeriods($conferenceId: uuid!, $end: timestamptz!) {
        room_ShufflePeriod(where: { conferenceId: { _eq: $conferenceId }, endAt: { _gte: $end } }) {
            ...ShufflePeriodData
        }
    }

    mutation JoinShuffleQueue($shufflePeriodId: uuid!, $registrantId: uuid!) {
        insert_room_ShuffleQueueEntry_one(object: { registrantId: $registrantId, shufflePeriodId: $shufflePeriodId }) {
            ...PrefetchShuffleQueueEntryData
        }
    }

    query GetShuffleRoomsParticipantsCount($conferenceId: uuid!) {
        room_Participant_aggregate(
            where: { conferenceId: { _eq: $conferenceId }, room: { shuffleRooms: { isEnded: { _eq: false } } } }
        ) {
            aggregate {
                count
            }
        }
    }
`;

function QueuedShufflePeriodBox({
    period,
    lastEntry,
    conference,
    isJoining,
    joinShuffleQueue,
    numberOfQueued,
    isWaitingForAllocatedRoom,
}: {
    period: ShufflePeriodDataFragment;
    lastEntry: PrefetchShuffleQueueEntryDataFragment;
    conference: ConferenceInfoFragment;
    isJoining: boolean;
    joinShuffleQueue: () => void;
    numberOfQueued: number;
    isWaitingForAllocatedRoom: boolean;
}): JSX.Element {
    const startAt = Date.parse(period.startAt);
    const endAt = Date.parse(period.endAt);

    const trackColour = useColorModeValue("gray.50", "gray.900");

    const liveEntry = useMyShuffleQueueEntrySubscription({
        skip: !isWaitingForAllocatedRoom,
        variables: {
            id: lastEntry.id,
        },
    });
    useQueryErrorToast(liveEntry.error, true, "WaitingPage:useMyShuffleQueueEntrySubscription");

    const allocatedShuffleRoom = useGetShuffleRoomQuery({
        skip: true,
    });
    useQueryErrorToast(allocatedShuffleRoom.error, false);

    const triggeredFetchRoom = useRef<boolean>(false);
    const [allocatedRoomId, setAllocatedRoomId] = useState<string | null>(null);
    useEffect(() => {
        if (!triggeredFetchRoom.current) {
            if (isWaitingForAllocatedRoom && liveEntry.data?.room_ShuffleQueueEntry_by_pk?.allocatedShuffleRoomId) {
                const id = liveEntry.data?.room_ShuffleQueueEntry_by_pk?.allocatedShuffleRoomId;
                setTimeout(async () => {
                    triggeredFetchRoom.current = true;
                    const data = await allocatedShuffleRoom.refetch({
                        id,
                    });
                    setAllocatedRoomId(data.data?.room_ShuffleRoom_by_pk?.roomId ?? null);
                }, 1000);
            }
        }
    }, [
        allocatedShuffleRoom,
        isWaitingForAllocatedRoom,
        liveEntry.data?.room_ShuffleQueueEntry_by_pk?.allocatedShuffleRoomId,
    ]);

    const now = useRealTime(1000);
    const timeTextEl =
        startAt < now ? (
            <Text>Ends {formatRelative(endAt, now)}</Text>
        ) : (
            <Text>Starts {formatRelative(startAt, now)}</Text>
        );

    if (startAt > now) {
        return (
            <>
                <Text>You are in the queue, please wait.</Text>
                {timeTextEl}
            </>
        );
    }

    if (
        isWaitingForAllocatedRoom &&
        liveEntry.data?.room_ShuffleQueueEntry_by_pk?.allocatedShuffleRoomId &&
        !isJoining
    ) {
        if (!allocatedRoomId) {
            return (
                <>
                    <Text>Loading allocated shuffle room information, please wait</Text>
                    <div>
                        <Spinner />
                    </div>
                </>
            );
        } else {
            return <Redirect to={`/conference/${conference.slug}/room/${allocatedRoomId}`} />;
        }
    } else if (lastEntry.shuffleRoom) {
        const intendedEnd =
            period.roomDurationMinutes * 60 * 1000 + new Date(lastEntry.shuffleRoom.startedAt).getTime();
        if (!lastEntry.shuffleRoom.isEnded && intendedEnd > now) {
            return (
                <>
                    <LinkButton
                        to={`/conference/${conference.slug}/room/${lastEntry.shuffleRoom.roomId}`}
                        colorScheme="green"
                        h="auto"
                        p={4}
                    >
                        <VStack>
                            <Text as="span">Go to your allocated room</Text>
                            <Text as="span">(Room {lastEntry.shuffleRoom.id})</Text>
                        </VStack>
                    </LinkButton>
                    <Button isLoading={isJoining} onClick={joinShuffleQueue}>
                        Rejoin the queue
                    </Button>
                    {timeTextEl}
                </>
            );
        } else {
            return (
                <>
                    <Button isLoading={isJoining} colorScheme="green" onClick={joinShuffleQueue}>
                        Join the queue
                    </Button>
                    {timeTextEl}
                </>
            );
        }
    } else {
        const joinedQueueAt = Date.parse(lastEntry.created_at);
        const timeWaiting = now - joinedQueueAt;
        const progress = (timeWaiting / (period.waitRoomMaxDurationSeconds * 1000)) * 100;
        const colour = progress < 50 ? "green.400" : progress < 75 ? "orange.400" : "red.400";
        const progressEl = (
            <CircularProgress
                capIsRound
                thickness={8}
                value={progress}
                size="100px"
                color={colour}
                trackColor={trackColour}
            >
                <CircularProgressLabel fontSize="sm">{Math.round(timeWaiting / 1000)}s</CircularProgressLabel>
            </CircularProgress>
        );
        if (timeWaiting > period.waitRoomMaxDurationSeconds * 1000) {
            return (
                <>
                    {progressEl}
                    <Text>Sorry, it may not be possible to match you with anyone at the moment.</Text>
                </>
            );
        }
        return (
            <>
                {progressEl}
                {numberOfQueued > 1 ? <Text>Please wait while we allocate rooms</Text> : <Text>Please wait</Text>}
            </>
        );
    }
}

function ShufflePeriodBox({ period }: { period: ShufflePeriodDataFragment }): JSX.Element {
    const now = useRealTime(1000);
    const currentRegistrant = useCurrentRegistrant();
    const conference = useConference();

    const [joinShuffleQueueMutation, { loading: isJoiningMut, error: joinError }] = useJoinShuffleQueueMutation();
    useQueryErrorToast(joinError, false, "WaitingPage");
    const [isJoiningOverride, setIsJoiningOverride] = useState<boolean>(false);
    const isJoining = isJoiningOverride || isJoiningMut;
    const [isWaitingForAllocatedRoom, setIsWaitingForAllocatedRoom] = useState<boolean>(false);

    const ownQueueEntries = useMemo(
        () => period.queueEntries.filter((x) => x.registrantId === currentRegistrant.id).sort((x, y) => x.id - y.id),
        [currentRegistrant.id, period.queueEntries]
    );

    const [lastEntry, setLastEntry] = useState<PrefetchShuffleQueueEntryDataFragment | null>(null);
    useEffect(() => {
        setLastEntry(ownQueueEntries.length > 0 ? ownQueueEntries[ownQueueEntries.length - 1] : null);
    }, [ownQueueEntries]);

    const joinShuffleQueue = useCallback(async () => {
        setIsJoiningOverride(true);
        const r = await joinShuffleQueueMutation({
            variables: {
                registrantId: currentRegistrant.id,
                shufflePeriodId: period.id,
            },
        });
        setLastEntry(r.data?.insert_room_ShuffleQueueEntry_one ?? null);
        setTimeout(() => {
            setIsWaitingForAllocatedRoom(true);
            setTimeout(() => {
                setIsJoiningOverride(false);
            }, 500);
        }, 500);
    }, [currentRegistrant.id, joinShuffleQueueMutation, period.id]);

    const numberOfQueued = useMemo(() => {
        return period.queueEntries.reduce((acc, x) => (!x.shuffleRoom ? acc + 1 : acc), 0);
    }, [period.queueEntries]);

    const numberInRooms = useMemo(() => {
        return period.queueEntries.reduce((acc, x) => (x.shuffleRoom && !x.shuffleRoom.isEnded ? acc + 1 : acc), 0);
    }, [period.queueEntries]);

    const queuedEntryBox = useMemo(() => {
        if (lastEntry) {
            return (
                <QueuedShufflePeriodBox
                    isWaitingForAllocatedRoom={isWaitingForAllocatedRoom}
                    conference={conference}
                    isJoining={isJoining}
                    joinShuffleQueue={joinShuffleQueue}
                    lastEntry={lastEntry}
                    numberOfQueued={numberOfQueued}
                    period={period}
                />
            );
        }
        return undefined;
    }, [conference, isJoining, isWaitingForAllocatedRoom, joinShuffleQueue, lastEntry, numberOfQueued, period]);

    const startAt = useMemo(() => Date.parse(period.startAt), [period.startAt]);
    const endAt = useMemo(() => Date.parse(period.endAt), [period.endAt]);

    const button = useMemo(() => {
        if (endAt - now < 0) {
            return <Text>This shuffle period has ended.</Text>;
        } else if (endAt - now < 0.1 * period.roomDurationMinutes * 60 * 1000) {
            return <Text>This shuffle period is coming to an end.</Text>;
        } else if (queuedEntryBox) {
            return queuedEntryBox;
        } else {
            const timeTextEl =
                startAt < now ? (
                    <Text>Ends {formatRelative(endAt, now)}</Text>
                ) : (
                    <Text>Starts {formatRelative(startAt, now)}</Text>
                );

            return (
                <>
                    {now > startAt - 5 * 60 * 1000 ? (
                        <Button isLoading={isJoining} colorScheme="green" onClick={joinShuffleQueue}>
                            Join the queue
                        </Button>
                    ) : undefined}
                    {timeTextEl}
                </>
            );
        }
    }, [endAt, isJoining, joinShuffleQueue, now, period.roomDurationMinutes, queuedEntryBox, startAt]);

    const borderColour = "gray.500";
    return (
        <GridItem border="1px solid" borderColor={borderColour} borderRadius={10}>
            <VStack w="100%" overflow="hidden" p={4} spacing={4}>
                <Heading as="h3" fontSize="lg">
                    {period.name}
                </Heading>
                {button}
                {numberOfQueued > 0 ? <Text>{numberOfQueued} people queued</Text> : undefined}
                {numberOfQueued > 0 ? <Text>{numberInRooms} allocated to rooms</Text> : undefined}
            </VStack>
        </GridItem>
    );
}

export default function WaitingPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle("Shuffle queues");

    const now = useMemo(() => new Date(), []);
    const vars = useMemo(
        () => ({
            conferenceId: conference.id,
            end: now.toISOString(),
        }),
        [conference.id, now]
    );

    const periods = useShufflePeriodsQuery({
        fetchPolicy: "network-only",
        variables: vars,
    });

    const data = useMemo(() => (periods.data?.room_ShufflePeriod ? [...periods.data.room_ShufflePeriod] : null), [
        periods.data?.room_ShufflePeriod,
    ]);

    const ongoingQueues = useMemo(() => data?.filter((x) => Date.parse(x.startAt) <= 5 * 60 * 1000 + now.getTime()), [
        data,
        now,
    ]);
    const upcomingQueues = useMemo(
        () =>
            data
                ? R.sortBy(
                      (x) => Date.parse(x.startAt),
                      data.filter((x) => Date.parse(x.startAt) > 5 * 60 * 1000 + now.getTime())
                  )
                : undefined,
        [data, now]
    );

    return (
        <>
            {title}
            {periods.loading && !periods.data ? (
                <Spinner label="Loading shuffle room times" />
            ) : (
                <Grid maxW="800px" gap={4}>
                    {ongoingQueues?.map((period) => (
                        <ShufflePeriodBox key={period.id} period={period} />
                    ))}
                    {!ongoingQueues?.length ? (
                        <GridItem>No active shuffle spaces at the moment, please come back later.</GridItem>
                    ) : undefined}
                    {upcomingQueues && upcomingQueues.length > 0 ? (
                        <ShufflePeriodBox key={upcomingQueues[0].id} period={upcomingQueues[0]} />
                    ) : undefined}
                </Grid>
            )}
        </>
    );
}
