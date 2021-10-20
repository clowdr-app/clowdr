import * as R from "ramda";
import type { PropsWithChildren} from "react";
import React, { createContext, useCallback } from "react";
import { useRestorableState } from "../../../../Generic/useRestorableState";

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

    return {
        downloadedElementIds,
        setDownloadedElementIds,
        addDownloadedElementId,
        reset,
    };
}

export const VideoDownloadContext = createContext({} as ReturnType<typeof useValue>);

export function VideoDownloadProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return <VideoDownloadContext.Provider value={useValue()}>{props.children}</VideoDownloadContext.Provider>;
}
