import { useInterpret } from "@xstate/react";
import type { PropsWithChildren } from "react";
import React, { createContext } from "react";
import type { InterpreterFrom } from "xstate";
import { liveTranscriptMachine } from "./LiveTranscriptMachine";

export interface Props {}

function useValue(_props: Props): InterpreterFrom<typeof liveTranscriptMachine> {
    return useInterpret(liveTranscriptMachine);
}

export const LiveTranscriptContext = createContext({
    liveTranscriptService: {} as ReturnType<typeof useValue>,
});

export const LiveTranscriptProvider = (props: PropsWithChildren<Props>) => {
    return (
        <LiveTranscriptContext.Provider value={{ liveTranscriptService: useValue(props) }}>
            {props.children}
        </LiveTranscriptContext.Provider>
    );
};
