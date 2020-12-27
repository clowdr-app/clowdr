import jsonata from "jsonata";
import { assertType, TypeGuardError } from "typescript-is";
import type { ContentItemDataBlob, ContentRole } from "../content";

declare enum ContentType_Enum {
    /** Abstract Markdown text. */
    Abstract = "ABSTRACT",
    /** File for an image (stored by Clowdr). */
    ImageFile = "IMAGE_FILE",
    /** URL to an image (embedded in Clowdr UI). */
    ImageUrl = "IMAGE_URL",
    /** A generic URL. */
    Link = "LINK",
    /** A URL for a link button. */
    LinkButton = "LINK_BUTTON",
    /** File for a paper (stored by Clowdr). */
    PaperFile = "PAPER_FILE",
    /** Link for a paper (preview is not embedded in Clowdr UI). */
    PaperLink = "PAPER_LINK",
    /** URL to a paper (preview may be embedded in Clowdr UI e.g. PDF JS viewer). */
    PaperUrl = "PAPER_URL",
    /** File for a poster image (stored by Clowdr). */
    PosterFile = "POSTER_FILE",
    /** URL to a poster image (embedded in Clowdr UI). */
    PosterUrl = "POSTER_URL",
    /** General-purpose Markdown text. */
    Text = "TEXT",
    /** Video file to be broadcast. */
    VideoBroadcast = "VIDEO_BROADCAST",
    /** Video file for counting down to a transition in a broadcast. */
    VideoCountdown = "VIDEO_COUNTDOWN",
    /** File for a video (stored by Clowdr). */
    VideoFile = "VIDEO_FILE",
    /** Video file for filler loop between events/during breaks in a broadcast. */
    VideoFiller = "VIDEO_FILLER",
    /** Link to a video (video is not embedded in Clowdr UI). */
    VideoLink = "VIDEO_LINK",
    /** Video file to be published in advance of the conference. */
    VideoPrepublish = "VIDEO_PREPUBLISH",
    /** Video file for sponsors filler loop between events/during breaks in a broadcast. */
    VideoSponsorsFiller = "VIDEO_SPONSORS_FILLER",
    /** Video file for titles introducing an event during a broadcast. */
    VideoTitles = "VIDEO_TITLES",
    /** URL for a video (video is embedded in Clowdr UI). */
    VideoUrl = "VIDEO_URL",
    /** Data for a Zoom meeting. */
    Zoom = "ZOOM",
}

declare enum ContentGroupType_Enum {
    /** A keynote. */
    Keynote = "KEYNOTE",
    /** A generic group type - use sparingly. */
    Other = "OTHER",
    /** A paper. */
    Paper = "PAPER",
    /** A poster. */
    Poster = "POSTER",
    /** A sponsor. */
    Sponsor = "SPONSOR",
    /** A symposium. */
    Symposium = "SYMPOSIUM",
    /** A workshop. */
    Workshop = "WORKSHOP",
}

export interface IntermediaryOriginatingDataDescriptor {
    // TODO
}

export interface IntermediaryItemDescriptor {
    id?: string;
    originatingDataSourceId?: string;
    typeName?: ContentType_Enum;
    isHidden?: boolean;
    name?: string;
    data?: ContentItemDataBlob;
}

export interface IntermediaryUploaderDescriptor {
    id?: string;

    email?: string;
    name?: string;
}

export interface IntermediaryRequiredItemDescriptor {
    id?: string;
    originatingDataSourceId?: string;
    typeName?: ContentType_Enum;
    name?: string;
    uploadsRemaining?: number;

    uploaders?: Array<IntermediaryUploaderDescriptor>;
}

export interface IntermediaryGroupPersonDescriptor {
    id?: string;
    personId?: string;
    name_affiliation?: string;
    role?: ContentRole;
    priority?: number;
}

export interface IntermediaryGroupHallwayDescriptor {
    id?: string;
    hallwayId?: string;
    priority?: number;
    layout?: any;
}

export interface IntermediaryGroupDescriptor {
    id?: string;
    originatingDataSourceId?: string;

    title?: string;
    typeName?: ContentGroupType_Enum;
    items?: Array<IntermediaryItemDescriptor>;
    requiredItems?: Array<IntermediaryRequiredItemDescriptor>;
    tagNames?: Array<string>;
    people?: Array<IntermediaryGroupPersonDescriptor>;
    hallways?: Array<IntermediaryGroupHallwayDescriptor>;
}

export interface IntermediaryHallwayDescriptor {
    id?: string;
    name?: string;
    colour?: string;
    priority?: number;
}

export interface IntermediaryTagDescriptor {
    id?: string;
    originatingDataSourceId?: string;

    name?: string;
    colour?: string;
}

export interface IntermediaryPersonDescriptor {
    id?: string;
    originatingDataSourceId?: string;

    name?: string;
    affiliation?: string;
    email?: string;
}

export interface IntermediaryData {
    originatingDatas?: Array<IntermediaryOriginatingDataDescriptor>;
    groups?: Array<IntermediaryGroupDescriptor>;
    hallways?: Array<IntermediaryHallwayDescriptor>;
    tags?: Array<IntermediaryTagDescriptor>;
    people?: Array<IntermediaryPersonDescriptor>;
}

function internalConverter(data: any, query: string): IntermediaryData | string {
    const expression = jsonata(query);
    const result = expression.evaluate(data);
    if (assertType<IntermediaryData>(result)) {
        return result;
    } else {
        return "Unknown error";
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function JSONataToIntermediary(data: any, query: string): IntermediaryData | string | undefined {
    try {
        return internalConverter(data, query);
    } catch (e) {
        if (e instanceof TypeGuardError) {
            return e.message;
        }
        return undefined;
    }
}
