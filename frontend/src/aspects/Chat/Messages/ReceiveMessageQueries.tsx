import { gql } from "@apollo/client";
import React, { useCallback, useMemo } from "react";
import { useSelectSingleMessageQuery } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";

gql`
    fragment ChatFlagData on chat_Flag {
        discussionChatId
        flaggedById
        id
        messageId
        notes
        resolution
        resolved_at
        type
        updated_at
        created_at
    }

    query SelectSingleMessage($id: Int!) {
        chat_Message_by_pk(id: $id) {
            ...ChatMessageData
        }
    }
`;

// type LoadF = (
//     index: number | null,
//     count: number
// ) => Promise<{ nextIndex: number | null; newItems: Map<number, ChatMessageDataFragment> } | false>;

interface ReceiveMessageQueriesCtx {
    refetch: (id: number) => void;
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
    const refetchSingleMessageQ = useSelectSingleMessageQuery({
        skip: true,
        fetchPolicy: "network-only",
    });

    const refetch = useCallback(
        (id: number) => {
            refetchSingleMessageQ.refetch({
                id,
            });
        },
        [refetchSingleMessageQ]
    );

    const ctx = useMemo(
        () => ({
            refetch,
            delete: config.state.deleteMessage.bind(config.state),
            setAnsweringQuestionId,
        }),
        [config.state, refetch, setAnsweringQuestionId]
    );

    return <ReceiveMessageQueriesContext.Provider value={ctx}>{children}</ReceiveMessageQueriesContext.Provider>;
}
