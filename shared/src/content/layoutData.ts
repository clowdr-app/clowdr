import { assertType, is } from "typescript-is";
import { Content_ElementType_Enum } from "../content";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isLayoutDataBlob(data: any): boolean {
    return is<LayoutDataBlob>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertIsLayoutDataBlob(data: any): asserts data is LayoutDataBlob {
    assertType<LayoutDataBlob>(data);
}

export type LayoutDataBlob =
    | ExploreProgramButtonLayoutDataBlob
    | ExploreScheduleButtonLayoutDataBlob
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
    | ZoomLayoutDataBlob
    | LiveProgramRoomsLayoutDataBlob
    | ActiveSocialRoomsLayoutDataBlob
    | SponsorBoothsLayoutDataBlob
    | DividerLayoutDataBlob;

export interface BaseLayoutDataBlob {
    wide: boolean;
    hidden: boolean;
    priority: number;
}

export interface AbstractLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.Abstract;
}

export interface ContentGroupListLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.ContentGroupList;
}

export interface TextLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.Text;
}

export interface ImageFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.ImageFile;
    isLogo?: boolean;
}

export interface PaperFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.PaperFile;
}

export interface PosterFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.PosterFile;
}

export interface ImageUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.ImageUrl;
    isLogo?: boolean;
}

export interface LinkLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.Link;
}

export interface PaperUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.PaperUrl;
}

export interface PosterUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.PosterUrl;
}

export interface LinkButtonLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.LinkButton;
}

export interface PaperLinkLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.PaperLink;
}

export interface VideoBroadcastLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoBroadcast;
}

export interface VideoCountdownLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoCountdown;
}

export interface VideoFileLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoFile;
}

export interface VideoFillerLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoFiller;
}

export interface VideoLinkLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoLink;
}

export interface VideoPrepublishLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoPrepublish;
}

export interface VideoSponsorsFillerLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoSponsorsFiller;
}

export interface VideoTitlesLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoTitles;
}

export interface VideoUrlLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.VideoUrl;
}

export interface WholeScheduleLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.WholeSchedule;
}

export interface ExploreProgramButtonLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.ExploreProgramButton;
}

export interface ExploreScheduleButtonLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.ExploreScheduleButton;
}

export interface ZoomLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.Zoom;
}

export interface LiveProgramRoomsLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.LiveProgramRooms;
}

export interface ActiveSocialRoomsLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.ActiveSocialRooms;
}

export interface SponsorBoothsLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.SponsorBooths;
}

export interface DividerLayoutDataBlob extends BaseLayoutDataBlob {
    contentType: Content_ElementType_Enum.Divider;
}
