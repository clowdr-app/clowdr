import { assertType, is } from "typescript-is";

export enum Content_ElementType_Enum {
    /** Abstract Markdown text. */
    Abstract = "ABSTRACT",
    /** Show a summary of the currently active social and discussion rooms */
    ActiveSocialRooms = "ACTIVE_SOCIAL_ROOMS",
    /** File for an audio clip (stored by Clowdr). */
    AudioFile = "AUDIO_FILE",
    /** Link to an audio clip (audio is not embedded in Clowdr UI). */
    AudioLink = "AUDIO_LINK",
    /** URL for an audio clip (audio is embedded in Clowdr UI). */
    AudioUrl = "AUDIO_URL",
    /** List of content groups in the system. */
    ContentGroupList = "CONTENT_GROUP_LIST",
    /** A horizontal divider */
    Divider = "DIVIDER",
    /** Button that opens the explore program modal. Intended for use on the landing page. */
    ExploreProgramButton = "EXPLORE_PROGRAM_BUTTON",
    /** Button that opens the explore program modal with the Schedule tab open. Intended for use on the landing page. */
    ExploreScheduleButton = "EXPLORE_SCHEDULE_BUTTON",
    /** Data for a Zoom meeting. */
    ExternalEventLink = "EXTERNAL_EVENT_LINK",
    /** File for an image (stored by Clowdr). */
    ImageFile = "IMAGE_FILE",
    /** URL to an image (embedded in Clowdr UI). */
    ImageUrl = "IMAGE_URL",
    /** A generic URL. */
    Link = "LINK",
    /** A URL for a link button. */
    LinkButton = "LINK_BUTTON",
    /** Show a summary of the currently live program rooms */
    LiveProgramRooms = "LIVE_PROGRAM_ROOMS",
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
    /** Show a summary of the sponsor booths */
    SponsorBooths = "SPONSOR_BOOTHS",
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
}

export type ElementDataBlob = ElementVersionData[];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isElementDataBlob(data: any): data is ElementDataBlob {
    return is<ElementDataBlob>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertIsElementDataBlob(data: any): asserts data is ElementDataBlob {
    assertType<ElementDataBlob>(data);
}

export interface ElementVersionData {
    createdAt: number;
    createdBy: string;
    data: ElementBlob;
}

export type ElementBlob =
    | AbstractBlob
    | ContentGroupListBlob
    | TextBlob
    | ImageFileBlob
    | PaperFileBlob
    | PosterFileBlob
    | ImageUrlBlob
    | LinkBlob
    | PaperUrlBlob
    | PosterUrlBlob
    | LinkButtonBlob
    | PaperLinkBlob
    | VideoBroadcastBlob
    | VideoCountdownBlob
    | VideoFileBlob
    | VideoFillerBlob
    | VideoLinkBlob
    | VideoPrepublishBlob
    | VideoSponsorsFillerBlob
    | VideoTitlesBlob
    | VideoUrlBlob
    | WholeScheduleBlob
    | ExternalEventLinkBlob
    | ActiveSocialRoomsBlob
    | LiveProgramRoomsBlob
    | DividerBlob
    | SponsorBoothsBlob
    | ExploreProgramButtonBlob
    | ExploreScheduleButtonBlob
    | AudioFileBlob
    | AudioLinkBlob
    | AudioURLBlob;

export interface AbstractBlob extends TextualElementBlob {
    type: Content_ElementType_Enum.Abstract;
}

export interface ContentGroupListBlob extends ComponentBlob {
    type: Content_ElementType_Enum.ContentGroupList;
}

export interface TextBlob extends TextualElementBlob {
    type: Content_ElementType_Enum.Text;
}

export interface ImageFileBlob extends FileElementBlob {
    type: Content_ElementType_Enum.ImageFile;
}

export interface PaperFileBlob extends FileElementBlob {
    type: Content_ElementType_Enum.PaperFile;
}

export interface PosterFileBlob extends FileElementBlob {
    type: Content_ElementType_Enum.PosterFile;
}

export interface ImageUrlBlob extends UrlElementBlob {
    type: Content_ElementType_Enum.ImageUrl;
}

export interface LinkBlob extends LinkElementBlob {
    type: Content_ElementType_Enum.Link;
}

export interface PaperUrlBlob extends UrlElementBlob {
    type: Content_ElementType_Enum.PaperUrl;
}

export interface PosterUrlBlob extends UrlElementBlob {
    type: Content_ElementType_Enum.PosterUrl;
}

export interface LinkButtonBlob extends LinkElementBlob {
    type: Content_ElementType_Enum.LinkButton;
}

export interface PaperLinkBlob extends LinkElementBlob {
    type: Content_ElementType_Enum.PaperLink;
}

export interface VideoBroadcastBlob extends VideoElementBlob {
    type: Content_ElementType_Enum.VideoBroadcast;
}

export interface VideoCountdownBlob extends VideoElementBlob {
    type: Content_ElementType_Enum.VideoCountdown;
}

export interface VideoFileBlob extends VideoElementBlob {
    type: Content_ElementType_Enum.VideoFile;
}

export interface VideoFillerBlob extends VideoElementBlob {
    type: Content_ElementType_Enum.VideoFiller;
}

export interface VideoLinkBlob extends LinkElementBlob {
    type: Content_ElementType_Enum.VideoLink;
}

export interface VideoPrepublishBlob extends VideoElementBlob {
    type: Content_ElementType_Enum.VideoPrepublish;
}

export interface VideoSponsorsFillerBlob extends VideoElementBlob {
    type: Content_ElementType_Enum.VideoSponsorsFiller;
}

export interface VideoTitlesBlob extends VideoElementBlob {
    type: Content_ElementType_Enum.VideoTitles;
}

export interface VideoUrlBlob extends UrlElementBlob {
    type: Content_ElementType_Enum.VideoUrl;
}

export interface WholeScheduleBlob extends ComponentBlob {
    type: Content_ElementType_Enum.WholeSchedule;
}

export interface ExploreProgramButtonBlob extends ComponentBlob {
    type: Content_ElementType_Enum.ExploreProgramButton;
}

export interface ExploreScheduleButtonBlob extends ComponentBlob {
    type: Content_ElementType_Enum.ExploreScheduleButton;
}

export interface ExternalEventLinkBlob extends UrlElementBlob {
    type: Content_ElementType_Enum.ExternalEventLink;
}

export interface ActiveSocialRoomsBlob extends ComponentBlob {
    type: Content_ElementType_Enum.ActiveSocialRooms;
}

export interface LiveProgramRoomsBlob extends ComponentBlob {
    type: Content_ElementType_Enum.LiveProgramRooms;
}

export interface DividerBlob extends ComponentBlob {
    type: Content_ElementType_Enum.Divider;
}

export interface SponsorBoothsBlob extends ComponentBlob {
    type: Content_ElementType_Enum.SponsorBooths;
}

export interface AudioFileBlob extends AudioElementBlob {
    type: Content_ElementType_Enum.AudioFile;
}

export interface AudioLinkBlob extends LinkElementBlob {
    type: Content_ElementType_Enum.AudioLink;
}

export interface AudioURLBlob extends UrlElementBlob {
    type: Content_ElementType_Enum.AudioUrl;
}

/* Meta content types */

export enum ElementBaseType {
    Component = "component",
    Text = "text",
    File = "file",
    URL = "url",
    Link = "link",
    Video = "video",
    Audio = "audio",
}

export const ElementBaseTypes: { [K in Content_ElementType_Enum]: ElementBaseType } = {
    [Content_ElementType_Enum.Abstract]: ElementBaseType.Text,
    [Content_ElementType_Enum.ContentGroupList]: ElementBaseType.Component,
    [Content_ElementType_Enum.ImageFile]: ElementBaseType.File,
    [Content_ElementType_Enum.ImageUrl]: ElementBaseType.URL,
    [Content_ElementType_Enum.Link]: ElementBaseType.Link,
    [Content_ElementType_Enum.LinkButton]: ElementBaseType.Link,
    [Content_ElementType_Enum.PaperFile]: ElementBaseType.File,
    [Content_ElementType_Enum.PaperLink]: ElementBaseType.Link,
    [Content_ElementType_Enum.PaperUrl]: ElementBaseType.URL,
    [Content_ElementType_Enum.PosterFile]: ElementBaseType.File,
    [Content_ElementType_Enum.PosterUrl]: ElementBaseType.URL,
    [Content_ElementType_Enum.Text]: ElementBaseType.Text,
    [Content_ElementType_Enum.VideoBroadcast]: ElementBaseType.Video,
    [Content_ElementType_Enum.VideoCountdown]: ElementBaseType.Video,
    [Content_ElementType_Enum.VideoFile]: ElementBaseType.Video,
    [Content_ElementType_Enum.VideoFiller]: ElementBaseType.Video,
    [Content_ElementType_Enum.VideoLink]: ElementBaseType.Link,
    [Content_ElementType_Enum.VideoPrepublish]: ElementBaseType.Video,
    [Content_ElementType_Enum.VideoSponsorsFiller]: ElementBaseType.Video,
    [Content_ElementType_Enum.VideoTitles]: ElementBaseType.Video,
    [Content_ElementType_Enum.VideoUrl]: ElementBaseType.URL,
    [Content_ElementType_Enum.ExternalEventLink]: ElementBaseType.URL,
    [Content_ElementType_Enum.WholeSchedule]: ElementBaseType.Component,
    [Content_ElementType_Enum.ActiveSocialRooms]: ElementBaseType.Component,
    [Content_ElementType_Enum.LiveProgramRooms]: ElementBaseType.Component,
    [Content_ElementType_Enum.Divider]: ElementBaseType.Component,
    [Content_ElementType_Enum.SponsorBooths]: ElementBaseType.Component,
    [Content_ElementType_Enum.ExploreProgramButton]: ElementBaseType.Component,
    [Content_ElementType_Enum.ExploreScheduleButton]: ElementBaseType.Component,
    [Content_ElementType_Enum.AudioFile]: ElementBaseType.Audio,
    [Content_ElementType_Enum.AudioLink]: ElementBaseType.Link,
    [Content_ElementType_Enum.AudioUrl]: ElementBaseType.URL,
};

export interface ComponentBlob extends BaseElementBlob {
    baseType: ElementBaseType.Component;
}

export interface TextualElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.Text;
    text: string;
}

export interface FileElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.File;
    s3Url: string;
    altText?: string;
}

export interface UrlElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.URL;
    url: string;
    title?: string;
}

export interface LinkElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.Link;
    text: string;
    url: string;
}

export interface AudioElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.Audio;
    s3Url: string;
    sourceHasEmbeddedSubtitles?: boolean;
    subtitles: Record<LanguageCode, SubtitleDetails>;
    description?: string;
}

export interface VideoElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.Video;
    s3Url: string;
    sourceHasEmbeddedSubtitles?: boolean;
    transcode?: TranscodeDetails;
    subtitles: Record<LanguageCode, SubtitleDetails>;
    broadcastTranscode?: BroadcastTranscodeDetails;
}

type LanguageCode = string;

export enum AWSJobStatus {
    InProgress = "IN_PROGRESS",
    Failed = "FAILED",
    Completed = "COMPLETED",
}

export interface SubtitleDetails {
    s3Url: string;
    status: AWSJobStatus;
    message?: string;
}

export interface TranscodeDetails {
    s3Url?: string;
    status: AWSJobStatus;
    message?: string;
    updatedTimestamp: number;
    jobId: string;
}

export interface BroadcastTranscodeDetails {
    s3Url?: string;
    durationSeconds?: number;
    updatedTimestamp: number;
}

export interface VimeoPublishDetails {
    videoUri: string;
}

interface BaseElementBlob {
    type: string;
}
