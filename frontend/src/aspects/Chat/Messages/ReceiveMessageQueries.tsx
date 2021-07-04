import React, { useMemo } from "react";

interface ReceiveMessageQueriesCtx {
    setAnsweringQuestionSId: React.RefObject<{ f: (sIds: string[] | null) => void; answeringSIds: string[] | null }>;
}

const ReceiveMessageQueriesContext = React.createContext<ReceiveMessageQueriesCtx | undefined>(undefined);

export function useMaybeReceiveMessageQueries(): ReceiveMessageQueriesCtx | undefined {
    return React.useContext(ReceiveMessageQueriesContext);
}

export function useReceiveMessageQueries(): ReceiveMessageQueriesCtx {
    const ctx = React.useContext(ReceiveMessageQueriesContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function ReceiveMessageQueriesProvider({
    children,
    setAnsweringQuestionSId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    setAnsweringQuestionSId: React.RefObject<{ f: (sIds: string[] | null) => void; answeringSIds: string[] | null }>;
}): JSX.Element {
    const ctx = useMemo(() => {
        return {
            setAnsweringQuestionSId,
        };
    }, [setAnsweringQuestionSId]);

    return <ReceiveMessageQueriesContext.Provider value={ctx}>{children}</ReceiveMessageQueriesContext.Provider>;
}
