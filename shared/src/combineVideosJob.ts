export interface CombineVideosJobDataBlob {
    inputElements: InputElement[];
}

export interface InputElement {
    elementId: string;
    includeSubtitles: boolean;
}
