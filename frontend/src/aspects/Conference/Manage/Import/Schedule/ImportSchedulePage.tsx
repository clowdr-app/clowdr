import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import {
    IntermediaryScheduleData,
    JSONataToIntermediarySchedule,
} from "@clowdr-app/shared-types/build/import/intermediary";
import React, { useMemo, useState } from "react";
import { Permission_Enum } from "../../../../../generated/graphql";
import PageNotFound from "../../../../Errors/PageNotFound";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import { useTitle } from "../../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../../useConference";
import useDashboardPrimaryMenuButtons from "../../useDashboardPrimaryMenuButtons";
import ConfigPanel from "../Shared/ConfigPanel";
import DataPanel from "../Shared/DataPanel";
import ReviewPanel from "../Shared/ReviewPanel";
import MergePanel from "./MergePanel";

const defaultReviewQuery = `
(
    $researchrPapers := $.'2020-12-25 - Researchr.xml'.groups;
    $hotCRPPapers := $.'popl21-data-2.json'.groups;
    $researchrTitles := $distinct([$researchrPapers ["Research Papers" in tagNames].$lowercase(title)]);
    $hotCRPTitles := $distinct([$hotCRPPapers.$lowercase(title)]);
{
    "researchrTitles": $researchrTitles,
    "hotCRPTitles": $hotCRPTitles
})
`;

const presetJSONata_UnknownQuery = `
{
    TODO
}
`;

const presetJSONata_ResearchrQuery_POPL2021 = `
{
    "rooms": ($rooms := $distinct($.**.room.$match(_text, /[^|]*\\| ?(.*)/).groups[0]); $rooms.{
        "name": $
    }),
    "events": $.$@$session.timeslot[event_id].(
        $timeZoneOffset := '+01:00';
        $timeFormat := "[Y0001]/[M01]/[D01]T[H01]:[m01] [Z]";
        $startAt := date._text & 'T' & start_time._text & ' ' & $timeZoneOffset;
        $endAt := end_date._text & 'T' & end_time._text & ' ' & $timeZoneOffset;
        $startTime := $toMillis($startAt, $timeFormat);
        $endTime := $toMillis($endAt, $timeFormat);
        $reprintedStartAtUTC := $fromMillis($startTime);
        $roomName := $match(room._text, /[^|]*\\| ?(.*)/).groups[0];
        $durationSeconds := ($endTime - $startTime) / 1000;
        [{
        "originatingDataSourceId": event_id._text,
        "startAt": $startAt,
        "endAt": $endAt,
        "startAt_Reprinted_UTC": $reprintedStartAtUTC,
        "startTime": $startTime,
        "durationSeconds": $roomName = "POPL-A" or $roomName = "POPL-B" ? $durationSeconds / 2 : $durationSeconds,

        "contentGroupSourceId": slot_id._text,
        "intendedRoomModeName": 
            $roomName = "Break" or title._text = "Break" ? "BREAKOUT" 
            : $roomName = "POPL-A" or $roomName = "POPL-B" ? "PRERECORDED"
            : $roomName = "POPL" ? "PRESENTATION" 
            : "BREAKOUT",
        "name": 
            $roomName = "Break" or title._text = "Break" ? "Social" 
            : $roomName = "POPL-A" or $roomName = "POPL-B" ? "Pre-recorded"
            : $roomName = "POPL" ? "Live presentation" 
            : "Breakout",

        "roomName": $roomName,
        "tagNames": [$session.tracks.track._text],

        "people": [
            $session.timeslot.persons.person[role._text="Session Chair" or role._text="Event Chair" or role._text="Chair"].
                {
                    "name": $trim(first_name._text & ' ' & last_name._text),
                    "affiliation": affiliation._text,
                    "roleName": "CHAIR"
                }
        ]
    },
    ($not($roomName = "Break" or title._text = "Break") and ($roomName = "POPL-A" or $roomName = "POPL-B") ? {
        "originatingDataSourceId": event_id._text,
        "startAt": $startAt,
        "endAt": $endAt,
        "startAt_Reprinted_UTC": $reprintedStartAtUTC,
        "startTime": $startTime + (1000 * ($durationSeconds / 2)),
        "durationSeconds": $durationSeconds / 2,

        "contentGroupSourceId": slot_id._text,
        "intendedRoomModeName": "Q_AND_A",
        "name": "Q&A",

        "roomName": $roomName,
        "tagNames": [$session.tracks.track._text],

        "people": [
            $session.timeslot.persons.person[role._text="Session Chair" or role._text="Event Chair" or role._text="Chair"].
                {
                    "name": $trim(first_name._text & ' ' & last_name._text),
                    "affiliation": affiliation._text,
                    "roleName": "CHAIR"
                }
        ]
    } : undefined)]),
    "tags": ($tags := $distinct($.**.tracks.track._text); $tags.{ "name": $ }),
    "originatingDatas": [
        $.*[$exists(slot_id)].$@$event.{
            "sourceId": slot_id._text,
            "data": [
                {
                    "sourceId": slot_id._text,
                    "originName": "Researchr",
                    "data": $
                }
            ]
        }
    ]
}
`;

// TODO: At some point in the future, import sessions from Researchr
//
// "sessions": $.{
//     "originatingDataSourceId": subevent_id._text,
//     "title": title._text,
//     "researchrLink": { "url": url._text, "label": url_link_display._text },
//     "roomName": $match(room._text, /[^|]*\\| ?(.*)/).groups[0],
//     "chair":
//         timeslot[$not($exists(event_id))].persons.person[role._text="Session Chair"].
//             {
//                 "name": $trim(first_name._text & ' ' & last_name._text),
//                 "affiliation": affiliation._text
//             }
// }

export default function ImportSchedulePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Import schedule to ${conference.shortName}`);
    useDashboardPrimaryMenuButtons();

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
                    presetJSONataXMLQuery={presetJSONata_ResearchrQuery_POPL2021}
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
            permissions={[Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Box mb="auto" w="100%" minH="100vh">
                <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                    Manage {conference.shortName}
                </Heading>
                <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
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
