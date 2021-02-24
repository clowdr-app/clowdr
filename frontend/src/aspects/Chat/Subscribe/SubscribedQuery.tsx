import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useChatConfiguration } from "../Configuration";
import type { MutableQuery } from "../Types/Queries";

export interface SubscribedQuery
    extends MutableQuery<
        {
            isSubscribed: boolean;
            allowedToUnsubscribe: boolean;
        },
        boolean
    > {}

const QueryContext = createContext<SubscribedQuery | undefined>(undefined);

export function ChatSubscribedQueryProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const config = useChatConfiguration();
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

    useEffect(() => {
        return config.state.IsSubscribed.subscribe(setIsSubscribed);
    }, [config.state.IsSubscribed]);

    const data = useMemo(
        () => ({
            isSubscribed: isSubscribed ?? false,
            allowedToUnsubscribe: !config.state.EnableMandatorySubscribe,
        }),
        [config.state.EnableMandatorySubscribe, isSubscribed]
    );

    const mutate = useCallback(async () => {
        await config.state.toggleSubscribed();
    }, [config.state]);

    const value: SubscribedQuery = useMemo(
        () => ({
            data,
            loading: isSubscribed === null || config.state.IsTogglingSubscribed,
            mutate,
        }),
        [config.state.IsTogglingSubscribed, data, isSubscribed, mutate]
    );

    return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useChatSubscribedQuery(): SubscribedQuery {
    const ctx = React.useContext(QueryContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
