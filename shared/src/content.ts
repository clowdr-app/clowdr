import { assertType, is } from "typescript-is";

export enum ContentRole {
    Author = "AUTHOR",
    Presenter = "PRESENTER",
    Chair = "CHAIR",
}

export enum ElementType_Enum {
    /** Abstract Markdown text. */
    Abstract = "ABSTRACT",
    /** List of content groups in the system. */
    ContentGroupList = "CONTENT_GROUP_LIST",
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

export type ElementDataBlob = ElementVersionData[];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isElementDataBlob(data: any): boolean {
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
    | ZoomBlob;

export interface AbstractBlob extends TextualElementBlob {
    type: ElementType_Enum.Abstract;
}

export interface ContentGroupListBlob extends ComponentBlob {
    type: ElementType_Enum.ContentGroupList;
}

export interface TextBlob extends TextualElementBlob {
    type: ElementType_Enum.Text;
}

export interface ImageFileBlob extends FileElementBlob {
    type: ElementType_Enum.ImageFile;
}

export interface PaperFileBlob extends FileElementBlob {
    type: ElementType_Enum.PaperFile;
}

export interface PosterFileBlob extends FileElementBlob {
    type: ElementType_Enum.PosterFile;
}

export interface ImageUrlBlob extends UrlElementBlob {
    type: ElementType_Enum.ImageUrl;
}

export interface LinkBlob extends LinkElementBlob {
    type: ElementType_Enum.Link;
}

export interface PaperUrlBlob extends UrlElementBlob {
    type: ElementType_Enum.PaperUrl;
}

export interface PosterUrlBlob extends UrlElementBlob {
    type: ElementType_Enum.PosterUrl;
}

export interface LinkButtonBlob extends LinkElementBlob {
    type: ElementType_Enum.LinkButton;
}

export interface PaperLinkBlob extends LinkElementBlob {
    type: ElementType_Enum.PaperLink;
}

export interface VideoBroadcastBlob extends VideoElementBlob {
    type: ElementType_Enum.VideoBroadcast;
}

export interface VideoCountdownBlob extends VideoElementBlob {
    type: ElementType_Enum.VideoCountdown;
}

export interface VideoFileBlob extends VideoElementBlob {
    type: ElementType_Enum.VideoFile;
}

export interface VideoFillerBlob extends VideoElementBlob {
    type: ElementType_Enum.VideoFiller;
}

export interface VideoLinkBlob extends LinkElementBlob {
    type: ElementType_Enum.VideoLink;
}

export interface VideoPrepublishBlob extends VideoElementBlob {
    type: ElementType_Enum.VideoPrepublish;
}

export interface VideoSponsorsFillerBlob extends VideoElementBlob {
    type: ElementType_Enum.VideoSponsorsFiller;
}

export interface VideoTitlesBlob extends VideoElementBlob {
    type: ElementType_Enum.VideoTitles;
}

export interface VideoUrlBlob extends UrlElementBlob {
    type: ElementType_Enum.VideoUrl;
}

export interface WholeScheduleBlob extends ComponentBlob {
    type: ElementType_Enum.WholeSchedule;
}

export interface ZoomBlob extends UrlElementBlob {
    type: ElementType_Enum.Zoom;
}

/* Meta content types */

export enum ElementBaseType {
    Component = "component",
    Text = "text",
    File = "file",
    URL = "url",
    Link = "link",
    Video = "video",
}

export const ItemBaseTypes: { [K in ElementType_Enum]: ElementBaseType } = {
    [ElementType_Enum.Abstract]: ElementBaseType.Text,
    [ElementType_Enum.ContentGroupList]: ElementBaseType.Component,
    [ElementType_Enum.ImageFile]: ElementBaseType.File,
    [ElementType_Enum.ImageUrl]: ElementBaseType.URL,
    [ElementType_Enum.Link]: ElementBaseType.Link,
    [ElementType_Enum.LinkButton]: ElementBaseType.Link,
    [ElementType_Enum.PaperFile]: ElementBaseType.File,
    [ElementType_Enum.PaperLink]: ElementBaseType.Link,
    [ElementType_Enum.PaperUrl]: ElementBaseType.URL,
    [ElementType_Enum.PosterFile]: ElementBaseType.File,
    [ElementType_Enum.PosterUrl]: ElementBaseType.URL,
    [ElementType_Enum.Text]: ElementBaseType.Text,
    [ElementType_Enum.VideoBroadcast]: ElementBaseType.Video,
    [ElementType_Enum.VideoCountdown]: ElementBaseType.Video,
    [ElementType_Enum.VideoFile]: ElementBaseType.Video,
    [ElementType_Enum.VideoFiller]: ElementBaseType.Video,
    [ElementType_Enum.VideoLink]: ElementBaseType.Link,
    [ElementType_Enum.VideoPrepublish]: ElementBaseType.Video,
    [ElementType_Enum.VideoSponsorsFiller]: ElementBaseType.Video,
    [ElementType_Enum.VideoTitles]: ElementBaseType.Video,
    [ElementType_Enum.VideoUrl]: ElementBaseType.URL,
    [ElementType_Enum.Zoom]: ElementBaseType.URL,
    [ElementType_Enum.WholeSchedule]: ElementBaseType.Component,
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
}

export interface UrlElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.URL;
    url: string;
}

export interface LinkElementBlob extends BaseElementBlob {
    baseType: ElementBaseType.Link;
    text: string;
    url: string;
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
    updatedTimestamp: number;
}

export interface VimeoPublishDetails {
    videoUri: string;
}

interface BaseElementBlob {
    type: string;
}
