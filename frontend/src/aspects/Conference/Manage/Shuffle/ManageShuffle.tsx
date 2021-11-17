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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useManageShufflePeriods_SelectAllQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import usePolling from "../../../Generic/usePolling";
import { useRealTime } from "../../../Generic/useRealTime";
import { makeContext } from "../../../GQL/make-context";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";
import CreateQueueModal from "./CreateQueueModal";
import ShuffleQueueTile from "./ShuffleQueueTile";

gql`
    fragment ManageShufflePeriods_ShufflePeriod on room_ShufflePeriod {
        id
        conferenceId
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
        waitingEntries: queueEntries_aggregate(
            where: { allocatedShuffleRoomId: { _is_null: true }, isExpired: { _eq: false } }
        ) {
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

export default function ManageShuffle(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage shuffle queues at ${conference.shortName}`);

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.SubconferenceOrganizer,
            }),
        []
    );
    const [shufflePeriodsQ, refetchShufflePeriodsQ] = useManageShufflePeriods_SelectAllQuery({
        variables: {
            conferenceId: conference.id,
        },
        requestPolicy: "cache-and-network",
        context,
    });
    usePolling(refetchShufflePeriodsQ, 60000);

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
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Heading mt={4} as="h1" fontSize="2.3rem" lineHeight="3rem">
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
        </RequireRole>
    );
}
