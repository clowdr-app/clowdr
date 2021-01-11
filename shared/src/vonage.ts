export type VonageSessionLayoutData = BestFitLayout | PictureInPictureLayout | SingleLayout | PairLayout;

export enum VonageSessionLayoutType {
    BestFit,
    PictureInPicture,
    Single,
    Pair,
}

export interface BestFitLayout {
    type: VonageSessionLayoutType.BestFit;
}

export interface PictureInPictureLayout {
    type: VonageSessionLayoutType.PictureInPicture;
    focusStreamId: string;
    cornerStreamId: string;
}

export interface SingleLayout {
    type: VonageSessionLayoutType.Single;
    focusStreamId: string;
}

export interface PairLayout {
    type: VonageSessionLayoutType.Pair;
    leftStreamId: string;
    rightStreamId: string;
}
