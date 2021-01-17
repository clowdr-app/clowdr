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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ShufflePeriodDataFragment,
    useJoinShuffleQueueMutation,
    useShufflePeriodsQuery,
} from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { useConference } from "../Conference/useConference";
import useCurrentAttendee from "../Conference/useCurrentAttendee";
import { useRealTime } from "../Generic/useRealTime";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import usePrimaryMenuButtons from "../Menu/usePrimaryMenuButtons";

gql`
    fragment ShufflePeriodData on room_ShufflePeriod {
        id
        conferenceId
        endAt
        maxAttendeesPerRoom
        name
        queueEntries {
            id
            attendeeId
            created_at
            shuffleRoom {
                id
                isEnded
                roomId
            }
        }
        roomDurationMinutes
        startAt
        targetAttendeesPerRoom
        waitRoomMaxDurationSeconds
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
            id
        }
    }
`;

function ShufflePeriodBox({ period }: { period: ShufflePeriodDataFragment }): JSX.Element {
    const now = useRealTime(1000);
    const currentAttendee = useCurrentAttendee();
    const conference = useConference();

    const [joinShuffleQueueMutation, { loading: isJoiningMut, error: joinError }] = useJoinShuffleQueueMutation();
    useQueryErrorToast(joinError);
    const [isJoiningOverride, setIsJoiningOverride] = useState<number | null>(null);
    const isJoining = isJoiningOverride !== null || isJoiningMut;

    const joinShuffleQueue = useCallback(async () => {
        const r = await joinShuffleQueueMutation({
            variables: {
                attendeeId: currentAttendee.id,
                shufflePeriodId: period.id,
            },
        });
        setIsJoiningOverride(r.data?.insert_room_ShuffleQueueEntry_one?.id ?? null);
    }, [currentAttendee.id, joinShuffleQueueMutation, period.id]);

    const ownQueueEntries = useMemo(
        () => period.queueEntries.filter((x) => x.attendeeId === currentAttendee.id).sort((x, y) => x.id - y.id),
        [currentAttendee.id, period.queueEntries]
    );

    useEffect(() => {
        if (ownQueueEntries.length > 0) {
            const lastEntry = ownQueueEntries[ownQueueEntries.length - 1];
            setIsJoiningOverride((old) => (!lastEntry.shuffleRoom || lastEntry.id !== old ? null : old));
        }
    }, [ownQueueEntries]);

    const trackColour = useColorModeValue("gray.50", "gray.900");

    const numberOfQueued = useMemo(() => {
        return period.queueEntries.reduce((acc, x) => (!x.shuffleRoom ? acc + 1 : acc), 0);
    }, [period.queueEntries]);

    const numberInRooms = useMemo(() => {
        return period.queueEntries.reduce((acc, x) => (x.shuffleRoom && !x.shuffleRoom.isEnded ? acc + 1 : acc), 0);
    }, [period.queueEntries]);

    const button = useMemo(() => {
        const startAt = Date.parse(period.startAt);
        const endAt = Date.parse(period.endAt);
        const timeTextEl =
            startAt < now ? (
                <Text>Ends in {Math.round((endAt - now) / (60 * 1000))} minutes</Text>
            ) : (
                <Text>Starts in {Math.round((startAt - now) / 1000)} seconds</Text>
            );
        if (endAt - now < 0.1 * period.roomDurationMinutes * 60 * 1000) {
            return <Text>This shuffle period is coming to an end.</Text>;
        } else if (ownQueueEntries.length > 0) {
            const lastEntry = ownQueueEntries[ownQueueEntries.length - 1];
            if (startAt > now) {
                return (
                    <>
                        <Text>You are in the queue, please wait.</Text>
                        {timeTextEl}
                    </>
                );
            }

            if (lastEntry.shuffleRoom) {
                if (!lastEntry.shuffleRoom.isEnded) {
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
                        {numberOfQueued > 1 ? (
                            <Text>Please wait while we allocate rooms</Text>
                        ) : (
                            <Text>Please wait</Text>
                        )}
                    </>
                );
            }
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
    }, [
        conference.slug,
        isJoining,
        joinShuffleQueue,
        now,
        numberOfQueued,
        ownQueueEntries,
        period.endAt,
        period.roomDurationMinutes,
        period.startAt,
        period.waitRoomMaxDurationSeconds,
        trackColour,
    ]);

    const borderColour = useColorModeValue("gray.500", "gray.500");
    return (
        <GridItem border="1px solid" borderColor={borderColour} borderRadius={10}>
            <VStack w="100%" overflow="hidden" p={4} spacing={4}>
                <Heading as="h3" fontSize="lg">
                    {period.name}
                </Heading>
                {button}
                {numberOfQueued > 0 ? <Text>{numberOfQueued} people queued</Text> : undefined}
                {numberOfQueued > 0 ? <Text>{numberInRooms} in rooms</Text> : undefined}
            </VStack>
        </GridItem>
    );
}

export default function WaitingPage(): JSX.Element {
    const conference = useConference();
    const periods = useShufflePeriodsQuery({
        fetchPolicy: "network-only",
        skip: true
    });

    const now = useRealTime(3000);
    const [data, setData] = useState<ShufflePeriodDataFragment[] | null>(null);
    useEffect(() => {
        (async () => {
            const data = await periods.refetch({
                conferenceId: conference.id,
                start: new Date(now + 5 * 60 * 1000).toISOString(),
                end: new Date(now).toISOString(),
            });
            setData(data.data.room_ShufflePeriod ? [...data.data.room_ShufflePeriod] : null);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conference.id, now, periods.refetch]);

    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        setPrimaryMenuButtons([
            {
                key: "conference-home",
                action: `/conference/${conference.slug}`,
                text: conference.shortName,
                label: conference.shortName,
            },
        ]);
    }, [conference.shortName, conference.slug, setPrimaryMenuButtons]);

    return !data ? (
        <Spinner label="Loading shuffle room times" />
    ) : (
        <Grid maxW="800px">
            {data?.map((period) => (
                <ShufflePeriodBox key={period.id} period={period} />
            ))}
            {!data?.length ? <GridItem>No shuffle spaces at the moment.</GridItem> : undefined}
        </Grid>
    );
}
