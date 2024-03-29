import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Divider,
    Flex,
    Heading,
    Spinner,
    Text,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useManageShufflePeriods_SelectAllQuery } from "../../../../generated/graphql";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { makeContext } from "../../../GQL/make-context";
import usePolling from "../../../Hooks/usePolling";
import { useRealTime } from "../../../Hooks/useRealTime";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import CreateQueueModal from "./CreateQueueModal";
import ShuffleQueueTile from "./ShuffleQueueTile";

gql`
    fragment ManageShufflePeriods_ShufflePeriod on room_ShufflePeriod {
        id
        conferenceId
        subconferenceId
        created_at
        updated_at
        startAt
        endAt
        roomDurationMinutes
        targetRegistrantsPerRoom
        maxRegistrantsPerRoom
        waitRoomMaxDurationSeconds
        name
        organiserId
        algorithm
        completedEntries: queueEntries_aggregate(where: { shuffleRoom: { isEnded: { _eq: true } } }) {
            aggregate {
                count
            }
        }
        ongoingEntries: queueEntries_aggregate(where: { shuffleRoom: { isEnded: { _eq: false } } }) {
            aggregate {
                count
            }
        }
        waitingEntries: queueEntries_aggregate(
            where: { allocatedShuffleRoomId: { _is_null: true }, isExpired: { _eq: false } }
        ) {
            aggregate {
                count
            }
        }
    }

    query ManageShufflePeriods_SelectAll($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        room_ShufflePeriod(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }) {
            ...ManageShufflePeriods_ShufflePeriod
        }
    }
`;

export default function ManageShuffle(): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [shufflePeriodsQ, refetchShufflePeriodsQ] = useManageShufflePeriods_SelectAllQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        requestPolicy: "cache-and-network",
        context,
    });
    usePolling(refetchShufflePeriodsQ, 60000);

    const now = useRealTime(60000);
    const pastQueues = useMemo(
        () =>
            shufflePeriodsQ.data?.room_ShufflePeriod
                .filter((period) => Date.parse(period.endAt) < now)
                .sort((x, y) => Date.parse(x.startAt) - Date.parse(y.startAt)),
        [now, shufflePeriodsQ.data?.room_ShufflePeriod]
    );
    const ongoingQueues = useMemo(
        () =>
            shufflePeriodsQ.data?.room_ShufflePeriod
                .filter((period) => Date.parse(period.startAt) <= now && Date.parse(period.endAt) >= now)
                .sort((x, y) => Date.parse(x.startAt) - Date.parse(y.startAt)),
        [now, shufflePeriodsQ.data?.room_ShufflePeriod]
    );
    const upcomingQueues = useMemo(
        () =>
            shufflePeriodsQ.data?.room_ShufflePeriod
                .filter((period) => Date.parse(period.startAt) > now)
                .sort((x, y) => Date.parse(x.startAt) - Date.parse(y.startAt)),
        [now, shufflePeriodsQ.data?.room_ShufflePeriod]
    );

    return (
        <DashboardPage title="Networking">
            <Box>
                <Text mb={2}>Data is updated every 60s.</Text>
                {shufflePeriodsQ.error ? (
                    <Alert status="error">
                        <AlertIcon />
                        <AlertTitle>Error loading shuffle queues</AlertTitle>
                        <AlertDescription>{shufflePeriodsQ.error.message}</AlertDescription>
                    </Alert>
                ) : undefined}
                {!shufflePeriodsQ.error ? (
                    shufflePeriodsQ.fetching && !shufflePeriodsQ.data ? (
                        <Spinner label="Loading shuffle queues" />
                    ) : (
                        <>
                            <CreateQueueModal />
                            {ongoingQueues?.length ? (
                                <>
                                    <Divider />
                                    <Heading as="h3" fontSize="lg">
                                        Ongoing Queues
                                    </Heading>
                                    <Flex flexWrap="wrap" justifyContent="center">
                                        {ongoingQueues.map((queue) => (
                                            <ShuffleQueueTile key={queue.id} queue={queue} endLabel="Ends" />
                                        ))}
                                    </Flex>
                                </>
                            ) : undefined}
                            {upcomingQueues?.length ? (
                                <>
                                    <Divider />
                                    <Heading as="h3" fontSize="lg">
                                        Upcoming Queues
                                    </Heading>
                                    <Flex flexWrap="wrap" justifyContent="center">
                                        {upcomingQueues.map((queue) => (
                                            <ShuffleQueueTile key={queue.id} queue={queue} startLabel="Starts" />
                                        ))}
                                    </Flex>
                                </>
                            ) : undefined}
                            {pastQueues?.length ? (
                                <>
                                    <Divider />
                                    <Heading as="h3" fontSize="lg">
                                        Past Queues
                                    </Heading>
                                    <Flex flexWrap="wrap" justifyContent="center">
                                        {pastQueues.map((queue) => (
                                            <ShuffleQueueTile key={queue.id} queue={queue} endLabel="Ended" />
                                        ))}
                                    </Flex>
                                </>
                            ) : undefined}
                        </>
                    )
                ) : undefined}
            </Box>
        </DashboardPage>
    );
}
