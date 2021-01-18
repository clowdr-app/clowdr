import { assertType, is } from "typescript-is";
import { ContentType_Enum } from "../content";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isLayoutDataBlob(data: any): boolean {
    return is<LayoutDataBlob>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertIsLayoutDataBlob(data: any): asserts data is LayoutDataBlob {
    assertType<LayoutDataBlob>(data);
}

export type LayoutDataBlob =
    | AbstractLayoutDataBlob
    | ContentGroupListLayoutDataBlob
    | TextLayoutDataBlob
    | ImageFileLayoutDataBlob
    | PaperFileLayoutDataBlob
    | PosterFileLayoutDataBlob
    | ImageUrlLayoutDataBlob
    | LinkLayoutDataBlob
    | PaperUrlLayoutDataBlob
    | PosterUrlLayoutDataBlob
    | LinkButtonLayoutDataBlob
    | PaperLinkLayoutDataBlob
    | VideoBroadcastLayoutDataBlob
    | VideoCountdownLayoutDataBlob
    | VideoFileLayoutDataBlob
    | VideoFillerLayoutDataBlob
    | VideoLinkLayoutDataBlob
    | VideoPrepublishLayoutDataBlob
    | VideoSponsorsFillerLayoutDataBlob
    | VideoTitlesLayoutDataBlob
    | VideoUrlLayoutDataBlob
    | WholeScheduleLayoutDataBlob
    | ZoomLayoutDataBlob;

export interface BaseLayoutDataBlob {
    wide: boolean;
    hidden: boolean;
    priority: number;
}

export interface AbstractLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.Abstract;
}

export interface ContentGroupListLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.ContentGroupList;
}

export interface TextLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.Text;
}

export interface ImageFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.ImageFile;
}

export interface PaperFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.PaperFile;
}

export interface PosterFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.PosterFile;
}

export interface ImageUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.ImageUrl;
    isLogo: boolean;
}

export interface LinkLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.Link;
}

export interface PaperUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.PaperUrl;
}

export interface PosterUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.PosterUrl;
}

export interface LinkButtonLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.LinkButton;
}

export interface PaperLinkLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.PaperLink;
}

export interface VideoBroadcastLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoBroadcast;
}

export interface VideoCountdownLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoCountdown;
}

export interface VideoFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoFile;
}

export interface VideoFillerLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoFiller;
}

export interface VideoLinkLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoLink;
}

export interface VideoPrepublishLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoPrepublish;
}

export interface VideoSponsorsFillerLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoSponsorsFiller;
}

export interface VideoTitlesLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoTitles;
}

export interface VideoUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.VideoUrl;
}

export interface WholeScheduleLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.WholeSchedule;
}

export interface ZoomLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: ContentType_Enum.Zoom;
}
