import { gql } from "@apollo/client";
import { Box, Heading, Spinner, Stat, StatGroup, StatHelpText, StatLabel, StatNumber, Text } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Permissions_Permission_Enum, useConferenceStatsQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";

gql`
    query ConferenceStats($id: uuid!) {
        conference_Conference_by_pk(id: $id) {
            completedRegistrationsStat {
                count
            }
            items(where: { totalViewsStat: {} }) {
                id
                title
                totalViewsStat {
                    totalViewCount
                }
                elements(
                    where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_PREPUBLISH, VIDEO_FILE] }, totalViewsStat: {} }
                ) {
                    id
                    name
                    totalViewsStat {
                        totalViewCount
                    }
                }
            }
            rooms(where: { _or: [{ managementModeName: { _eq: PUBLIC } }, { events: {} }] }) {
                id
                name
                presenceCounts {
                    created_at
                    count
                }
                stats {
                    created_at
                    hlsViewCount
                }
            }
        }
    }
`;

export default function AnalyticsDashboard(): JSX.Element {
    const conference = useConference();
    const statsResponse = useConferenceStatsQuery({
        variables: {
            id: conference.id,
        },
    });

    const title = useTitle(`Manage schedule of ${conference.shortName}`);

    const totalItemViews = useMemo(
        () =>
            R.sum(
                statsResponse.data?.conference_Conference_by_pk?.items.map(
                    (x) => x.totalViewsStat?.totalViewCount ?? 0
                ) ?? []
            ),
        [statsResponse.data?.conference_Conference_by_pk?.items]
    );

    const totalVideoPlaybacks = useMemo(
        () =>
            R.sum(
                statsResponse.data?.conference_Conference_by_pk?.items.map((x) =>
                    R.sum(x.elements.map((y) => y.totalViewsStat?.totalViewCount ?? 0))
                ) ?? []
            ),
        [statsResponse.data?.conference_Conference_by_pk?.items]
    );

    const totalStreamPlaybacks = useMemo(
        () =>
            R.sum(
                statsResponse.data?.conference_Conference_by_pk?.rooms.map((x) =>
                    R.sum(x.stats.map((y) => y.hlsViewCount))
                ) ?? []
            ),
        [statsResponse.data?.conference_Conference_by_pk?.rooms]
    );

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="2xl" fontStyle="italic">
                Analytics
            </Heading>
            <Text fontStyle="italic">Data updates every 24 hours.</Text>
            <StatGroup w="100%" maxW="2xl" pt={8}>
                <Stat>
                    <StatLabel fontSize="xl">Item views</StatLabel>
                    <StatNumber fontSize="4xl">
                        {statsResponse.data?.conference_Conference_by_pk ? totalItemViews : <Spinner />}
                    </StatNumber>
                    <StatHelpText>(3 seconds or more looking at an item.)</StatHelpText>
                </Stat>
                <Stat mx={8}>
                    <StatLabel fontSize="xl">Video playbacks</StatLabel>
                    <StatNumber fontSize="4xl">
                        {statsResponse.data?.conference_Conference_by_pk ? totalVideoPlaybacks : <Spinner />}
                    </StatNumber>
                    <StatHelpText>
                        (15 seconds or more watching a video;
                        <br /> excludes live-streams, includes recordings.)
                    </StatHelpText>
                </Stat>
                <Stat>
                    <StatLabel fontSize="xl">Live-stream playbacks</StatLabel>
                    <StatNumber fontSize="4xl">
                        {statsResponse.data?.conference_Conference_by_pk ? totalStreamPlaybacks : <Spinner />}
                    </StatNumber>
                    <StatHelpText>(15 seconds or more watching a live-stream.)</StatHelpText>
                </Stat>
            </StatGroup>
            <Box>&lt; More information will be coming soon &gt;</Box>
        </RequireAtLeastOnePermissionWrapper>
    );
}
