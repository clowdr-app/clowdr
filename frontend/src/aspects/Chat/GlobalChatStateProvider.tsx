import { useApolloClient } from "@apollo/client";
import React, { useEffect, useMemo } from "react";
import { useConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { GlobalChatState } from "./ChatGlobalState";

export const GlobalChatStateContext = React.createContext<GlobalChatState | undefined>(undefined);

export function useMaybeGlobalChatState(): GlobalChatState | undefined {
    return React.useContext(GlobalChatStateContext);
}

export function useGlobalChatState(): GlobalChatState {
    const ctx = React.useContext(GlobalChatStateContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function GlobalChatStateProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const conference = useConference();
    const registrant = useMaybeCurrentRegistrant();
    const client = useApolloClient();
    const state = useMemo(() => (registrant ? new GlobalChatState(conference, registrant, client) : undefined), [
        registrant,
        conference,
        client,
    ]);

    useEffect(() => {
        state?.init();

        return () => {
            state?.teardown();
        };
    }, [state]);

    return <GlobalChatStateContext.Provider value={state}>{children}</GlobalChatStateContext.Provider>;
}
