import React, { useCallback } from "react";
import type {} from "../../../generated/graphql";

type IsTypingInfo = {
    isTyping: (chatId: string) => Promise<unknown>;
    isNotTyping: (chatId: string, altUserId?: string) => Promise<unknown>;
    loading: boolean;
    error: string | false;
};

export const defaultIsTypingContext: IsTypingInfo = {
    isTyping: async function doNothing() {
        return undefined;
    },
    isNotTyping: async function doNothing() {
        return undefined;
    },
    loading: false,
    error: false,
};

export const IsTypingContext = React.createContext<IsTypingInfo>(defaultIsTypingContext);

export default function useIsTyping(
    chatId: string
): {
    isTyping: () => Promise<unknown>;
    isNotTyping: (altUserId?: string) => Promise<unknown>;
    loading: boolean;
    error: string | false;
} {
    const upsertIsTypingInfo = React.useContext(IsTypingContext);
    const _isTyping = upsertIsTypingInfo.isTyping;
    const _isNotTyping = upsertIsTypingInfo.isNotTyping;
    const isTyping = useCallback(() => _isTyping(chatId), [_isTyping, chatId]);
    const isNotTyping = useCallback((altUserId?: string) => _isNotTyping(chatId, altUserId), [_isNotTyping, chatId]);
    return {
        isTyping,
        isNotTyping,
        loading: upsertIsTypingInfo.loading,
        error: upsertIsTypingInfo.error,
    };
}
