import { useActor, useSelector } from "@xstate/react";
import { useContext } from "react";
import type { StateFrom } from "xstate";
import { LiveTranscriptContext } from "./LiveTranscriptContext";
import type { liveTranscriptMachine } from "./LiveTranscriptMachine";

function getWebSocket(actor: StateFrom<typeof liveTranscriptMachine>): WebSocket | null {
    return actor.context.webSocket;
}

export function useLiveTranscript(): void {
    const { liveTranscriptService } = useContext(LiveTranscriptContext);
    const [state, send] = useActor(liveTranscriptService);

    const webSocket = useSelector(liveTranscriptService, getWebSocket);
}
