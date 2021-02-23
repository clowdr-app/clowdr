import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useChatConfiguration } from "../Configuration";
import type { MutableQuery } from "../Types/Queries";

export interface PinnedQuery
    extends MutableQuery<
        {
            isPinned: boolean;
            allowedToUnpin: boolean;
        },
        boolean
    > {}

const QueryContext = createContext<PinnedQuery | undefined>(undefined);

export function ChatPinnedQueryProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const config = useChatConfiguration();
    const [isPinned, setIsPinned] = useState<boolean | null>(null);

    useEffect(() => {
        return config.state.IsPinned.subscribe(setIsPinned);
    }, [config.state.IsPinned]);

    const data = useMemo(
        () => ({
            isPinned: isPinned ?? false,
            allowedToUnpin: !config.state.EnableMandatoryPin,
        }),
        [config.state.EnableMandatoryPin, isPinned]
    );

    const mutate = useCallback(async () => {
        await config.state.togglePinned();
    }, [config.state]);

    const value: PinnedQuery = useMemo(
        () => ({
            data,
            error: undefined,
            loading: isPinned === null || config.state.IsTogglingPinned,
            mutate,
        }),
        [config.state.IsTogglingPinned, data, isPinned, mutate]
    );

    return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useChatPinnedQuery(): PinnedQuery {
    const ctx = React.useContext(QueryContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
