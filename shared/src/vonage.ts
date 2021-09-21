import { assertType, is } from "typescript-is";

export type VonageSessionLayoutData =
    | BestFitLayout
    | SingleLayout
    | PairLayout
    | PictureInPictureLayout
    | Fitted4Layout
    | DualScreenLayout;

export enum VonageSessionLayoutType {
    BestFit = "BEST_FIT",
    Single = "SINGLE",
    Pair = "PAIR",
    PictureInPicture = "PICTURE_IN_PICTURE",
    Fitted4 = "FITTED_4",
    DualScreen = "DUAL_SCREEN",
}

export interface BestFitLayout {
    type: VonageSessionLayoutType.BestFit;
    /**
     * Vertical = Small streams to the left in a vertical strip
     * Horizontal = Small streams to the bottom in a horizontal strip
     */
    screenShareType: "verticalPresentation" | "horizontalPresentation";
}

export interface SingleLayout {
    type: VonageSessionLayoutType.Single;
    /** Only stream */
    stream1Id: string;
}

export interface PairLayout {
    type: VonageSessionLayoutType.Pair;
    /** Left stream */
    stream1Id: string;
    /** Right stream */
    stream2Id?: string | null;
}

export interface PictureInPictureLayout {
    type: VonageSessionLayoutType.PictureInPicture;
    /** Large, focused area stream */
    stream1Id: string;
    /** Small, corner stream */
    stream2Id: string;
}

export interface Fitted4Layout {
    type: VonageSessionLayoutType.Fitted4;
    /** Where to place the small streams */
    side: "left" | "bottom";
    /** Large, focused area stream */
    stream1Id: string;
    /** Small, side area stream 1 */
    stream2Id?: string | null;
    /** Small, side area stream 2 */
    stream3Id?: string | null;
    /** Small, side area stream 3 */
    stream4Id?: string | null;
    /** Small, side area stream 4 */
    stream5Id?: string | null;
}

export interface DualScreenLayout {
    type: VonageSessionLayoutType.DualScreen;
    splitDirection: "horizontal" | "vertical";
    narrowStream: 1 | 2 | null;
    /** Large, focused area stream (Left / Top) */
    stream1Id: string;
    /** Large, focused area stream (Right / Bottom) */
    stream2Id: string;
    /** Small, side area stream 1 */
    stream3Id?: string | null;
    /** Small, side area stream 2 */
    stream4Id?: string | null;
    /** Small, side area stream 3 */
    stream5Id?: string | null;
    /** Small, side area stream 4 */
    stream6Id?: string | null;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isVonageSessionLayoutData(data: any): boolean {
    return is<VonageSessionLayoutData>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertVonageSessionLayoutData(data: any): asserts data is VonageSessionLayoutData {
    assertType<VonageSessionLayoutData>(data);
}
