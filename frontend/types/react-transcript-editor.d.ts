declare module "@bbc/react-transcript-editor/dist/TranscriptEditor" {
    import { Ref } from "react";

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

    export default function TranscriptEditor(props: TranscriptEditorProps): JSX.Element;
}
