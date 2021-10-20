import type { PropsWithChildren} from "react";
import React, { createContext, useState } from "react";

function useValue() {
    const [paused, setPaused] = useState<boolean>(true);

    return {
        paused,
        setPaused,
    };
}

export const EnableRoomParticipantsPollingContext = createContext({} as ReturnType<typeof useValue>);

export function EnableRoomParticipantsPollingProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return (
        <EnableRoomParticipantsPollingContext.Provider value={useValue()}>
            {props.children}
        </EnableRoomParticipantsPollingContext.Provider>
    );
}
