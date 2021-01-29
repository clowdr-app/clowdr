export interface CombineVideosJobDataBlob {
    inputContentItems: InputContentItem[];
}

export interface InputContentItem {
    contentItemId: string;
    includeSubtitles: boolean;
}
