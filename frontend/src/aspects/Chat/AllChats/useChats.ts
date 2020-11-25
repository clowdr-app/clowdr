import React from "react";
import type { SelectChatsQuery } from "../../../generated/graphql";

type ChatInfos = {
    chats: SelectChatsQuery | false | null;
    // TODO: Shouldn't be necessary once the live subscribe to new chats is implemented
    refetchChats: () => Promise<unknown>;
};

export const defaultChatsContext: ChatInfos = {
    chats: null,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    refetchChats: async function (): Promise<void> {},
};

export const ChatsContext = React.createContext<ChatInfos>(defaultChatsContext);

export default function useChats(): ChatInfos {
    return React.useContext(ChatsContext);
}
