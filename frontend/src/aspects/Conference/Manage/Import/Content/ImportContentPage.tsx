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
import ConfigPanel from "../Shared/ConfigPanel";
import DataPanel from "../Shared/DataPanel";
import ReviewPanel from "../Shared/ReviewPanel";
import MergePanel from "./MergePanel";

const defaultReviewQuery = "";

const presetJSONata_UnknownQuery = `
{
    "originatingDatas": [],
    "groups": [],
    "exhibitions": [],
    "tags": [],
    "people": []
}
`;

const presetJSONata_CSVQuery_ProgramPeople = `
(
    $all := $[$not($."Content Id" = "")];
    $distinctIds := $distinct($all."Content Id");
    {
        "originatingDatas": [$distinctIds.$@$ContentId.(
            $items := $all[$."Content Id" = $ContentId];
            {
                "sourceId": $ContentId,
                "data": [$items.{
                    "sourceId": $ContentId,
                    "originName": "Content People.csv",
                    "data": $
                }]
            }
        )],
        "groups": [$distinctIds.$@$ContentId.(
            $people := $all[$."Content Id" = $ContentId];
            {
                "originatingDataSourceId": $ContentId,
                "people": [$people#$Priority.{
                    "name_affiliation": $."First Name" & ' ' & $."Last Name" & ' (' & $."Affiliation" & ')',
                    "role": $uppercase(Role),
                    "priority": $Priority
                }]
            }
        )],
        "exhibitions": [],
        "tags": [],
        "people": [$all.{
            "name": $."First Name" & ' ' & $."Last Name",
            "affiliation": Affiliation,
            "email": $."Email address"
        }]
    }
)
`;

const presetJSONata_CSVQuery_Content = `
(
    $all := $[$not($."Content Id" = "")];
    {
        "originatingDatas": [$all.{
            "sourceId": $."Content Id",
            "data": [{
                "sourceId": $."Content Id",
                "originName": "Content.csv",
                "data": $
            }]
        }],
        "groups": [$all.{
            "originatingDataSourceId": $."Content Id",
            "title": Title,
            "shortTitle": $."Short title",
            "typeName": $uppercase(Type),
            "items": [
                {
                    "typeName": "ABSTRACT",
                    "isHidden": false,
                    "name": "Abstract",
                    "data": [{
                        "createdAt": $millis(),
                        "createdBy": "importer",
                        "data": {
                            "type": "ABSTRACT",
                            "baseType": "text",
                            "text": Abstract
                        }
                    }]
                }
            ] 
            ~> $append($."Link to webpage - Text" != "" ? [{
                "typeName": "PAPER_LINK",
                "isHidden": false,
                "name": "Link to webpage",
                "data": [{
                    "createdAt": $millis(),
                    "createdBy": "importer",
                    "data": {
                        "type": "PAPER_LINK",
                        "baseType": "link",
                        "text": $."Link to webpage - Text",
                        "url": $."Link to webpage - URL"
                    }
                }]
            }] : [])
            ~> $append($."Link to PDF - Text" != "" ? [{
                "typeName": "PAPER_LINK",
                "isHidden": false,
                "name": "Link to PDF",
                "data": [{
                    "createdAt": $millis(),
                    "createdBy": "importer",
                    "data": {
                        "type": "PAPER_LINK",
                        "baseType": "link",
                        "text": $."Link to PDF - Text",
                        "url": $."Link to PDF - URL"
                    }
                }]
            }] : [])
            ~> $append($."Zoom URL" != "" ? [{
                "typeName": "ZOOM",
                "isHidden": false,
                "name": "Zoom",
                "data": [{
                    "createdAt": $millis(),
                    "createdBy": "importer",
                    "data": {
                        "type": "ZOOM",
                        "baseType": "url",
                        "url": $."Zoom URL"
                    }
                }]
            }] : []),
            "uploadableItems": ($."Uploadable video for pre-publication" != "" ? [{
                "typeName": "VIDEO_PREPUBLISH",
                "name": $."Uploadable video for pre-publication",
                "uploadsRemaining": 3
            }] : [])
            ~> $append($."Uploadable video for broadcast" != "" ? [{
                "typeName": "VIDEO_BROADCAST",
                "name": $."Uploadable video for broadcast",
                "uploadsRemaining": 3
            }] : [])
            ~> $append($."Uploadable slides" != "" ? [{
                "typeName": "PAPER_FILE",
                "name": $."Uploadable slides",
                "uploadsRemaining": 3
            }] : [])
            ~> $append($."Uploadable PDF" != "" ? [{
                "typeName": "PAPER_FILE",
                "name": $."Uploadable PDF",
                "uploadsRemaining": 3
            }] : []),
            "tagNames": ($."Tag 1" != "" ? [$."Tag 1"] : [])
            ~> $append($."Tag 2" != "" ? [$."Tag 2"] : [])
            ~> $append($."Tag 3" != "" ? [$."Tag 3"] : [])
        }],
        "exhibitions": [],
        "tags": [],
        "people": []
    }
)
`;

const presetJSONata_CSVQuery_Tags = `
{
    "originatingDatas": [],
    "groups": [],
    "exhibitions": [],
    "tags": [$.{
        "name": $.Name,
        "colour": $.Colour
    }],
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
        "uploadableItems": [
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
                    presetJSONataCSVQuery={(name) => {
                        if (name.endsWith("People.csv")) {
                            return presetJSONata_CSVQuery_ProgramPeople;
                        } else if (name.endsWith("Content.csv")) {
                            return presetJSONata_CSVQuery_Content;
                        } else if (name.endsWith("Tags.csv")) {
                            return presetJSONata_CSVQuery_Tags;
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
