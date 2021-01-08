import React, { createContext, useMemo } from "react";
import { useSelectedChat } from "../SelectedChat";
import type { Query } from "../Types/Queries";

export interface TitleQuery extends Query<string> {}

const QueryContext = createContext<TitleQuery | undefined>(undefined);

export function ChatTitleQueryProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const selectedChat = useSelectedChat();
    const query = useMemo(
        () => ({
            data: selectedChat.label,
            error: undefined,
            loading: false,
            refetch: async () => selectedChat.label,
        }),
        [selectedChat.label]
    );

    return <QueryContext.Provider value={query}>{children}</QueryContext.Provider>;
}

export function useChatTitleQuery(): TitleQuery {
    const ctx = React.useContext(QueryContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
