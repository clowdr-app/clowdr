import React, { useEffect, useMemo, useState } from "react";
import type { Chat_MessageType_Enum } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import type { MessageData } from "../Types/Messages";

type SendMesasageCallback = (
    chatId: string,
    senderId: string,
    type: Chat_MessageType_Enum,
    message: string,
    data: MessageData,
    isPinned: boolean
) => Promise<void>;

interface SendMessageQueriesCtx {
    send: SendMesasageCallback;
    isSending: boolean;
}

const SendMessageQueriesContext = React.createContext<SendMessageQueriesCtx | undefined>(undefined);

export function useSendMessageQueries(): SendMessageQueriesCtx {
    const ctx = React.useContext(SendMessageQueriesContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function SendMessageQueriesProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const config = useChatConfiguration();
    const [isSending, setIsSending] = useState<boolean>(false);
    useEffect(() => {
        return config.state.IsSending.subscribe((v) => {
            setIsSending(v);
        });
    }, [config.state.IsSending]);
    const ctx = useMemo(
        () => ({
            send: config.state.send.bind(config.state),
            isSending,
        }),
        [config.state, isSending]
    );

    return <SendMessageQueriesContext.Provider value={ctx}>{children}</SendMessageQueriesContext.Provider>;
}
