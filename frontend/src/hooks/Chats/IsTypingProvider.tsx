import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import {
    useDeleteIsTypingMutation,
    useUpsertIsTypingMutation,
} from "../../generated/graphql";
import useUserId from "../useUserId";
import { defaultIsTypingContext, IsTypingContext } from "./useIsTyping";

const _isTypingQueries = gql`
    mutation UpsertIsTyping($chatId: uuid!, $updatedAt: timestamptz!) {
        insert_ChatTyper(
            objects: { chatId: $chatId, updatedAt: $updatedAt }
            on_conflict: {
                constraint: ChatTyper_chatId_userId_key
                update_columns: updatedAt
            }
        ) {
            returning {
                id
                updatedAt
                chatId
                userId
            }
        }
    }

    mutation DeleteIsTyping($chatId: uuid!, $userId: String!) {
        delete_ChatTyper(
            where: { chatId: { _eq: $chatId }, userId: { _eq: $userId } }
        ) {
            returning {
                id
            }
        }
    }
`;

export default function IsTypingProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const userId = useUserId();

    if (userId) {
        return (
            <IsTypingProvider_IsAuthenticated userId={userId}>
                {children}
            </IsTypingProvider_IsAuthenticated>
        );
    } else {
        return (
            <IsTypingContext.Provider value={defaultIsTypingContext}>
                {children}
            </IsTypingContext.Provider>
        );
    }
}

function IsTypingProvider_IsAuthenticated({
    children,
    userId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    userId: string;
}) {
    const [
        upsertIsTyping,
        { loading: upsertIsTypingLoading, error: upsertIsTypingError },
    ] = useUpsertIsTypingMutation();

    const [
        deleteIsTyping,
        { loading: deleteIsTypingLoading, error: deleteIsTypingError },
    ] = useDeleteIsTypingMutation();

    const isTyping = useCallback(
        async (chatId) => {
            await upsertIsTyping({
                variables: {
                    chatId,
                    updatedAt: new Date().toUTCString(),
                },
            });
        },
        [upsertIsTyping]
    );

    const isNotTyping = useCallback(
        async (chatId: string, altUserId?: string) => {
            await deleteIsTyping({
                variables: {
                    chatId,
                    userId: altUserId ?? userId,
                },
            });
        },
        [deleteIsTyping, userId]
    );

    return (
        <IsTypingContext.Provider
            value={{
                isTyping,
                isNotTyping,
                loading: upsertIsTypingLoading || deleteIsTypingLoading,
                error: upsertIsTypingError
                    ? upsertIsTypingError.message
                    : deleteIsTypingError
                    ? deleteIsTypingError.message
                    : false,
            }}
        >
            {children}
        </IsTypingContext.Provider>
    );
}
