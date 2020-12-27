import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Select,
    Textarea,
} from "@chakra-ui/react";
import { IntermediaryData, JSONataToIntermediary } from "@clowdr-app/shared-types/build/import/intermediary";
import React, { useEffect, useState } from "react";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import type { ParsedContentData } from "./DataPanel";

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
    "tags": ($tags := $distinct($.**.tracks.track._text); $tags.{ "name": $ })
}
`;

// TODO: Originating datas
const presetJSONata_HotCRPQuery_POPL2021 = `
{
    "groups": $.{
        "originatingDataSourceId": $string(pid),
        "title": title,
        "requiredItems": [
            {
                "typeName": "VIDEO_PREPUBLISH",
                "name": "Pre-published video",
                "originatingDataSourceId": slot_id._text,
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
                "originatingDataSourceId": slot_id._text,
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
        $.**.authors.{
            "email": email,
            "name": first & ' ' & last,
            "affiliation": affiliation
        }
    ]
}
`;

// TODO: Save this lot for Schedule import configuration
//
// "rooms": ($rooms := $distinct($.**.room.$match(_text, /[^|]*\\| ?(.*)/).groups[0]); $rooms.{"name": $}),
// "events": $.$@$session.timeslot[event_id].{
//     "originatingDataSourceId": $.event_id._text,
//     "itemId": $.slot_id._text,
//     "startAt": $.date._text & 'T' & $.start_time._text,
//     "endAt": $.end_date._text & 'T' & $.end_time._text,

//     "roomName": $match(room._text, /[^|]*\\| ?(.*)/).groups[0],
//     "tagNames": $session.tracks.track._text,

//     "chairs":
//         $session.timeslot.persons.person[role._text="Session Chair" or role._text="Event Chair" or role._text="Chair"].
//             {
//                 "name": $trim(first_name._text & ' ' & last_name._text),
//                 "affiliation": affiliation._text
//             }
// },
// "sessions": $.{
//     "originatingDataSourceId": subevent_id._text,
//     "title": title._text,
//     "researchrLink": { "url": url._text, "label": url_link_display._text },
//     "roomName": $match(room._text, /[^|]*\\| ?(.*)/).groups[0],
//     "chair":
//         timeslot[$not($exists($.event_id))].persons.person[role._text="Session Chair"].
//             {
//                 "name": $trim(first_name._text & ' ' & last_name._text),
//                 "affiliation": affiliation._text
//             }
// }

export default function ConfigPanel({
    data,
    onChange,
}: {
    data: ParsedData<ParsedContentData>[];
    onChange?: (data: Record<string, IntermediaryData>) => void;
}): JSX.Element {
    // * For each file, setup the JSONata queries to output exactly the types we need
    // * JSONata:
    //   http://docs.jsonata.org/overview   ---   https://try.jsonata.org/
    // * Create default mappings for HotCRP and Researchr
    // * Can the entire remapping be done as a giant JSONata query for now? Yes!

    /*
OriginatingDataPart = {
    originName: "Researchr" | "HotCRP" | string;
    data: any;
};

OriginatingDataDescriptor = {
    id: string;
    sourceId: string;
    data: OriginatingDataPart[];
};

UploaderDescriptor = {
    id: string;
    email: string;
    emailsSentCount: number;
    name: string;
    requiredContentItemId: string;
};

ContentPersonDescriptor = {
    email?: string | null;
};
    */
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
    useEffect(() => {
        setSelectedFileIndex(-1);
    }, [data]);

    const [templates, setTemplates] = useState<Map<string, string>>(new Map());
    useEffect(() => {
        setTemplates((oldTemplates) => {
            const newTemplates = new Map(oldTemplates);
            for (const parsedData of data) {
                if (!newTemplates.has(parsedData.fileName)) {
                    if (parsedData.fileName.endsWith(".xml")) {
                        newTemplates.set(parsedData.fileName, presetJSONata_ResearchrQuery_POPL2021);
                    } else if (parsedData.fileName.endsWith(".json")) {
                        newTemplates.set(parsedData.fileName, presetJSONata_HotCRPQuery_POPL2021);
                    } else {
                        newTemplates.set(
                            parsedData.fileName,
                            `
{
    "originatingDatas": [],
    "groups": [],
    "hallways": [],
    "tags": [],
    "people": []
}
`
                        );
                    }
                }
            }

            return newTemplates;
        });
    }, [data]);

    const [errors, setErrors] = useState<Map<string, string>>(new Map());
    useEffect(() => {
        const t = setTimeout(() => {
            const outputData: Record<string, IntermediaryData> = {};
            const outputErrors = new Map<string, string>();
            for (const parsedData of data) {
                if ("data" in parsedData) {
                    const template = templates.get(parsedData.fileName);
                    if (template) {
                        const result = JSONataToIntermediary(parsedData.data, template);
                        if (typeof result === "string") {
                            outputErrors.set(parsedData.fileName, `Query resulted in invalid data. ${result}`);
                        } else if (result) {
                            outputData[parsedData.fileName] = result;
                        } else {
                            outputErrors.set(parsedData.fileName, "Query is invalid.");
                        }
                    } else {
                        outputErrors.set(parsedData.fileName, "No query found for this data.");
                    }
                } else {
                    outputErrors.set(parsedData.fileName, "Data was not imported properly.");
                }
            }
            setErrors(outputErrors);
            onChange?.(outputData);
        }, 500);
        return () => {
            clearTimeout(t);
        };
    }, [data, onChange, templates]);

    const selectedData =
        data && selectedFileIndex >= 0 && selectedFileIndex < data.length ? data[selectedFileIndex] : undefined;
    const selectedTemplate = selectedData ? templates.get(selectedData.fileName) : undefined;
    const selectedError = selectedData ? errors.get(selectedData.fileName) : undefined;

    return (
        <>
            {errors.size > 0 ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>
                        {errors.size} error{errors.size > 1 ? "s" : ""} processing data
                    </AlertTitle>
                    <AlertDescription>Please check each file below for errors.</AlertDescription>
                </Alert>
            ) : undefined}
            <Box>
                <Select
                    aria-label="Select a file to configure"
                    placeholder="Select a file"
                    variant="flushed"
                    value={selectedFileIndex}
                    onChange={(ev) => setSelectedFileIndex(ev.target.selectedIndex - 1)}
                >
                    {data.map((data, idx) => (
                        <option key={data.fileName} value={idx}>
                            {data.fileName}
                        </option>
                    ))}
                </Select>
            </Box>
            {selectedError ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>An error occurred processing this file</AlertTitle>
                    <AlertDescription>{selectedError}</AlertDescription>
                </Alert>
            ) : undefined}
            {selectedData && (
                <Box>
                    <FormControl>
                        <FormLabel>Parser script (JSONata)</FormLabel>
                        <FormHelperText>
                            Provide a JSONata script to interpret your imported data into Clowdr&quot;s intermediary
                            format. We currently provide template scripts for Researchr and HotCRP. (In future we hope
                            to make this a proper configuration editor and provide an easier-to-use system for
                            customising standard templates).
                        </FormHelperText>
                        <Textarea
                            fontFamily={
                                // eslint-disable-next-line quotes
                                'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace'
                            }
                            minH="400px"
                            value={selectedTemplate ?? ""}
                            onChange={(ev) => {
                                setTemplates((oldTemplates) => {
                                    const newTemplates = new Map(oldTemplates);
                                    newTemplates.set(selectedData.fileName, ev.target.value);
                                    return newTemplates;
                                });
                            }}
                        />
                    </FormControl>
                </Box>
            )}
        </>
    );
}
