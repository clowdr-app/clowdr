import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import {
    IntermediaryContentData,
    JSONataToIntermediaryContent,
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
    $expectedHotCRPMissing := [
      "break",
      "welcome",
      "the road to a universal internet machine (demystifying blockchain protocols)",
      "robin milner award",
      "toward a programmable cloud: calm foundations and open challenges",
      "dynamical systems and program analysis",
      "structured social",
      "test of time award",
      "business meeting & townhall"
    ];
{
    "missing_from": {
        "researchr": [$hotCRPTitles[$not($ in $researchrTitles)]],
        "hotCRP": [$researchrTitles[$not($ in $hotCRPTitles or $ in $expectedHotCRPMissing)]]
    },
    "matching": [$hotCRPTitles[$ in $researchrTitles]],

    "researchrTitles": $researchrTitles,
    "hotCRPTitles": $hotCRPTitles
})
`;

const presetJSONata_UnknownQuery = `
{
    "originatingDatas": [],
    "groups": [],
    "hallways": [],
    "tags": [],
    "people": []
}
`;

const presetJSONata_ResearchrQuery_POPL2021 = "";

const presetJSONata_HotCRPQuery_POPL2021 = `
{
    "originatingDatas": [
        $[$exists(pid)].{
            "sourceId": $string(pid),
            "data": [{
                "sourceId": $string(pid),
                "originName": "HotCRP",
                "data": $
            }]
        }
    ],
    "groups": $.{
        "originatingDataSourceId": $string(pid),
        "title": title,
        "requiredItems": [
            {
                "typeName": "VIDEO_PREPUBLISH",
                "name": "Pre-published video",
                "originatingDataSourceId": $string(pid),
                "uploadsRemaining": 3,
                "uploaders": [
                    contacts.{
                        "email": email,
                        "name": first & ' ' & last
                    }
                ]
            },
            {
                "typeName": "VIDEO_BROADCAST",
                "name": "Livestream broadcast video",
                "originatingDataSourceId": $string(pid),
                "uploadsRemaining": 3,
                "uploaders": [
                    contacts.{
                        "email": email,
                        "name": first & ' ' & last
                    }
                ]
            }
        ]
        /* "people": [$@$people. */
        /*     authors#$personIdx.{ */
        /*         "name_affiliation": first & ' ' & last & ' (' & affiliation & ')', */
        /*         "role": "AUTHOR", */
        /*         "priority": $personIdx */
        /*     } */
        /* ] */
    },
    "people": [
        $.$@$group.**.authors.{
            "originatingDataSourceId": $string($group.pid),
            "email": email,
            "name": first & ' ' & last,
            "affiliation": affiliation
        }
    ]
}
`;

export default function ImportContentPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Import content to ${conference.shortName}`);
    useDashboardPrimaryMenuButtons();

    const [data, setData] = useState<ParsedData<any[]>[]>();
    const [intermediaryData, setIntermediaryData] = useState<Record<string, IntermediaryContentData>>({});

    const dataPanel = useMemo(() => <DataPanel onData={setData} />, []);
    const configPanel = useMemo(
        () =>
            data && (
                <ConfigPanel
                    data={data}
                    onChange={setIntermediaryData}
                    JSONataFunction={JSONataToIntermediaryContent}
                    presetJSONataXMLQuery={presetJSONata_ResearchrQuery_POPL2021}
                    presetJSONataJSONQuery={presetJSONata_HotCRPQuery_POPL2021}
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
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Box mb="auto" w="100%" minH="100vh">
                <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                    Manage {conference.shortName}
                </Heading>
                <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                    Import Content
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
