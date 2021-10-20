import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import type {
    IntermediaryScheduleData} from "@clowdr-app/shared-types/build/import/intermediary";
import {
    JSONataToIntermediarySchedule,
} from "@clowdr-app/shared-types/build/import/intermediary";
import React, { useMemo, useState } from "react";
import { Permissions_Permission_Enum } from "../../../../../generated/graphql";
import PageNotFound from "../../../../Errors/PageNotFound";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import { useTitle } from "../../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../../useConference";
import ConfigPanel from "../Shared/ConfigPanel";
import DataPanel from "../Shared/DataPanel";
import ReviewPanel from "../Shared/ReviewPanel";
import MergePanel from "./MergePanel";

const defaultReviewQuery = `
`;

const presetJSONata_UnknownQuery = `
`;

const presetJSONata_ScheduleCSVQuery = `
(
    $all := $[$not($."Event Id" = "")];
    $roomNames := $distinct($all."Room Name");
    {
        "rooms": [$roomNames.{ "name": $ }],
        "events": [$all.(
            $timeZoneOffset := '+00:00';

            /* Without seconds */
            $timeFormat1 := "[Y0001]-[M01]-[D01]T[H01]:[m01] [Z]";
            $startAt1 := $."Start Time" & ' ' & $timeZoneOffset;
            $endAt1 := $."End Time" & ' ' & $timeZoneOffset;
            $startTime1 := $toMillis($startAt1, $timeFormat1);
            $endTime1 := $toMillis($endAt1, $timeFormat1);

            /* With seconds */
            $timeFormat2 := "[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01] [Z]";
            $startAt2 := $."Start Time" & ' ' & $timeZoneOffset;
            $endAt2 := $."End Time" & ' ' & $timeZoneOffset;
            $startTime2 := $toMillis($startAt2, $timeFormat2);
            $endTime2 := $toMillis($endAt2, $timeFormat2);

            $startTime := $startTime1 ? $startTime1 : $startTime2;
            $endTime := $endTime1 ? $endTime1 : $endTime2;

            $durationSeconds := ($endTime - $startTime) / 1000;
            $roomName := $."Room Name";
            $modeName := $.Mode ~> $uppercase ~> $replace(/ /, "_");
            $name := $."Event Name";
            {
                "originatingDataSourceId": $."Event Id",
                "startAt": $startAt,
                "endAt": $endAt,
                "startTime": $startTime,
                "durationSeconds": $durationSeconds,

                "intendedRoomModeName": $modeName = "QANDA" ? "Q_AND_A" : $modeName,
                "name": $name,
                "itemSourceId": $."Content Id",
                "exhibitionName": $."Exhibition Name",

                "roomName": $roomName
            }
        )],
        "originatingDatas": [$all.(
            {
                "sourceId": $."Event Id",
                "data": [{
                    "sourceId": $."Event Id",
                    "originName": "Schedule.csv",
                    "data": $
                }]
            }
        )]
    }
)
`;

export default function ImportSchedulePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Import schedule to ${conference.shortName}`);

    const [data, setData] = useState<ParsedData<any[]>[]>();
    const [intermediaryData, setIntermediaryData] = useState<Record<string, IntermediaryScheduleData>>({});

    const dataPanel = useMemo(() => <DataPanel onData={setData} />, []);
    const configPanel = useMemo(
        () =>
            data && (
                <ConfigPanel
                    data={data}
                    onChange={setIntermediaryData}
                    JSONataFunction={JSONataToIntermediarySchedule}
                    presetJSONataCSVQuery={(name) => {
                        if (name.endsWith("Schedule.csv")) {
                            return presetJSONata_ScheduleCSVQuery;
                        }
                        return presetJSONata_UnknownQuery;
                    }}
                    presetJSONataUnknownFileTypeQuery={presetJSONata_UnknownQuery}
                />
            ),
        [data]
    );
    const reviewPanel = useMemo(
        () => <ReviewPanel data={intermediaryData} defaultQuery={defaultReviewQuery} />,
        [intermediaryData]
    );
    const mergePanel = useMemo(() => <MergePanel data={intermediaryData} />, [intermediaryData]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Box mb="auto" w="100%" minH="100vh">
                <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                    Manage {conference.shortName}
                </Heading>
                <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                    Import Schedule
                </Heading>
                <Tabs defaultIndex={0} w="100%">
                    <TabList>
                        <Tab>Data</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Configure</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Review</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Merge</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>{dataPanel}</TabPanel>
                        <TabPanel>{configPanel}</TabPanel>
                        <TabPanel>{reviewPanel}</TabPanel>
                        <TabPanel>{mergePanel}</TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </RequireAtLeastOnePermissionWrapper>
    );
}
