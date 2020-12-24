interface DigitalPaperEditTranscript {
    words: DigitalPaperEditTranscriptWord[];
    paragraphs: DigitalPaperEditTranscriptParagraph[];
}

interface DigitalPaperEditTranscriptWord {
    id: number;
    start: number;
    end: number;
    text: string;
}

interface DigitalPaperEditTranscriptParagraph {
    id: number;
    start: number;
    end: number;
    speaker: string;
}

interface Props {
    srtTranscript: string;
    mediaUrl: string;
    handleSaveEditor: (srtTranscript: any) => void;
    handleChange?: () => void;
}

export type TranscriptEditorT = (props: React.PropsWithRef<Props>) => JSX.Element;

declare const Editor: TranscriptEditorT;

export default Editor;
