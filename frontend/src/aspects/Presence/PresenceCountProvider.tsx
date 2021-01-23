import React, { useCallback, useState } from "react";
import usePolling from "../Generic/usePolling";
import { usePresenceState } from "./PresenceStateProvider";

interface PresenceCount {
    pageCount: number | undefined;
    pageCounts: { [k: string]: number | undefined };
    observePageCount: (path: string) => number;
    unobservePageCount: (path: string, key: number) => void;
}

const PresenceCountContext = React.createContext<PresenceCount | undefined>(undefined);

export function usePresenceCount(): PresenceCount {
    const ctx = React.useContext(PresenceCountContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function PresenceCountProvider({
    children,
}: // disableSubscription,
{
    children: React.ReactNode | React.ReactNodeArray;
    disableSubscription?: boolean;
}): JSX.Element {
    const presenceState = usePresenceState();

    const [pageCount, setPageCount] = useState<number>(presenceState.getPresenceCount());
    const [pageCounts, setPageCounts] = useState(presenceState.getAllPresenceCounts());
    usePolling(
        () => {
            setPageCount(presenceState.getPresenceCount());
            setPageCounts(presenceState.getAllPresenceCounts());
        },
        5000,
        true
    );

    const observePageCount = useCallback(
        (path: string) => {
            return presenceState.observePage(path);
        },
        [presenceState]
    );

    const unobservePageCount = useCallback(
        (path: string, key: number) => {
            presenceState.unobservePage(key, path);
        },
        [presenceState]
    );

    return (
        <PresenceCountContext.Provider
            value={{
                pageCount,
                pageCounts,
                observePageCount,
                unobservePageCount,
            }}
        >
            {children}
        </PresenceCountContext.Provider>
    );
}
