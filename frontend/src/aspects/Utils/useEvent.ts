import { useCallbackRef } from "@chakra-ui/react";
import type EventEmitter from "eventemitter3";
import React from "react";

/**
 * @summary Automatically subscribe a callback to an eventemitter3 `EventEmitter`.
 * @description Based on Chakra's `useEventListener` hook.
 */
export function useEvent<
    T extends EventEmitter.EventNames<EventTypes>,
    EventTypes extends EventEmitter.ValidEventTypes = string | symbol
>(emitter: EventEmitter<EventTypes>, event: T, handler: EventEmitter.EventListener<EventTypes, T>) {
    const listener = useCallbackRef(handler);

    React.useEffect(() => {
        emitter.addListener(event, listener);
        return () => {
            emitter.removeListener(event, listener);
        };
    }, [event, listener, emitter]);

    return () => {
        emitter.removeListener(event, listener);
    };
}
