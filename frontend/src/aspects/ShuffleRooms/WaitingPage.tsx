import { gql } from "@apollo/client";
import {
    Box,
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redirect } from "react-router-dom";
import {
    Permission_Enum,
    PrefetchShuffleQueueEntryDataFragment,
    ShufflePeriodDataFragment,
    useGetShuffleRoomQuery,
    useGetShuffleRoomsParticipantsCountQuery,
    useJoinShuffleQueueMutation,
    useMyShuffleQueueEntrySubscription,
    useShufflePeriodsQuery,
} from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import RequireAtLeastOnePermissionWrapper from "../Conference/RequireAtLeastOnePermissionWrapper";
import { ConferenceInfoFragment, useConference } from "../Conference/useConference";
import useCurrentAttendee from "../Conference/useCurrentAttendee";
import { useRealTime } from "../Generic/useRealTime";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import { useNoPrimaryMenuButtons } from "../Menu/usePrimaryMenuButtons";

gql`
    fragment ShufflePeriodData on room_ShufflePeriod {
        id
        conferenceId
        endAt
        maxAttendeesPerRoom
        name
        queueEntries(distinct_on: [attendeeId], order_by: { attendeeId: asc, id: desc }) {
            ...PrefetchShuffleQueueEntryData
        }
        roomDurationMinutes
        startAt
        targetAttendeesPerRoom
        waitRoomMaxDurationSeconds
    }

    fragment PrefetchShuffleQueueEntryData on room_ShuffleQueueEntry {
        id
        attendeeId
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

    query ShufflePeriods($conferenceId: uuid!, $start: timestamptz!, $end: timestamptz!) {
        room_ShufflePeriod(
            where: { conferenceId: { _eq: $conferenceId }, startAt: { _lte: $start }, endAt: { _gte: $end } }
        ) {
            ...ShufflePeriodData
        }
    }

    mutation JoinShuffleQueue($shufflePeriodId: uuid!, $attendeeId: uuid!) {
        insert_room_ShuffleQueueEntry_one(object: { attendeeId: $attendeeId, shufflePeriodId: $shufflePeriodId }) {
            ...PrefetchShuffleQueueEntryData
        }
    }

    query GetShuffleRoomsParticipantsCount($conferenceId: uuid!) {
        RoomParticipant_aggregate(
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
            <Text>Ends in {Math.round((endAt - now) / (60 * 1000))} minutes</Text>
        ) : (
            <Text>Starts in {Math.round((startAt - now) / 1000)} seconds</Text>
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
                    <Box>
                        <Spinner />
                    </Box>
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
    const currentAttendee = useCurrentAttendee();
    const conference = useConference();

    const [joinShuffleQueueMutation, { loading: isJoiningMut, error: joinError }] = useJoinShuffleQueueMutation();
    useQueryErrorToast(joinError, false, "WaitingPage");
    const [isJoiningOverride, setIsJoiningOverride] = useState<boolean>(false);
    const isJoining = isJoiningOverride || isJoiningMut;
    const [isWaitingForAllocatedRoom, setIsWaitingForAllocatedRoom] = useState<boolean>(false);

    const ownQueueEntries = useMemo(
        () => period.queueEntries.filter((x) => x.attendeeId === currentAttendee.id).sort((x, y) => x.id - y.id),
        [currentAttendee.id, period.queueEntries]
    );

    const [lastEntry, setLastEntry] = useState<PrefetchShuffleQueueEntryDataFragment | null>(null);
    useEffect(() => {
        setLastEntry(ownQueueEntries.length > 0 ? ownQueueEntries[ownQueueEntries.length - 1] : null);
    }, [ownQueueEntries]);

    const joinShuffleQueue = useCallback(async () => {
        setIsJoiningOverride(true);
        const r = await joinShuffleQueueMutation({
            variables: {
                attendeeId: currentAttendee.id,
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
    }, [currentAttendee.id, joinShuffleQueueMutation, period.id]);

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
                    <Text>Ends in {Math.round((endAt - now) / (60 * 1000))} minutes</Text>
                ) : (
                    <Text>Starts in {Math.round((startAt - now) / 1000)} seconds</Text>
                );

            return (
                <>
                    <Button isLoading={isJoining} colorScheme="green" onClick={joinShuffleQueue}>
                        Join the queue
                    </Button>
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

function ShuffleRoomParticipantsCount(): JSX.Element {
    const conference = useConference();
    const count = useGetShuffleRoomsParticipantsCountQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 60000,
    });
    return typeof count.data?.RoomParticipant_aggregate?.aggregate?.count === "number" ? (
        <>
            {count.data.RoomParticipant_aggregate.aggregate.count} people actively participating in shuffle rooms at the
            moment.
            <br />
            (Updates every 60s - please help preserve our DB by not refreshing!)
        </>
    ) : (
        <>Loading active participant count</>
    );
}

export default function WaitingPage(): JSX.Element {
    const conference = useConference();

    const vars = useMemo(
        () => ({
            conferenceId: conference.id,
            start: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
        }),
        [conference.id]
    );

    const periods = useShufflePeriodsQuery({
        fetchPolicy: "network-only",
        variables: vars,
    });

    const data = useMemo(() => (periods.data?.room_ShufflePeriod ? [...periods.data.room_ShufflePeriod] : null), [
        periods.data?.room_ShufflePeriod,
    ]);

    useNoPrimaryMenuButtons();

    return periods.loading && !periods.data ? (
        <Spinner label="Loading shuffle room times" />
    ) : (
        <Grid maxW="800px" gap={4}>
            {data?.map((period) => (
                <ShufflePeriodBox key={period.id} period={period} />
            ))}
            <RequireAtLeastOnePermissionWrapper
                permissions={[
                    Permission_Enum.ConferenceManageSchedule,
                    Permission_Enum.ConferenceModerateAttendees,
                    Permission_Enum.ConferenceManageAttendees,
                ]}
            >
                <GridItem border="1px solid" borderColor="gray.500" borderRadius={10} p={4}>
                    <ShuffleRoomParticipantsCount />
                </GridItem>
            </RequireAtLeastOnePermissionWrapper>
            {!data?.length ? <GridItem>No shuffle spaces at the moment, please come back later.</GridItem> : undefined}
        </Grid>
    );
}
