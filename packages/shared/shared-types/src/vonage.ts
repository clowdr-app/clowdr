import { assertType, is } from "typescript-is";

export type VonageSessionLayoutData =
    | BestFitLayout
    | SingleLayout
    | PairLayout
    | PictureInPictureLayout
    | Fitted4Layout
    | DualScreenLayout;

export type ParticipantPlacement =
    | {
          streamId: string;
      }
    | {
          connectionId: string;
      }
    | null
    | undefined;

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
    position1?: ParticipantPlacement;
}

export interface PairLayout {
    type: VonageSessionLayoutType.Pair;
    /** Left stream */
    position1?: ParticipantPlacement;
    /** Right stream */
    position2?: ParticipantPlacement;
}

export interface PictureInPictureLayout {
    type: VonageSessionLayoutType.PictureInPicture;
    /** Large, focused area stream */
    position1?: ParticipantPlacement;
    /** Small, corner stream */
    position2?: ParticipantPlacement;
}

export interface Fitted4Layout {
    type: VonageSessionLayoutType.Fitted4;
    /** Where to place the small streams */
    side: "left" | "bottom";
    /** Large, focused area stream */
    position1?: ParticipantPlacement;
    /** Small, side area stream 1 */
    position2?: ParticipantPlacement;
    /** Small, side area stream 2 */
    position3?: ParticipantPlacement;
    /** Small, side area stream 3 */
    position4?: ParticipantPlacement;
    /** Small, side area stream 4 */
    position5?: ParticipantPlacement;
}

export interface DualScreenLayout {
    type: VonageSessionLayoutType.DualScreen;
    splitDirection: "horizontal" | "vertical";
    narrowStream?: 1 | 2 | null;
    /** Large, focused area stream (Left / Top) */
    position1?: ParticipantPlacement;
    /** Large, focused area stream (Right / Bottom) */
    position2?: ParticipantPlacement;
    /** Small, side area stream 1 */
    position3?: ParticipantPlacement;
    /** Small, side area stream 2 */
    position4?: ParticipantPlacement;
    /** Small, side area stream 3 */
    position5?: ParticipantPlacement;
    /** Small, side area stream 4 */
    position6?: ParticipantPlacement;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isVonageSessionLayoutData(data: any): boolean {
    return is<VonageSessionLayoutData>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertVonageSessionLayoutData(data: any): asserts data is VonageSessionLayoutData {
    assertType<VonageSessionLayoutData>(data);
}
