import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import type { IntermediaryContentData } from "@midspace/shared-types/import/intermediary";
import { JSONataToIntermediaryContent } from "@midspace/shared-types/import/intermediary";
import React, { useMemo, useState } from "react";
import PageNotFound from "../../../../Errors/PageNotFound";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import { useTitle } from "../../../../Utils/useTitle";
import RequireRole from "../../../RequireRole";
import { useConference } from "../../../useConference";
import ConfigPanel from "../Shared/ConfigPanel";
import DataPanel from "../Shared/DataPanel";
import ReviewPanel from "../Shared/ReviewPanel";
import MergePanel from "./MergePanel";

const defaultReviewQuery = "";

const presetJSONata_UnknownQuery = `
{
    "originatingDatas": [],
    "items": [],
    "exhibitions": [],
    "tags": [],
    "people": []
}
`;

const presetJSONata_CSVQuery_ProgramPeople = `
(
    $allV1 := $[
            $keys($)[$ = "Content Id"]
        and $trim($."Content Id") != ""
        and $trim($trim($."First Name") & ' ' & $trim($."Last Name")) != ""];
    $allV2 := $[
        $keys($)[$ = "Content Id 1"]
        and $trim($."Content Id 1") != ""
        and $trim($trim($."First Name") & ' ' & $trim($."Last Name")) != ""
    ]
        .$@$this
        .$keys($this)[
            $contains($, "Content Id") 
            and $trim($lookup($this, $)) != ""
        ].{
        "First Name": $this."First Name",
        "Last Name": $this."Last Name",
        "Affiliation": $this."Affiliation",
        "Email address": $this."Email address",
        "Role": $this."Role",
        "Content Id": $lookup($this, $)
    };
    $all := $append($allV1, $allV2);
    $distinctIds := $distinct($all."Content Id");
    {
        "originatingDatas": [$distinctIds.$@$ContentId.(
            $items := $all[$."Content Id" = $ContentId];
            {
                "sourceId": $ContentId,
                "data": [$items.{
                    "sourceId": $ContentId,
                    "originName": "People.csv",
                    "data": $
                }]
            }
        )],
        "items": [$distinctIds.$@$ContentId.(
            $people := $all[$."Content Id" = $ContentId];
            {
                "originatingDataSourceId": $ContentId,
                "people": [$people#$Priority.{
                    "name_affiliation": $trim($trim($."First Name") & ' ' & $trim($."Last Name")) & '¦' & ($."Affiliation" ? $trim($."Affiliation") : ''),
                    "role": $uppercase(Role),
                    "priority": $Priority
                }]
            }
        )],
        "exhibitions": [],
        "tags": [],
        "people": [$all.{
            "name": $trim($trim($."First Name") & ' ' & $trim($."Last Name")),
            "affiliation": Affiliation ? $trim(Affiliation) : "",
            "email": $trim($."Email address")
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
        "items": [$all.{
            "originatingDataSourceId": $."Content Id",
            "title": $trim(Title),
            "shortTitle": $trim($."Short title"),
            "typeName": $uppercase(Type) = "SESSION Q&A" ? "SESSION_Q_AND_A" : $uppercase(Type),
            "elements": [
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
                            "text": $."Abstract?"
                        }
                    }],
                    "uploadsRemaining": $."Is abstract uploadable" = "Yes" ? 3 : 0
                }
            ] 
            ~> $append($trim($."Link to webpage - name?") != "" ? [{
                "typeName": "PAPER_LINK",
                "isHidden": false,
                "name": $trim($."Link to webpage - name?"),
                "data": [{
                    "createdAt": $millis(),
                    "createdBy": "importer",
                    "data": {
                        "type": "PAPER_LINK",
                        "baseType": "link",
                        "text": $."Link to webpage - name?",
                        "url": $."Link to webpage - url?"
                    }
                }],
                "uploadsRemaining": 3
            }] : [])
            ~> $append($trim($."Link to PDF - name?") != "" ? [{
                "typeName": "PAPER_LINK",
                "isHidden": false,
                "name": $trim($."Link to PDF - name?"),
                "data": [{
                    "createdAt": $millis(),
                    "createdBy": "importer",
                    "data": {
                        "type": "PAPER_LINK",
                        "baseType": "link",
                        "text": $."Link to PDF - name?",
                        "url": $."Link to PDF - URL?"
                    }
                }],
                "uploadsRemaining": 3
            }] : [])
            ~> $append($trim($."Zoom URL?") != "" ? [{
                "typeName": "ZOOM",
                "isHidden": true,
                "name": "Zoom",
                "data": [{
                    "createdAt": $millis(),
                    "createdBy": "importer",
                    "data": {
                        "type": "ZOOM",
                        "baseType": "url",
                        "url": $."Zoom URL?"
                    }
                }],
                "uploadsRemaining": 3
            }] : [])
            ~> $append($trim($."Video 1 (Name)") != "" ? [{
                "typeName": "VIDEO_BROADCAST",
                "isHidden": false,
                "name": $trim($."Video 1 (Name)"),
                "data": [],
                "uploadsRemaining": 3
            }] : [])
            ~> $append($trim($."Video 2 (Name)") != "" ? [{
                "typeName": "VIDEO_BROADCAST",
                "isHidden": false,
                "name": $trim($."Video 2 (Name)"),
                "data": [],
                "uploadsRemaining": 3
            }] : [])
            ~> $append($trim($."Slides?") != "" ? [{
                "typeName": "PAPER_FILE",
                "isHidden": false,
                "name": $trim($."Slides?"),
                "data": [],
                "uploadsRemaining": 3
            }] : [])
            ~> $append($trim($."Uploadable PDF name?") != "" ? [{
                "typeName": "PAPER_FILE",
                "isHidden": false,
                "name": $trim($."Uploadable PDF name?"),
                "data": [],
                "uploadsRemaining": 3
            }] : []),
            "tagNames": ($."Tag 1?" and $trim($."Tag 1?") != "" ? [$trim($."Tag 1?")] : [])
            ~> $append($."Tag 2?" and $trim($."Tag 2?") != "" ? [$trim($."Tag 2?")] : [])
            ~> $append($."Tag 3?" and $trim($."Tag 3?") != "" ? [$trim($."Tag 3?")] : []),
            "exhibitionNames": ($."Exhibition?" != "" ? [$."Exhibition?"] : [])
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
    "items": [],
    "exhibitions": [],
    "tags": [$[$trim($.Name) != ""].{
        "name": $trim($.Name),
        "priority": $number($.Priority),
        "colour": $.Colour
    }],
    "people": []
}
`;

const presetJSONata_CSVQuery_Exhibitions = `
{
    "originatingDatas": [],
    "items": [],
    "exhibitions": [$[$trim($.Name) != ""].{
        "name": $trim($.Name),
        "priority": $number($.Priority),
        "colour": $.Colour,
        "isHidden": $.Hidden
    }],
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
    "items": $.{
        "originatingDataSourceId": $string(pid),
        "title": title,
        "uploadableElements": [
            {
                "typeName": "VIDEO_PREPUBLISH",
                "name": "Pre-published video",
                "originatingDataSourceId": $string(pid),
                "uploadsRemaining": 3,
            },
            {
                "typeName": "VIDEO_BROADCAST",
                "name": "Livestream broadcast video",
                "originatingDataSourceId": $string(pid),
                "uploadsRemaining": 3,
            }
        ]
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
                        } else if (name.endsWith("Exhibitions.csv")) {
                            return presetJSONata_CSVQuery_Exhibitions;
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
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Box mb="auto" w="100%" minH="100vh">
                <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                    Manage {conference.shortName}
                </Heading>
                <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
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
        </RequireRole>
    );
}
