import { Box } from "@chakra-ui/react";
import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { useAWSTranscription } from "../Transcription/AWSTranscribe";
import { AutoplayAlert } from "../VideoChat/AutoplayAlert";
import { RecordingAlert } from "./Components/RecordingAlert";
import { InCall } from "./InCall";
import { PreJoin } from "./PreJoin";
import { VonageComputedStateContext } from "./State/VonageComputedStateContext";
import { useVonageRoom, VonageRoomStateActionType } from "./State/VonageRoomProvider";

export function VonageRoomInner({
    stop,
    roomId,
    eventId,
}: {
    stop: boolean;
    cancelJoin?: () => void;
    roomId?: string;
    eventId?: string;
}): JSX.Element {
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);

    const { state, dispatch } = useVonageRoom();
    const { camera, connected, joining, vonage, leaveRoom } = useContext(VonageComputedStateContext);

    const registrant = useCurrentRegistrant();

    const onPartialTranscript = useCallback<(transcript: string) => void>(
        (transcript) => {
            vonage.sendTranscript(registrant.id, registrant.displayName, true, transcript);
        },
        [registrant.displayName, registrant.id, vonage]
    );
    const onCompleteTranscript = useCallback<(transcript: string) => void>(
        (transcript) => {
            vonage.sendTranscript(registrant.id, registrant.displayName, false, transcript);
        },
        [registrant.displayName, registrant.id, vonage]
    );
    useAWSTranscription(camera, onPartialTranscript, onCompleteTranscript);

    const uiEl = useMemo(
        () =>
            connected ? <InCall /> : <PreJoin cameraPreviewRef={cameraPreviewRef} roomId={roomId} eventId={eventId} />,
        [connected, roomId, eventId]
    );

    // Camera / microphone enable/disable control
    useEffect(() => {
        if (stop) {
            // Disconnect from the Vonage session, then soft-disable the microphone and camera
            leaveRoom().catch((e) => console.error("Failed to leave Vonage room", e));
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: false,
                explicitlyDisabled: state.microphoneExplicitlyDisabled,
                onError: undefined,
            });
            dispatch({
                type: VonageRoomStateActionType.SetCameraIntendedState,
                cameraEnabled: false,
                explicitlyDisabled: state.cameraExplicitlyDisabled,
                onError: undefined,
            });
        } else if (!connected && !joining) {
            // Auto-start devices if we already have MediaStreams available
            if (
                !state.cameraExplicitlyDisabled &&
                state.cameraStream?.getVideoTracks().some((t) => t.readyState === "live")
            ) {
                dispatch({
                    type: VonageRoomStateActionType.SetCameraIntendedState,
                    cameraEnabled: true,
                    onError: () => {
                        dispatch({
                            type: VonageRoomStateActionType.SetCameraMediaStream,
                            mediaStream: "disabled",
                        });
                    },
                });
            }
            if (
                !state.microphoneExplicitlyDisabled &&
                state.microphoneStream?.getAudioTracks().some((t) => t.readyState === "live")
            ) {
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                    microphoneEnabled: true,
                    onError: () => {
                        dispatch({
                            type: VonageRoomStateActionType.SetMicrophoneMediaStream,
                            mediaStream: "disabled",
                        });
                    },
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stop]);

    return (
        <Box w="100%" isolation="isolate">
            <AutoplayAlert connected={connected} />
            <RecordingAlert />
            {uiEl}
        </Box>
    );
}
