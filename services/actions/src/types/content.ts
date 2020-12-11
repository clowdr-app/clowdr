import { ContentType_Enum } from "../generated/graphql";

export interface ContentItemDataBlob {
    versions: ContentItemVersionData[];
}

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

interface VideoContentBlob extends FileContentBlob {
    subtitleS3Urls: any;
    transcodedS3Url?: string;
}

interface BaseContentBlob {
    type: string;
}
