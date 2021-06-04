import jsonata from "jsonata";
import { assertType, TypeGuardError } from "typescript-is";
import type { ContentRole, ElementDataBlob } from "../content";

declare enum RoomMode_Enum {
    /** Users may participate in the general video chat. */
    Breakout = "BREAKOUT",
    /** An exhibition hall. */
    Exhibition = "EXHIBITION",
    /** An empty room. */
    None = "NONE",
    /** Pre-recorded content should be played out to registrants. The breakout and Q&A video chats may also be available to relevant users. */
    Prerecorded = "PRERECORDED",
    /** A live presentation should be delivered in the Q&A video chat. The breakout video chat may also be available to relevant users. */
    Presentation = "PRESENTATION",
    /** A live Q&A/discussion should be delivered in the Q&A video chat. The breakout video chat may also be available to relevant users. */
    QAndA = "Q_AND_A",
    /** A shuffle queue. */
    Shuffle = "SHUFFLE",
    /** An ordinary video from either a VIDEO_URL content element or a video uploaded to Clowdr. */
    VideoPlayer = "VIDEO_PLAYER",
    /** Event is taking place in a Zoom room. */
    Zoom = "ZOOM",
}

declare enum ElementType_Enum {
    /** Abstract Markdown text. */
    Abstract = "ABSTRACT",
    /** List of content groups in the system. */
    ItemList = "CONTENT_GROUP_LIST",
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
    /** Schedule view for the whole conference. */
    WholeSchedule = "WHOLE_SCHEDULE",
    /** Data for a Zoom meeting. */
    Zoom = "ZOOM",
}

declare enum ItemType_Enum {
    /** A demonstration. */
    Demonstration = "DEMONSTRATION",
    /** A keynote. */
    Keynote = "KEYNOTE",
    /** Conference main landing page. */
    LandingPage = "LANDING_PAGE",
    /** A generic group type - use sparingly. */
    Other = "OTHER",
    /** A paper. */
    Paper = "PAPER",
    /** A poster. */
    Poster = "POSTER",
    /** A presentation. */
    Presentation = "PRESENTATION",
    /** A Q&A covering the whole session. */
    SessionQAndA = "SESSION_Q_AND_A",
    /** A scheduled social. */
    Social = "SOCIAL",
    /** A sponsor. */
    Sponsor = "SPONSOR",
    /** A symposium. */
    Symposium = "SYMPOSIUM",
    /** A tutorial. */
    Tutorial = "TUTORIAL",
    /** A workshop. */
    Workshop = "WORKSHOP",
}

declare enum EventPersonRole_Enum {
    /** Chair/moderator of the event */
    Chair = "CHAIR",
    /** Viewer who has been given access to the event (e.g. to ask a question). */
    Participant = "PARTICIPANT",
    /** A presenter. */
    Presenter = "PRESENTER",
}

export interface IntermediaryOriginatingDataPart {
    sourceId: string;
    originName: "Researchr" | "HotCRP" | string;
    data: any;
}

export interface IntermediaryOriginatingDataDescriptor {
    sourceId: string;
    data: IntermediaryOriginatingDataPart[];
}

export interface IntermediaryElementDescriptor {
    id?: string;
    originatingDataSourceId?: string;
    typeName?: ElementType_Enum;
    isHidden?: boolean;
    name?: string;
    data?: ElementDataBlob;
}

export interface IntermediaryUploaderDescriptor {
    id?: string;

    email?: string;
    name?: string;
}

export interface IntermediaryUploadableElementDescriptor {
    id?: string;
    originatingDataSourceId?: string;
    typeName?: ElementType_Enum;
    name?: string;
    uploadsRemaining?: number;

    uploaders?: Array<IntermediaryUploaderDescriptor>;
}

export interface IntermediaryItemPersonDescriptor {
    id?: string;
    personId?: string;
    name_affiliation?: string;
    role?: ContentRole;
    priority?: number;
}

export interface IntermediaryItemExhibitionDescriptor {
    id?: string;
    exhibitionId?: string;
    priority?: number;
    layout?: any;
}

export interface IntermediaryItemDescriptor {
    id?: string;
    originatingDataSourceId?: string;

    title?: string;
    typeName?: ItemType_Enum;
    elements?: Array<IntermediaryElementDescriptor>;
    uploadableElements?: Array<IntermediaryUploadableElementDescriptor>;
    tagNames?: Array<string>;
    exhibitionNames?: Array<string>;
    people?: Array<IntermediaryItemPersonDescriptor>;
    exhibitions?: Array<IntermediaryItemExhibitionDescriptor>;
}

export interface IntermediaryExhibitionDescriptor {
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
    priority?: number;
}

export interface IntermediaryPersonDescriptor {
    id?: string;
    originatingDataSourceId?: string;

    name?: string;
    affiliation?: string;
    email?: string;
}

export interface IntermediaryContentData {
    originatingDatas?: Array<IntermediaryOriginatingDataDescriptor>;
    items?: Array<IntermediaryItemDescriptor>;
    exhibitions?: Array<IntermediaryExhibitionDescriptor>;
    tags?: Array<IntermediaryTagDescriptor>;
    people?: Array<IntermediaryPersonDescriptor>;
}

function internalContentConverter(data: any, query: string): IntermediaryContentData | string {
    const expression = jsonata(query);
    const result = expression.evaluate(data);
    if (assertType<IntermediaryContentData>(result)) {
        return result;
    } else {
        return "Unknown error";
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function JSONataToIntermediaryContent(data: any, query: string): IntermediaryContentData | string | undefined {
    try {
        return internalContentConverter(data, query);
    } catch (e) {
        if (e instanceof TypeGuardError) {
            return e.message;
        }
        return undefined;
    }
}

export interface IntermediaryRoomDescriptor {
    id?: string;
    originatingDataSourceId?: string;
    name?: string;
    capacity?: number | null;
    priority?: number;
}

export interface IntermediaryEventDescriptor {
    id?: string;
    originatingDataSourceId?: string;
    roomId?: string;
    roomName?: string;
    intendedRoomModeName?: RoomMode_Enum;
    itemId?: string | null;
    itemSourceId?: string;
    name?: string;
    startTime?: number;
    durationSeconds?: number;
    people?: IntermediaryEventPersonDescriptor[];
    tagNames?: Array<string>;
    exhibitionName?: string | null;
}

export interface IntermediaryEventPersonDescriptor {
    id?: string;
    originatingDataSourceId?: string;
    registrantId?: string | null;
    name?: string;
    affiliation?: string | null;
    roleName?: EventPersonRole_Enum;
}

export interface IntermediaryScheduleData {
    originatingDatas?: Array<IntermediaryOriginatingDataDescriptor>;
    rooms?: Array<IntermediaryRoomDescriptor>;
    events?: Array<IntermediaryEventDescriptor>;
    tags?: Array<IntermediaryTagDescriptor>;
}

function internalScheduleConverter(data: any, query: string): IntermediaryScheduleData | string {
    const expression = jsonata(query);
    const result = expression.evaluate(data);
    if (assertType<IntermediaryScheduleData>(result)) {
        return result;
    } else {
        return "Unknown error";
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function JSONataToIntermediarySchedule(data: any, query: string): IntermediaryScheduleData | string | undefined {
    try {
        return internalScheduleConverter(data, query);
    } catch (e) {
        if (e instanceof TypeGuardError) {
            return e.message;
        }
        return undefined;
    }
}

export interface IntermediaryRegistrantData {
    name: string;
    email: string;
    group: string;
}

function internalRegistrantConverter(data: any, query: string): IntermediaryRegistrantData[] | string {
    const expression = jsonata(query);
    const result = expression.evaluate(data);
    if (assertType<IntermediaryRegistrantData[]>(result)) {
        return result;
    } else {
        return "Unknown error";
    }
}

export function JSONataToIntermediaryRegistrant(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    data: any,
    query: string
): IntermediaryRegistrantData[] | string | undefined {
    try {
        return internalRegistrantConverter(data, query);
    } catch (e) {
        if (e instanceof TypeGuardError) {
            return e.message;
        }
        return undefined;
    }
}
