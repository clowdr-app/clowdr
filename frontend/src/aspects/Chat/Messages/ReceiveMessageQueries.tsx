import React, { useMemo } from "react";
import { useChatConfiguration } from "../Configuration";

interface ReceiveMessageQueriesCtx {
    delete: (id: number) => Promise<void>;
    setAnsweringQuestionId: React.RefObject<{ f: (ids: number[] | null) => void; answeringIds: number[] | null }>;
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
    setAnsweringQuestionId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    setAnsweringQuestionId: React.RefObject<{ f: (ids: number[] | null) => void; answeringIds: number[] | null }>;
}): JSX.Element {
    const config = useChatConfiguration();

    const ctx = useMemo(
        () => ({
            delete: config.state.deleteMessage.bind(config.state),
            setAnsweringQuestionId,
        }),
        [config.state, setAnsweringQuestionId]
    );

    return <ReceiveMessageQueriesContext.Provider value={ctx}>{children}</ReceiveMessageQueriesContext.Provider>;
}
