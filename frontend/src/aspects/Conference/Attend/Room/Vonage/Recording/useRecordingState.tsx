import { useCallback, useEffect, useState } from "react";

export function useRecordingState(connected: boolean, vonageSessionId: string) {
    const [isRecordingActive, setIsRecordingActive] = useState<boolean>(false);
    const onRecordingStarted = useCallback(() => {
        setIsRecordingActive(true);
    }, []);
    const onRecordingStopped = useCallback(() => {
        setIsRecordingActive(false);
    }, []);
    useEffect(() => {
        if (!connected) {
            setIsRecordingActive(false);
        }
    }, [connected]);

    useEffect(() => {
        setIsRecordingActive(false);
    }, [vonageSessionId]);

    return { isRecordingActive, onRecordingStarted, onRecordingStopped };
}
