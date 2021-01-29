export interface CombineVideosJobDataBlob {
    inputContentItems: InputContentItem[];
}

interface InputContentItem {
    contentItemId: string;
    includeSubtitles: boolean;
}
