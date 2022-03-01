import { useCallback, useRef } from "react";
import type { TranscriptData } from "../State/VonageGlobalState";

export function useTranscript() {
    const onTranscriptRef = useRef<((data: TranscriptData) => void) | undefined>(undefined);
    const onTranscript = useCallback((data: TranscriptData) => {
        onTranscriptRef.current?.(data);
    }, []);

    return { onTranscript, onTranscriptRef };
}
