import React, { useEffect, useMemo } from "react";
import { useClient } from "urql";
import { useMaybeConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { GlobalChatState } from "./ChatGlobalState";
import { ReportMessageProvider } from "./Moderation/ReportMessageDialog";

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

function useValue() {
    const conference = useMaybeConference();
    const registrant = useMaybeCurrentRegistrant();
    const client = useClient();
    const state = useMemo(
        () => (registrant && conference ? new GlobalChatState(conference, registrant, client) : undefined),
        [registrant, conference, client]
    );

    useEffect(() => {
        state?.init();

        return () => {
            state?.teardown();
        };
    }, [state]);

    return state;
}

export const GlobalChatStateContext = React.createContext({} as ReturnType<typeof useValue>);

export function GlobalChatStateProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    return (
        <GlobalChatStateContext.Provider value={useValue()}>
            <ReportMessageProvider>{children}</ReportMessageProvider>
        </GlobalChatStateContext.Provider>
    );
}
