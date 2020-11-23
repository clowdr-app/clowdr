import React from "react";
import type {
    LiveChatSubscription,
    SelectChatQuery,
} from "../../generated/graphql";

type ChatInfo = {
    chatId: string;
    chat: SelectChatQuery | false | null;
    live: LiveChatSubscription | false | null;
    refetchChat: () => Promise<unknown>;
    sendMessage: (content: any) => Promise<unknown>;
    sendingMessage: boolean;
    sendMessageError: string | false;
};

export const defaultChatContext: ChatInfo = {
    chatId: "",
    chat: null,
    live: null,
    refetchChat: async function (): Promise<void> { return undefined; },
    sendMessage: async function (_content): Promise<void> { return undefined; },
    sendingMessage: false,
    sendMessageError: false
};

export const ChatContext = React.createContext<ChatInfo>(defaultChatContext);

export default function useChat(): ChatInfo {
    return React.useContext(ChatContext);
}
