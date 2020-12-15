import gql from "graphql-tag";

gql`
    query GetContentTypes {
        ContentType {
            name
        }
    }
`;

export enum ContentType_Enum {
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
}

export type ContentItemDataBlob = ContentItemVersionData[];

export interface ContentItemVersionData {
    createdAt: number;
    createdBy: string;
    data: ContentBlob;
}

export type ContentBlob =
    | AbstractBlob
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
    | VideoUrlBlob;

interface AbstractBlob extends TextualContentBlob {
    type: ContentType_Enum.Abstract;
}

interface TextBlob extends TextualContentBlob {
    type: ContentType_Enum.Text;
}

interface ImageFileBlob extends FileContentBlob {
    type: ContentType_Enum.ImageFile;
}

interface PaperFileBlob extends FileContentBlob {
    type: ContentType_Enum.PaperFile;
}

interface PosterFileBlob extends FileContentBlob {
    type: ContentType_Enum.PosterFile;
}

interface ImageUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.ImageUrl;
}

interface LinkBlob extends UrlContentBlob {
    type: ContentType_Enum.Link;
}

interface PaperUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.PaperUrl;
}

interface PosterUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.PosterUrl;
}

interface LinkButtonBlob extends LinkContentBlob {
    type: ContentType_Enum.LinkButton;
}

interface PaperLinkBlob extends LinkContentBlob {
    type: ContentType_Enum.PaperLink;
}

interface VideoBroadcastBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoBroadcast;
}

interface VideoCountdownBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoCountdown;
}

interface VideoFileBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoFile;
}

interface VideoFillerBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoFiller;
}

interface VideoLinkBlob extends LinkContentBlob {
    type: ContentType_Enum.VideoLink;
}

interface VideoPrepublishBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoPrepublish;
}

interface VideoSponsorsFillerBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoSponsorsFiller;
}

interface VideoTitlesBlob extends VideoContentBlob {
    type: ContentType_Enum.VideoTitles;
}

interface VideoUrlBlob extends UrlContentBlob {
    type: ContentType_Enum.VideoUrl;
}

/* Meta content types */

interface TextualContentBlob extends BaseContentBlob {
    text: string;
}

interface FileContentBlob extends BaseContentBlob {
    s3Url: string;
}

interface UrlContentBlob extends BaseContentBlob {
    url: string;
}

interface LinkContentBlob extends BaseContentBlob {
    text: string;
    url: string;
}

export interface VideoContentBlob extends FileContentBlob {
    transcode?: TranscodeDetails;
    subtitles: Record<LanguageCode, SubtitleDetails>;
}

type LanguageCode = string;

interface SubtitleDetails {
    s3Url: string;
    status: "IN_PROGRESS" | "FAILED" | "COMPLETED";
    message?: string;
}

interface TranscodeDetails {
    s3Url?: string;
    status: "IN_PROGRESS" | "FAILED" | "COMPLETED";
    message?: string;
    updatedTimestamp: number;
    jobId: string;
}

interface BaseContentBlob {
    type: string;
}
