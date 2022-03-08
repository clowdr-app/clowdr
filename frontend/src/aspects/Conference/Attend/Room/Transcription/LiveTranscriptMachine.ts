import type { EventStreamMarshaller } from "@aws-sdk/eventstream-marshaller";
import { assign, createMachine } from "xstate";
import { getAudioContext } from "../../../../Utils/getAudioContext";
import transcriptWorkletUrl from "./TranscriptionWorklet?url";

export interface AudioGraph {
    inputNode: MediaStreamAudioSourceNode;
    transcriptNode: AudioWorkletNode;
}

export const liveTranscriptMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QBcD2UoBswDoCWAdgIYDGyeAbmAMQAqA8gOKMAyAooqAA6qx7moCnEAA9EARgDMAdhySALNIAM0gGzzxqpeICsqgEwAaEAE8JCnEv3SAnKplL5Nu+IAcAX3fG0GbDlLkVHRMrBxIIDx8AkLhYghSsgrKahpaugbGZgjKltY2rvKq4jbi8koGnl4gBKgQcMI+WLiEAZRgwpH8eILCcfJGpoiuqnI6xaolmk46Op7e6E3+ZG0dvF09sYj6EzhF2676+kol8geqmUOuOK5jdpPqNjNzII3Yq1HdMaBxbhcIALT6HA2aTFVwFEr6eQ6JQ3SruIA */
    createMachine(
        {
            // eslint-disable-next-line @typescript-eslint/consistent-type-imports
            tsTypes: {} as import("./LiveTranscriptMachine.typegen").Typegen0,
            id: "toggle",
            initial: "inactive",
            schema: {
                context: {} as {
                    mediaStreamTrack: MediaStreamTrack | null;
                    eventStreamMarshaller: EventStreamMarshaller;
                    targetSampleRate: number;
                    audioContext: AudioContext | null;
                    webSocketUrl: string;
                    webSocket: WebSocket | null;
                    audioGraph: AudioGraph | null;
                },
                events: {} as
                    | { type: "MEDIA_CHANGED"; value: MediaStreamTrack | null }
                    | { type: "WEBSOCKET_OPEN" }
                    | { type: "WEBSOCKET_CLOSED" },
                services: {} as {
                    initialiseWebSocket: {
                        data: WebSocket;
                    };
                    initialiseAudioContext: {
                        data: AudioGraph;
                    };
                },
            },
            states: {
                inactive: {
                    on: {
                        MEDIA_CHANGED: {
                            actions: "updateMediaStreamTrack",
                            target: "initialisingWebSocket",
                        },
                    },
                },
                initialisingWebSocket: {
                    invoke: {
                        src: "initialiseWebSocket",
                        onDone: {
                            target: "initialisingAudioContext",
                            actions: "updateWebSocket",
                        },
                        onError: {
                            target: "error",
                        },
                    },
                },
                initialisingAudioContext: {
                    invoke: {
                        src: "initialiseAudioContext",
                        onDone: {
                            target: "running",
                            actions: "updateAudioGraph",
                        },
                        onError: {
                            target: "error",
                        },
                    },
                },
                running: {},
                error: {},
            },
        },
        {
            actions: {
                updateMediaStreamTrack: assign({
                    mediaStreamTrack: (_context, event) => event.value,
                }),
                updateAudioGraph: assign({
                    audioGraph: (_context, event) => event.data,
                }),
                updateWebSocket: assign({
                    webSocket: (_context, event) => event.data,
                }),
            },
            services: {
                initialiseAudioContext: async (context) => {
                    if (!context.mediaStreamTrack) {
                        throw new Error("No MediaStreamTrack available");
                    }

                    const audioContext = getAudioContext();

                    if (!audioContext) {
                        throw new Error("Could not get an AudioContext");
                    }
                    await audioContext.audioWorklet.addModule(transcriptWorkletUrl);
                    const transcriptNode = new AudioWorkletNode(audioContext, "transcript-processor", {
                        processorOptions: {
                            socket: context.webSocket,
                            inputSampleRate: context.mediaStreamTrack.getSettings()["sampleRate"],
                            targetSampleRate: context.targetSampleRate,
                            eventStreamMarshaller: context.eventStreamMarshaller,
                        },
                    });

                    const audioStream = new MediaStream([context.mediaStreamTrack]);
                    const audioInput = audioContext.createMediaStreamSource(audioStream);
                    audioInput.connect(transcriptNode);

                    return {
                        inputNode: audioInput,
                        transcriptNode,
                    };
                },
                initialiseWebSocket: async (context) => {
                    const socket = new WebSocket(context.webSocketUrl);
                    socket.binaryType = "arraybuffer";
                    return socket;
                },
            },
        }
    );
