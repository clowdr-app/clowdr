import type * as portals from "react-reverse-portal";

export interface Viewport {
    connectionId: string;
    streamId?: string;
    associatedIds?: string[];

    component: portals.HtmlPortalNode;
    type: "screen" | "camera";
    isSelf: boolean;
    joinedAt: number;
}

export enum VisualLayoutType {
    BestFit_NoScreenshare,
    BestFit_Screenshare_VerticalSplit,
    BestFit_Screenshare_HorizontalSplit,

    Single,
    Pair,
    PictureInPicture,
    Fitted4_Left,
    Fitted4_Bottom,
    DualScreen_Horizontal,
    DualScreen_Vertical,
}

export type VisualLayout = (
    | VizLayout_BestFit_NoScreenshare
    | VizLayout_BestFit_Screenshare
    | VizLayout_Single
    | VizLayout_Pair
    | VizLayout_PiP
    | VizLayout_Fitted4
    | VizLayout_DualScreen
) &
    VizLayout_OverflowArea;

export interface VizLayout_OverflowArea {
    overflowViewports: Viewport[];
}

export interface VizLayout_BestFit_NoScreenshare {
    type: VisualLayoutType.BestFit_NoScreenshare;
    /** Minimum length 0. Maximum length 16. */
    viewports: Viewport[];
}

export interface VizLayout_BestFit_Screenshare {
    type: VisualLayoutType.BestFit_Screenshare_HorizontalSplit | VisualLayoutType.BestFit_Screenshare_VerticalSplit;
    screenshareViewport?: Viewport;
    /** Minimum length 0. Maximum length 6. */
    viewports: Viewport[];
}

export interface VizLayout_Single {
    type: VisualLayoutType.Single;
    viewport?: Viewport;
}

export interface VizLayout_Pair {
    type: VisualLayoutType.Pair;
    leftViewport?: Viewport;
    rightViewport?: Viewport;
}

export interface VizLayout_PiP {
    type: VisualLayoutType.PictureInPicture;
    fullscreenViewport?: Viewport;
    insetViewport?: Viewport;
}

export interface VizLayout_Fitted4 {
    type: VisualLayoutType.Fitted4_Left | VisualLayoutType.Fitted4_Bottom;
    largeAreaViewport?: Viewport;
    /** Minimum length 0. Maximum length 4. */
    sideAreaViewports: (Viewport | undefined)[];
}

export interface VizLayout_DualScreen {
    type: VisualLayoutType.DualScreen_Horizontal | VisualLayoutType.DualScreen_Vertical;
    narrow: 1 | 2 | null;
    largeAreaViewport1?: Viewport;
    largeAreaViewport2?: Viewport;
    /** Minimum length 0. Maximum length 4. */
    sideAreaViewports: (Viewport | undefined)[];
}
