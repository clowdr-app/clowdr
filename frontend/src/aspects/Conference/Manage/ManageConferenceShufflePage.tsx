import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Divider,
    Flex,
    Heading,
    Spinner,
    Text,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Permissions_Permission_Enum, useManageShufflePeriods_SelectAllQuery } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import { useRealTime } from "../../Generic/useRealTime";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import CreateQueueModal from "./Shuffle/CreateQueueModal";
import ShuffleQueueTile from "./Shuffle/ShuffleQueueTile";

gql`
    fragment ManageShufflePeriods_ShufflePeriod on room_ShufflePeriod {
        id
        created_at
        updated_at
        conferenceId
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
        waitingEntries: queueEntries_aggregate(where: { allocatedShuffleRoomId: { _is_null: true } }) {
            aggregate {
                count
            }
        }
    }

    query ManageShufflePeriods_SelectAll($conferenceId: uuid!) {
        room_ShufflePeriod(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageShufflePeriods_ShufflePeriod
        }
    }
`;

export default function ManageConferenceShufflePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage shuffle queues at ${conference.shortName}`);

    const shufflePeriodsQ = useManageShufflePeriods_SelectAllQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 60000,
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
    });

    const now = useRealTime(60000);
    const pastQueues = useMemo(
        () => shufflePeriodsQ.data?.room_ShufflePeriod.filter((period) => Date.parse(period.endAt) < now),
        [now, shufflePeriodsQ.data?.room_ShufflePeriod]
    );
    const ongoingQueues = useMemo(
        () =>
            shufflePeriodsQ.data?.room_ShufflePeriod.filter(
                (period) => Date.parse(period.startAt) <= now && Date.parse(period.endAt) >= now
            ),
        [now, shufflePeriodsQ.data?.room_ShufflePeriod]
    );
    const upcomingQueues = useMemo(
        () => shufflePeriodsQ.data?.room_ShufflePeriod.filter((period) => Date.parse(period.startAt) > now),
        [now, shufflePeriodsQ.data?.room_ShufflePeriod]
    );

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageShuffle]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Shuffle Queues
            </Heading>
            <Text>Data is updated every 60s.</Text>
            {shufflePeriodsQ.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error loading shuffle queues</AlertTitle>
                    <AlertDescription>{shufflePeriodsQ.error.message}</AlertDescription>
                </Alert>
            ) : undefined}
            {!shufflePeriodsQ.error ? (
                shufflePeriodsQ.loading && !shufflePeriodsQ.data ? (
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
        </RequireAtLeastOnePermissionWrapper>
    );
}
