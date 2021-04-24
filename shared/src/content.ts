import { assertType, is } from "typescript-is";

export enum ContentRole {
    Author = "AUTHOR",
    Presenter = "PRESENTER",
    Chair = "CHAIR",
}

export enum ContentType_Enum {
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

export type ContentItemDataBlob = ContentItemVersionData[];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isContentItemDataBlob(data: any): boolean {
    return is<ContentItemDataBlob>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertIsContentItemDataBlob(data: any): asserts data is ContentItemDataBlob {
    assertType<ContentItemDataBlob>(data);
}

export interface ContentItemVersionData {
    createdAt: number;
    createdBy: string;
    data: ContentBlob;
}

export type ContentBlob =
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

export interface AbstractBlob extends TextualContentBlob {
    type: ContentType_Enum.Abstract;
}

export interface ContentGroupListBlob extends ComponentBlob {
    type: ContentType_Enum.ContentGroupList;
}

export interface TextBlob extends TextualContentBlob {
    type: ContentType_Enum.Text;
}

export interface ImageFileBlob extends FileContentBlob {
    type: ContentType_Enum.ImageFile;
}

export interface PaperFileBlob extends FileContentBlob {
    type: ContentType_Enum.PaperFile;
}

export interface PosterFileBlob extends FileContentBlob {
    type: ContentType_Enum.PosterFile;
}

export interface ImageUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.ImageUrl;
}

export interface LinkBlob extends LinkContentBlob {
    type: ContentType_Enum.Link;
}

export interface PaperUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.PaperUrl;
}

export interface PosterUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.PosterUrl;
}

export interface LinkButtonBlob extends LinkContentBlob {
    type: ContentType_Enum.LinkButton;
}

export interface PaperLinkBlob extends LinkContentBlob {
    type: ContentType_Enum.PaperLink;
}

export interface VideoBroadcastBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoBroadcast;
}

export interface VideoCountdownBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoCountdown;
}

export interface VideoFileBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoFile;
}

export interface VideoFillerBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoFiller;
}

export interface VideoLinkBlob extends LinkContentBlob {
    type: ContentType_Enum.VideoLink;
}

export interface VideoPrepublishBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoPrepublish;
}

export interface VideoSponsorsFillerBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoSponsorsFiller;
}

export interface VideoTitlesBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoTitles;
}

export interface VideoUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.VideoUrl;
}

export interface WholeScheduleBlob extends ComponentBlob {
    type: ContentType_Enum.WholeSchedule;
}

export interface ZoomBlob extends UrlContentBlob {
    type: ContentType_Enum.Zoom;
}

/* Meta content types */

export enum ContentBaseType {
    Component = "component",
    Text = "text",
    File = "file",
    URL = "url",
    Link = "link",
    Video = "video",
}

export const ItemBaseTypes: { [K in ContentType_Enum]: ContentBaseType } = {
    [ContentType_Enum.Abstract]: ContentBaseType.Text,
    [ContentType_Enum.ContentGroupList]: ContentBaseType.Component,
    [ContentType_Enum.ImageFile]: ContentBaseType.File,
    [ContentType_Enum.ImageUrl]: ContentBaseType.URL,
    [ContentType_Enum.Link]: ContentBaseType.Link,
    [ContentType_Enum.LinkButton]: ContentBaseType.Link,
    [ContentType_Enum.PaperFile]: ContentBaseType.File,
    [ContentType_Enum.PaperLink]: ContentBaseType.Link,
    [ContentType_Enum.PaperUrl]: ContentBaseType.URL,
    [ContentType_Enum.PosterFile]: ContentBaseType.File,
    [ContentType_Enum.PosterUrl]: ContentBaseType.URL,
    [ContentType_Enum.Text]: ContentBaseType.Text,
    [ContentType_Enum.VideoBroadcast]: ContentBaseType.Video,
    [ContentType_Enum.VideoCountdown]: ContentBaseType.Video,
    [ContentType_Enum.VideoFile]: ContentBaseType.Video,
    [ContentType_Enum.VideoFiller]: ContentBaseType.Video,
    [ContentType_Enum.VideoLink]: ContentBaseType.Link,
    [ContentType_Enum.VideoPrepublish]: ContentBaseType.Video,
    [ContentType_Enum.VideoSponsorsFiller]: ContentBaseType.Video,
    [ContentType_Enum.VideoTitles]: ContentBaseType.Video,
    [ContentType_Enum.VideoUrl]: ContentBaseType.URL,
    [ContentType_Enum.Zoom]: ContentBaseType.URL,
    [ContentType_Enum.WholeSchedule]: ContentBaseType.Component,
};

export interface ComponentBlob extends BaseContentBlob {
    baseType: ContentBaseType.Component;
}

export interface TextualContentBlob extends BaseContentBlob {
    baseType: ContentBaseType.Text;
    text: string;
}

export interface FileContentBlob extends BaseContentBlob {
    baseType: ContentBaseType.File;
    s3Url: string;
}

export interface UrlContentBlob extends BaseContentBlob {
    baseType: ContentBaseType.URL;
    url: string;
}

export interface LinkContentBlob extends BaseContentBlob {
    baseType: ContentBaseType.Link;
    text: string;
    url: string;
}

export interface VideoContentBlob extends BaseContentBlob {
    baseType: ContentBaseType.Video;
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

interface BaseContentBlob {
    type: string;
}
