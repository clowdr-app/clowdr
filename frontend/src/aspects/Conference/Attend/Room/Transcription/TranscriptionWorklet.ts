import type { EventStreamMarshaller, Message } from "@aws-sdk/eventstream-marshaller";
import { WebSocketReadyState } from "amazon-chime-sdk-js";
import { downsampleBuffer, pcmEncode } from "./AudioEncoding";

export interface Options {
    socket: WebSocket;
    inputSampleRate: number;
    targetSampleRate: number;
    eventStreamMarshaller: EventStreamMarshaller;
}

function getAudioEventMessage(buffer: Uint8Array): Message {
    // wrap the audio data in a JSON envelope
    return {
        headers: {
            ":message-type": {
                type: "string",
                value: "event",
            },
            ":event-type": {
                type: "string",
                value: "AudioEvent",
            },
        },
        body: buffer,
    };
}

function convertAudioToBinaryMessage(
    audioChunk: Float32Array,
    inputSampleRate: number,
    sampleRate: number,
    eventStreamMarshaller: EventStreamMarshaller
) {
    // downsample and convert the raw audio bytes to PCM
    const downsampledBuffer = downsampleBuffer(audioChunk, inputSampleRate, sampleRate);
    const pcmEncodedBuffer = pcmEncode(downsampledBuffer);

    // add the right JSON headers and structure to the message
    const audioEventMessage = getAudioEventMessage(new Uint8Array(pcmEncodedBuffer));

    //convert the JSON object + headers into a binary event stream message
    const binary = eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
}

class TranscriptProcessor extends AudioWorkletProcessor {
    constructor(private options: Options) {
        super();
    }

    process(inputs: Float32Array[][], _outputs: Float32Array[][]) {
        if (!inputs.length || !inputs[0].length) {
            return true;
        }

        const binary = convertAudioToBinaryMessage(
            inputs[0][0],
            this.options.inputSampleRate,
            this.options.targetSampleRate,
            this.options.eventStreamMarshaller
        );

        if (this.options.socket.readyState === WebSocketReadyState.Open) {
            this.options.socket.send(binary);
        }

        return true;
    }
}

registerProcessor("transcript-processor", (options: any) => new TranscriptProcessor(options));

export {};
