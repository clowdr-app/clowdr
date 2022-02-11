import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { AppLayoutContext } from "../../../../App/AppLayoutContext";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { useAWSTranscription } from "../Transcription/AWSTranscribe";
import { AutoplayAlert } from "../VideoChat/AutoplayAlert";
import { PreJoin } from "./PreJoin";
import { VonageComputedStateContext } from "./State/VonageComputedStateContext";
import { useVonageRoom, VonageRoomStateActionType } from "./State/VonageRoomProvider";
import { VonageRoomControlBar } from "./VonageRoomControlBar";

export function VonageRoomInner({
    stop,
    joinRoomButtonText,
    requireMicrophoneOrCamera,
    cancelJoin,
    roomId,
    eventId,
}: {
    stop: boolean;
    joinRoomButtonText?: string;
    requireMicrophoneOrCamera: boolean;
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

    const preJoin = useMemo(
        () => (connected ? undefined : <PreJoin cameraPreviewRef={cameraPreviewRef} />),
        [connected]
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

    const controlBarBgColor = useColorModeValue(
        "RoomControlBar.backgroundColor-light",
        "RoomControlBar.backgroundColor-dark"
    );

    const { mainPaneHeight } = useContext(AppLayoutContext);

    return (
        <Box width="100%" isolation="isolate" h={`${mainPaneHeight}px`}>
            <AutoplayAlert connected={connected} />
            <Flex
                mt={connected ? undefined : 4}
                justifyContent="center"
                alignItems="center"
                flexWrap="wrap"
                w="100%"
                pos={connected ? "absolute" : undefined}
                bottom={0}
                left={0}
                bgColor={connected ? controlBarBgColor : undefined}
                zIndex={2}
            >
                {preJoin}
                {/* Use memo'ing the control bar causes the screenshare button to not update properly 🤔 */}
                <VonageRoomControlBar
                    onCancelJoinRoom={cancelJoin}
                    joinRoomButtonText={joinRoomButtonText}
                    requireMicrophoneOrCamera={requireMicrophoneOrCamera}
                    roomId={roomId}
                    eventId={eventId}
                />
            </Flex>
        </Box>
    );
}
