import React from "react";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import type { ParsedContentData } from "./DataPanel";

// TODO: Originating datas
const presetJSONata_ResearchrQuery_POPL2021 = (conferenceId: string) => `
{
    "groups": $.$@$session.timeslot[event_id].{
        "id": slot_id._text,
        "title": title._text,
        "typeName": "PAPER",
        "conferenceId": "${conferenceId}",
        "items": [
            {
                "typeName": "ABSTRACT",
                "isHidden": false,
                "name": "Abstract",
                "conferenceId": "${conferenceId}",
                "data": [{
                    "createdAt": "${new Date().toISOString()}",
                    "createdBy": "importer",
                    "data": {
                        "type": "ABSTRACT",
                        "baseType": "text",
                        "text": description.(_text="undefined" ? "" : _text)
                    }
                }],
                "originatingDataId": slot_id._text
            }
        ],
        "requiredItems": [
            {
                "typeName": "VIDEO_PREPUBLISH",
                "name": "Pre-published video",
                "originatingDataId": slot_id._text,
                "uploadsRemaining": 3,
                "conferenceId": "${conferenceId}"
            },
            {
                "typeName": "VIDEO_BROADCAST",
                "name": "Livestream broadcast video",
                "originatingDataId": slot_id._text,
                "uploadsRemaining": 3,
                "conferenceId": "${conferenceId}"
            }
        ],
        "tags": $session.tracks.track._text,
        "people": $append(persons.person[role._text != "Session Chair"].{
            "personId": person_id._text,
            "name_affiliation": first_name._text & ' ' & last_name._text & ' (' & affiliation._text & ')',
            "role": role._text,
            "priority": sort_key._text,
            "conferenceId": "${conferenceId}"
        }, [$session.timeslot.persons.person[role._text="Session Chair" or role._text="Event Chair" or role._text="Chair"].
                {
                    "personId": person_id._text,
                    "name_affiliation": first_name._text & ' ' & last_name._text & ' (' & affiliation._text & ')',
                    "role": "Chair",
                    "priority": sort_key._text,
                    "conferenceId": "${conferenceId}"
                }
        ]),
        "hallways": [],
        "originatingDataId": slot_id._text
    },
    "rooms": ($rooms := $distinct($.**.room.$match(_text, /[^|]*\\| ?(.*)/).groups[0]); $rooms.{"name": $}),
    "tags": ($tags := $distinct($.**.tracks.track._text); $tags.{ "name": $ }),
    "events": $.$@$session.timeslot[event_id].{
        "id": $.event_id._text,
        "itemId": $.slot_id._text,
        "startAt": $.date._text & 'T' & $.start_time._text,
        "endAt": $.end_date._text & 'T' & $.end_time._text,

        "roomName": $match(room._text, /[^|]*\\| ?(.*)/).groups[0],
        "tagNames": $session.tracks.track._text,

        "chairs": 
            $session.timeslot.persons.person[role._text="Session Chair" or role._text="Event Chair" or role._text="Chair"].
                {
                    "name": $trim(first_name._text & ' ' & last_name._text),
                    "affiliation": affiliation._text
                }
    },
    "people": $.**.person.{
        "id": person_id._text,
        "originatingDataId": person_id._text,
        "name": first_name._text & ' ' & last_name._text,
        "affiliation": affiliation._text
        /* "pictureURL": picture_url._text, */
        /* "homepageURL": homepage_url._text, */
        /* "bio": bio._text */
    },
    "sessions": $.{
        "id": subevent_id._text,
        "title": title._text, 
        "researchrLink": { "url": url._text, "label": url_link_display._text },
        "roomName": $match(room._text, /[^|]*\\| ?(.*)/).groups[0],
        "chair": 
            timeslot[$not($exists($.event_id))].persons.person[role._text="Session Chair"].
                { 
                    "name": $trim(first_name._text & ' ' & last_name._text),
                    "affiliation": affiliation._text
                },
        "originatingDataId": subevent_id._text
    }
}
`;

export default function ConfigPanel({ data }: { data: ParsedData<ParsedContentData>[] }): JSX.Element {
    // * For each file, setup the JSONata queries to output exactly the types we need
    // * JSONata:
    //   http://docs.jsonata.org/overview   ---   https://try.jsonata.org/
    // * Create default mappings for HotCRP and Researchr
    // * Can the entire remapping be done as a giant JSONata query for now? Yes!

    // TODO: Reprocess dates/times into user-selectable timezone

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
    return <>Config</>;
}
