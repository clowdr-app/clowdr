import React, { useMemo } from "react";
import { useChatConfiguration } from "../Configuration";

interface ReceiveMessageQueriesCtx {
    delete: (sId: string) => Promise<void>;
    setAnsweringQuestionSId: React.RefObject<{ f: (sIds: string[] | null) => void; answeringSIds: string[] | null }>;
}

const ReceiveMessageQueriesContext = React.createContext<ReceiveMessageQueriesCtx | undefined>(undefined);

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
    const config = useChatConfiguration();

    const ctx = useMemo(
        () => ({
            delete: config.state.deleteMessage.bind(config.state),
            setAnsweringQuestionSId,
        }),
        [config.state, setAnsweringQuestionSId]
    );

    return <ReceiveMessageQueriesContext.Provider value={ctx}>{children}</ReceiveMessageQueriesContext.Provider>;
}
