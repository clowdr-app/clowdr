import type { EventStreamMarshaller, Message as AWSEventStreamMessage } from "@aws-sdk/eventstream-marshaller";
import * as marshaller from "@aws-sdk/eventstream-marshaller";
import * as util_utf8_node from "@aws-sdk/util-utf8-node";
import { useEffect, useMemo, useState } from "react";
import { gql } from "urql";
import { useTranscribeGeneratePresignedUrlQuery } from "../../../../../generated/graphql";
import { downsampleBuffer, pcmEncode } from "./AudioEncoding";

gql`
    query TranscribeGeneratePresignedUrl($languageCode: String!, $sampleRate: String!) {
        transcribeGeneratePresignedUrl(languageCode: $languageCode, sampleRate: $sampleRate) {
            url
        }
    }
`;

function convertAudioToBinaryMessage(
    audioChunk: ArrayBuffer,
    inputSampleRate: number,
    sampleRate: number,
    eventStreamMarshaller: EventStreamMarshaller
) {
    const raw = new Float32Array(audioChunk);

    if (raw == null) return;

    // downsample and convert the raw audio bytes to PCM
    const downsampledBuffer = downsampleBuffer(raw, inputSampleRate, sampleRate);
    const pcmEncodedBuffer = pcmEncode(downsampledBuffer);

    // add the right JSON headers and structure to the message
    const audioEventMessage = getAudioEventMessage(new Uint8Array(pcmEncodedBuffer));

    //convert the JSON object + headers into a binary event stream message
    const binary = eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
}

function getAudioEventMessage(buffer: Uint8Array): AWSEventStreamMessage {
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

let transcription = "";
function handleEventStreamMessage(messageJson: any) {
    const results = messageJson.Transcript.Results;

    if (results.length > 0) {
        if (results[0].Alternatives.length > 0) {
            let transcript = results[0].Alternatives[0].Transcript;
            transcript = decodeURIComponent(escape(transcript));
            console.info(transcript);
            if (!results[0].IsPartial) {
                transcription += transcript + "\n";
                console.info(transcription);
            }
        }
    }
}

const targetSampleRate = 16000;
const languageCode = "en-US";
export function useAWSTranscription(camera: OT.Publisher | null) {
    const audioContext = useMemo(() => new AudioContext(), []);
    const processorNode = useMemo(() => audioContext.createScriptProcessor(4096, 1, 1), []);
    useEffect(() => {
        processorNode.connect(audioContext.destination);
    }, [audioContext.destination, processorNode]);
    useEffect(() => {
        const audioTrack = camera?.getAudioSource();
        if (audioTrack) {
            const audioStream = new MediaStream([audioTrack]);
            const audioInput = audioContext.createMediaStreamSource(audioStream);
            audioInput.connect(processorNode);
        }
    }, [audioContext, camera, processorNode]);

    const [preSignedUrl] = useTranscribeGeneratePresignedUrlQuery({
        variables: {
            languageCode,
            sampleRate: targetSampleRate.toFixed(0),
        },
        requestPolicy: "network-only",
    });
    const eventStreamMarshaller = useMemo(
        () => new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8),
        []
    );
    const [socket, setSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
        if (socket) {
            if (socket.readyState === socket.OPEN) {
                // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
                const emptyMessage = getAudioEventMessage(new Uint8Array([]));
                const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
                socket.send(emptyBuffer);
            }
        }

        if (camera && preSignedUrl.data?.transcribeGeneratePresignedUrl) {
            const url = preSignedUrl.data.transcribeGeneratePresignedUrl.url;
            const newSocket = new WebSocket(url);
            newSocket.binaryType = "arraybuffer";
            setSocket(newSocket);

            newSocket.onopen = function () {
                processorNode.addEventListener("audioprocess", function (ev: AudioProcessingEvent) {
                    const binary = convertAudioToBinaryMessage(
                        ev.inputBuffer.getChannelData(0).buffer,
                        audioContext.sampleRate,
                        targetSampleRate,
                        eventStreamMarshaller
                    );

                    if (binary && newSocket.readyState === WebSocket.OPEN) {
                        newSocket.send(binary);
                    }
                });
            };

            newSocket.onmessage = function (message) {
                const messageWrapper = eventStreamMarshaller.unmarshall(new Uint8Array(message.data));
                const messageBody = JSON.parse(String.fromCharCode(...messageWrapper.body));
                if (messageWrapper.headers[":message-type"].value === "event") {
                    handleEventStreamMessage(messageBody);
                } else {
                    console.error("Transcribe error", messageBody.Message);
                    // TODO: transcribeException = true;
                    // TODO: showError(messageBody.Message);
                    // TODO: toggleStartStop();
                }
            };

            newSocket.onerror = function () {
                // TODO
                // TODO: toggleStartStop();
            };

            newSocket.onclose = function (_closeEvent) {
                // TODO: micStream.stop();
                // The close event immediately follows the error event; only handle one.
                // TODO:
                // if (!socketError && !transcribeException) {
                //     if (closeEvent.code != 1000) {
                //         // TODO: showError("</i><strong>Streaming Exception</strong><br>" + closeEvent.reason);
                //     }
                //     // TODO: toggleStartStop();
                // }
            };
        } else {
            setSocket(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        eventStreamMarshaller,
        camera,
        preSignedUrl.data?.transcribeGeneratePresignedUrl,
        processorNode,
        audioContext.sampleRate,
    ]);
}
