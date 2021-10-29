import { assert } from "@midspace/assert";
import React, { useEffect, useMemo, useState } from "react";
import type { Chat_MessageType_Enum } from "../../../generated/graphql";
import { useChatConfiguration } from "../Configuration";
import type { MessageData } from "../Types/Messages";

type SendMesasageCallback = (
    chatId: string,
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
        assert.truthy(
            config.state?.IsSending !== undefined,
            "config.state is null. Chat state is not available in the current context."
        );
        return config.state.IsSending.subscribe((v) => {
            setIsSending(v);
        });
    }, [config.state?.IsSending]);
    const ctx = useMemo(() => {
        assert.truthy(config.state, "config.state is null. Chat state is not available in the current context.");
        return {
            send: config.state.send.bind(config.state),
            isSending,
        };
    }, [config.state, isSending]);

    return <SendMessageQueriesContext.Provider value={ctx}>{children}</SendMessageQueriesContext.Provider>;
}
