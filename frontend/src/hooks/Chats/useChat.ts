import React from "react";
import type {
    LiveChatSubscription,
    SelectChatQuery,
} from "../../generated/graphql";

type ChatInfo = {
    chat: SelectChatQuery | false | null;
    live: LiveChatSubscription | false | null;
    refetchChat: () => Promise<unknown>;
};

export const defaultChatContext: ChatInfo = {
    chat: null,
    live: null,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    refetchChat: async function (): Promise<void> {},
};

export const ChatContext = React.createContext<ChatInfo>(defaultChatContext);

export default function useChat(): ChatInfo {
    return React.useContext(ChatContext);
}
