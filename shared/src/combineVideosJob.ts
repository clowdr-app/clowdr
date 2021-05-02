export interface CombineVideosJobDataBlob {
    inputContentItems: InputElement[];
}

export interface InputElement {
    contentItemId: string;
    includeSubtitles: boolean;
}
