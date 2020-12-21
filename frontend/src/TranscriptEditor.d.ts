interface TranscriptEditorProps {
    transcriptData: any;
    mediaUrl: string;
    handleAutoSaveChanges?: (data: any) => void;
    autoSaveContentType?: "digitalpaperedit" | "sttJsonType" | "draftjs";
    isEditable?: boolean;
    spellCheck?: boolean;
    sttJsonType?: string;
    handleAnalyticsEvents?: (event: { category: string; action: string; name: string; value: any }) => void;
    fileName?: string;
    title?: string;
    ref?: Ref;
    mediaType?: "video" | string;
}

type TranscriptEditorT = (props: React.PropsWithoutRef<TranscriptEditorProps>) => JSX.Element;

declare const module: {
    default: TranscriptEditorT;
};

export default module;
