import { gql } from "@apollo/client";
import React, { useCallback, useMemo } from "react";
import { useSelectReadUpToIndexQuery } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";

gql`
    query SelectReadUpToIndex($chatId: uuid!, $attendeeId: uuid!) {
        chat_ReadUpToIndex_by_pk(chatId: $chatId, attendeeId: $attendeeId) {
            chatId
            attendeeId
            messageId
        }
    }

    mutation SetReadUpToIndex($chatId: uuid!, $attendeeId: uuid!, $messageId: Int!) {
        insert_chat_ReadUpToIndex(
            objects: { attendeeId: $attendeeId, chatId: $chatId, messageId: $messageId }
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [messageId] }
        ) {
            affected_rows
        }
    }
`;

interface ReadUpToIndexCtx {
    readUpToId: number | undefined;
    readUpToMarkerSeen: () => void;
}

const ReadUpToIndexContext = React.createContext<ReadUpToIndexCtx | undefined>(undefined);

export function useReadUpToIndex(): ReadUpToIndexCtx {
    const ctx = React.useContext(ReadUpToIndexContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

function ReadUpToIndexProvider_UserExists({
    children,
    attendeeId,
    chatId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    attendeeId: string;
    chatId: string;
}): JSX.Element {
    const unreadQ = useSelectReadUpToIndexQuery({
        variables: {
            attendeeId,
            chatId,
        },
        pollInterval: 20000,
        fetchPolicy: "cache-and-network",
    });

    // const [setUnread] = useSetReadUpToIndexMutation();
    // const messages = useReceiveMessageQueries();
    // const lastUnreadId = useRef<number | null>(null);

    // useEffect(() => {
    //     if (messages.liveMessages && messages.liveMessages.size > 0) {
    //         const nextUnreadId = [...messages.liveMessages.keys()].sort((x, y) => y - x)[0];
    //         if (lastUnreadId.current !== nextUnreadId) {
    //             lastUnreadId.current = nextUnreadId;
    //             setUnread({
    //                 variables: {
    //                     attendeeId,
    //                     chatId,
    //                     messageId: nextUnreadId,
    //                 },
    //             });
    //         }
    //     }
    // }, [attendeeId, chatId, messages.liveMessages, setUnread]);

    const readUpToMarkerSeen = useCallback(() => {
        /* EMPTY */
    }, []);
    // const readUpToMarkerSeen = useCallback(() => {
    //     if (messages.liveMessages && messages.liveMessages.size > 0) {
    //         setUnread({
    //             variables: {
    //                 attendeeId,
    //                 chatId,
    //                 messageId: [...messages.liveMessages.keys()].sort((x, y) => y - x)[0],
    //             },
    //         });
    //     }
    // }, [attendeeId, chatId, messages.liveMessages, setUnread]);

    const st = useMemo(
        () => ({
            readUpToId: unreadQ.data?.chat_ReadUpToIndex_by_pk?.messageId,
            readUpToMarkerSeen,
        }),
        [readUpToMarkerSeen, unreadQ.data?.chat_ReadUpToIndex_by_pk?.messageId]
    );

    return <ReadUpToIndexContext.Provider value={st}>{children}</ReadUpToIndexContext.Provider>;
}

export function ReadUpToIndexProvider_NoUser({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const ctx = useMemo(
        () => ({
            readUpToId: undefined,
            readUpToMarkerSeen: () => {
                /* EMPTY */
            },
        }),
        []
    );

    return <ReadUpToIndexContext.Provider value={ctx}>{children}</ReadUpToIndexContext.Provider>;
}

export default function ReadUpToIndexProvider({
    children,
    chatId,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    chatId: string;
}): JSX.Element {
    const config = useChatConfiguration();

    if (config.currentAttendeeId) {
        return (
            <ReadUpToIndexProvider_UserExists chatId={chatId} attendeeId={config.currentAttendeeId}>
                {children}
            </ReadUpToIndexProvider_UserExists>
        );
    } else {
        return <ReadUpToIndexProvider_NoUser>{children}</ReadUpToIndexProvider_NoUser>;
    }
}
