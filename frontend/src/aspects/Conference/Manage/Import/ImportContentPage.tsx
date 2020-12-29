import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import type { IntermediaryContentData } from "@clowdr-app/shared-types/build/import/intermediary";
import React, { useMemo, useState } from "react";
import { Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import type { ParsedData } from "../../../Files/useCSVJSONXMLParser";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import useDashboardPrimaryMenuButtons from "../useDashboardPrimaryMenuButtons";
import MergePanel from "./Content/MergePanel";
import ConfigPanel from "./Shared/ConfigPanel";
import DataPanel from "./Shared/DataPanel";
import ReviewPanel from "./Shared/ReviewPanel";

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

// TODO: Originating datas
const presetJSONata_ResearchrQuery_POPL2021 = `
{
    "groups": $.$@$session.timeslot[event_id].(
        $roomName := $trim($split($session.room._text, "|")[-1]);
        $tagNames := [$session.tracks.track._text.$trim($)];
        {
        "originatingDataSourceId": slot_id._text,
        "title": $contains(title._text, /^Structured Social$/i) ? "Structured Social" : $contains(title._text, /^Unstructured Social$/i) ? "Social Time" : title._text,
        "typeName": $roomName = "Break" or title._text = "Break" ? "OTHER" : $roomName = "POPL" ? "KEYNOTE" : $roomName = "POPL-A" or $roomName = "POPL-B" ? "PAPER" : "WORKSHOP",
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
                        "text": description.(_text="undefined" ? "" : _text)
                    }
                }],
                "originatingDataSourceId": slot_id._text
            },
            ($roomName != "Break" and title._text != "Break" and $roomName != "POPL" and $roomName != "POPL-A" and $roomName != "POPL-B" 
                ? {
                    "typeName": "ZOOM",
                    "isHidden": false,
                    "name": "Zoom",
                    "data": [{
                        "createdAt": $millis(),
                        "createdBy": "importer",
                        "data": {
                            "type": "ZOOM",
                            "baseType": "url",
                            "url": "<Not configured>"
                        }
                    }],
                    "originatingDataSourceId": slot_id._text
                }
                : undefined)
        ],
        "tagNames": $tagNames,
        "people": $append(persons.person[role._text = "Author"].{
            "personId": person_id._text,
            "name_affiliation": first_name._text & ' ' & last_name._text & ' (' & affiliation._text & ')',
            "role": $uppercase(role._text),
            "priority": sort_key._text
        }, $append(persons.person[role._text != "Author" and role._text != "Session Chair"].{
            "personId": person_id._text,
            "name_affiliation": first_name._text & ' ' & last_name._text & ' (' & affiliation._text & ')',
            "role": "PRESENTER",
            "priority": sort_key._text
        },[$session.timeslot.persons.person[role._text="Session Chair" or role._text="Event Chair" or role._text="Chair"].
                {
                    "personId": person_id._text,
                    "name_affiliation": first_name._text & ' ' & last_name._text & ' (' & affiliation._text & ')',
                    "role": "CHAIR",
                    "priority": sort_key._text
                }
        ])),
        "hallways": []
    }),
    "people": $.**.person.{
        "originatingDataSourceId": person_id._text,
        "name": first_name._text & ' ' & last_name._text,
        "affiliation": affiliation._text
        /* "pictureURL": picture_url._text, */
        /* "homepageURL": homepage_url._text, */
        /* "bio": bio._text */
    },
    "tags": ($tags := $distinct($.**.tracks.track._text); $tags.{ "name": $ }),
    "originatingDatas": $append([
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
    ], [
        $.**.person.{
            "sourceId": person_id._text,
            "data": [
                {
                    "sourceId": person_id._text,
                    "originName": "Researchr",
                    "data": $
                }
            ]
        }
    ])
}
`;

// TODO: Originating datas
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
