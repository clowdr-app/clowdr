import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import {
    IntermediaryScheduleData,
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
            $timeFormat := "[Y0001]-[M01]-[D01]T[H01]:[m01] [Z]";
            $startAt := $."Start Time (UTC)" & ' ' & $timeZoneOffset;
            $endAt := $."End Time (UTC)" & ' ' & $timeZoneOffset;
            $startTime := $toMillis($startAt, $timeFormat);
            $endTime := $toMillis($endAt, $timeFormat);
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

                "intendedRoomModeName": $modeName,
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
    const reviewPanel = useMemo(() => <ReviewPanel data={intermediaryData} defaultQuery={defaultReviewQuery} />, [
        intermediaryData,
    ]);
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
