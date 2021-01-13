import { gql } from "@apollo/client";
import React, { useCallback, useEffect, useState } from "react";
import { useSelectReadUpToIndexQuery, useSetReadUpToIndexMutation } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import { useReceiveMessageQueries } from "./ReceiveMessageQueries";

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
    onScrollUp: () => void;
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
    });
    const [setUnread] = useSetReadUpToIndexMutation();
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
    const [hasScrolledUp, setHasScrolledUp] = useState<boolean>(false);

    const messages = useReceiveMessageQueries();

    useEffect(() => {
        if (messages.liveMessages && messages.liveMessages.size > 0) {
            if (hasScrolledUp && lastUpdateTime < Date.now() - 60000) {
                setLastUpdateTime(Date.now());
                setUnread({
                    variables: {
                        attendeeId,
                        chatId,
                        messageId: [...messages.liveMessages.keys()].sort((x, y) => y - x)[0]
                    }
                });
            }
        }
    }, [attendeeId, chatId, hasScrolledUp, lastUpdateTime, messages.liveMessages, setUnread]);

    const readUpToMarkerSeen = useCallback(() => {
        if (messages.liveMessages && messages.liveMessages.size > 0) {
            setUnread({
                variables: {
                    attendeeId,
                    chatId,
                    messageId: [...messages.liveMessages.keys()].sort((x, y) => y - x)[0]
                }
            });
        }
    }, [attendeeId, chatId, messages.liveMessages, setUnread]);

    return <ReadUpToIndexContext.Provider value={{
        readUpToId: unreadQ.data?.chat_ReadUpToIndex_by_pk?.messageId,
        readUpToMarkerSeen,
        onScrollUp: () => setHasScrolledUp(true),
    }}>{children}</ReadUpToIndexContext.Provider>;
}

export function ReadUpToIndexProvider_NoUser({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    return (
        <ReadUpToIndexContext.Provider
            value={{
                readUpToId: undefined,
                readUpToMarkerSeen: () => {
                    /* EMPTY */
                },
                onScrollUp: () => {
                    /* EMPTY */
                },
            }}
        >
            {children}
        </ReadUpToIndexContext.Provider>
    );
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
