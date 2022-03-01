import type { EventStreamMarshaller, Message as AWSEventStreamMessage } from "@aws-sdk/eventstream-marshaller";
import * as marshaller from "@aws-sdk/eventstream-marshaller";
import * as util_utf8_node from "@aws-sdk/util-utf8-node";
import { useConst, useId, useToast } from "@chakra-ui/react";
import { datadogLogs } from "@datadog/browser-logs";
import { useEffect, useMemo, useRef, useState } from "react";
import { gql, useClient } from "urql";
import type {
    TranscribeGeneratePresignedUrlQuery,
    TranscribeGeneratePresignedUrlQueryVariables,
} from "../../../../../generated/graphql";
import { TranscribeGeneratePresignedUrlDocument } from "../../../../../generated/graphql";
import { getAudioContext } from "../../../../Utils/getAudioContext";
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

function handleEventStreamMessage(
    messageJson: any,
    onPartialTranscript?: (transcript: string) => void,
    onCompleteTranscript?: (transcript: string) => void
) {
    const results = messageJson.Transcript.Results;

    if (results.length > 0) {
        if (results[0].Alternatives.length > 0) {
            // Amazon API specifies that with streaming transcription there will
            // only ever be one alternative.
            const result = results[0].Alternatives[0];
            const transcript = decodeURIComponent(escape(result.Transcript));
            if (!results[0].IsPartial) {
                onCompleteTranscript?.(transcript);
            } else {
                onPartialTranscript?.(transcript);
            }
        }
    }
}

const targetSampleRate = 16000;
const languageCode = "en-US";
export function useAWSTranscription(
    camera: OT.Publisher | null,
    onPartialTranscript?: (transcript: string) => void,
    onCompleteTranscript?: (transcript: string) => void
) {
    const toast = useToast();
    const errorInitializeToastId = useId();
    const errorCloseToastId = useId();

    const audioContext = useConst(getAudioContext());
    const processorNode = useMemo(() => audioContext?.createScriptProcessor(4096, 1, 1), [audioContext]);
    useEffect(() => {
        if (audioContext?.destination && processorNode) {
            processorNode.connect(audioContext.destination);
        }
    }, [audioContext?.destination, processorNode]);
    useEffect(() => {
        const audioTrack = camera?.getAudioSource();
        if (audioContext && processorNode && audioTrack) {
            const audioStream = new MediaStream([audioTrack]);
            const audioInput = audioContext.createMediaStreamSource(audioStream);
            audioInput.connect(processorNode);
        }
    }, [audioContext, camera, processorNode]);

    const [preSignedUrl, setPreSignedUrl] = useState<string | null>(null);
    const gqlClient = useClient();
    const loadingRef = useRef<boolean>(false);
    useEffect(() => {
        if (camera && !loadingRef.current) {
            loadingRef.current = true;
            (async () => {
                try {
                    const response = await gqlClient
                        .query<TranscribeGeneratePresignedUrlQuery, TranscribeGeneratePresignedUrlQueryVariables>(
                            TranscribeGeneratePresignedUrlDocument,
                            {
                                languageCode,
                                sampleRate: targetSampleRate.toFixed(0),
                            },
                            {
                                requestPolicy: "network-only",
                            }
                        )
                        .toPromise();
                    setPreSignedUrl(response.data?.transcribeGeneratePresignedUrl?.url ?? null);
                } catch (e: any) {
                    console.error("Error fetching pre-signed url for subtitling", { error: e });
                    toast({
                        status: "error",
                        position: "bottom",
                        isClosable: true,
                        title: "Error initializing closed-captioning",
                        description: "Unable to fetch AWS Transcribe url for this video-call.",
                    });
                } finally {
                    loadingRef.current = false;
                }
            })();
        }
    }, [camera, gqlClient, toast]);

    const eventStreamMarshaller = useMemo(
        () => new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8),
        []
    );
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const onPartialTranscriptRef = useRef<typeof onPartialTranscript>(onPartialTranscript);
    useEffect(() => {
        onPartialTranscriptRef.current = onPartialTranscript;
    }, [onPartialTranscript]);
    const onCompleteTranscriptRef = useRef<typeof onCompleteTranscript>(onCompleteTranscript);
    useEffect(() => {
        onCompleteTranscriptRef.current = onCompleteTranscript;
    }, [onCompleteTranscript]);

    const [intendedActive, setIntendedActive] = useState<boolean>(false);
    useEffect(() => {
        const audioTrack = camera?.getAudioSource();
        setIntendedActive(Boolean(audioTrack));
    }, [camera]);

    useEffect(() => {
        if (intendedActive && !socket) {
            if (!preSignedUrl) {
                return;
            }

            if (!audioContext || !processorNode) {
                const audioTrack = camera?.getAudioSource();
                if (camera && audioTrack) {
                    if (!toast.isActive(errorInitializeToastId)) {
                        toast({
                            status: "error",
                            position: "bottom",
                            isClosable: true,
                            title: "Error initializing closed-captioning",
                            description:
                                "Your browser does not support web audio contexts. Please use the latest version of Chrome or FireFox to enable generating closed-captions for your microphone.",
                        });
                    }
                }
                return;
            }

            const url = preSignedUrl;
            const newSocket = new WebSocket(url);
            newSocket.binaryType = "arraybuffer";
            setSocket(newSocket);

            const processAudio = function (ev: AudioProcessingEvent) {
                const binary = convertAudioToBinaryMessage(
                    ev.inputBuffer.getChannelData(0).buffer,
                    audioContext.sampleRate,
                    targetSampleRate,
                    eventStreamMarshaller
                );

                if (binary && newSocket.readyState === WebSocket.OPEN) {
                    newSocket.send(binary);
                }
            };

            const stopTranscribing = function (sock?: WebSocket) {
                processorNode.removeEventListener("audioprocess", processAudio);
                if (sock && sock.readyState === WebSocket.OPEN) {
                    sock.close();
                }
                setSocket(null);
            };

            newSocket.onopen = function () {
                processorNode.addEventListener("audioprocess", processAudio);
            };

            newSocket.onmessage = function (message) {
                const messageWrapper = eventStreamMarshaller.unmarshall(new Uint8Array(message.data));
                const messageBody = JSON.parse(String.fromCharCode(...messageWrapper.body));
                if (messageWrapper.headers[":message-type"].value === "event") {
                    handleEventStreamMessage(
                        messageBody,
                        onPartialTranscriptRef.current,
                        onCompleteTranscriptRef.current
                    );
                } else {
                    datadogLogs.logger.error("Transcribe error from AWS", { awsReason: messageBody.Message });
                    stopTranscribing(newSocket);
                }
            };

            newSocket.onerror = function () {
                stopTranscribing();
            };

            newSocket.onclose = function (closeEvent) {
                stopTranscribing();
                if (closeEvent.code != 1000) {
                    datadogLogs.logger.error("Transcribe error on close", { webSocketReason: closeEvent.reason });
                    if (!toast.isActive(errorCloseToastId)) {
                        toast({
                            id: errorCloseToastId,
                            status: "error",
                            position: "bottom",
                            isClosable: true,
                            title: "Error occurred in closed-captioning systems",
                            description:
                                "Unknown reason for AWS Transcribe failure. Closed captioining may not be functioning for your microphone.",
                        });
                    }
                }
            };
        }
    }, [
        audioContext,
        camera,
        errorCloseToastId,
        errorInitializeToastId,
        eventStreamMarshaller,
        intendedActive,
        preSignedUrl,
        processorNode,
        socket,
        toast,
    ]);
}
