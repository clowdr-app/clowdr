import * as R from "ramda";
import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useMemo } from "react";
import { useRestorableState } from "../../../../Hooks/useRestorableState";

function useValue() {
    const [downloadedElementIds, setDownloadedElementIds] = useRestorableState<string[]>(
        "MIDSPACE_DOWNLOADED_ELEMENT_IDS",
        [],
        JSON.stringify,
        JSON.parse
    );

    const addDownloadedElementId = useCallback(
        (id: string) => {
            setDownloadedElementIds((ids) => R.union(ids, [id]));
        },
        [setDownloadedElementIds]
    );

    const reset = useCallback(() => setDownloadedElementIds([]), [setDownloadedElementIds]);

    return useMemo(
        () => ({
            downloadedElementIds,
            setDownloadedElementIds,
            addDownloadedElementId,
            reset,
        }),
        [addDownloadedElementId, downloadedElementIds, reset, setDownloadedElementIds]
    );
}

export const VideoDownloadContext = createContext({} as ReturnType<typeof useValue>);

export function VideoDownloadProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return <VideoDownloadContext.Provider value={useValue()}>{props.children}</VideoDownloadContext.Provider>;
}
