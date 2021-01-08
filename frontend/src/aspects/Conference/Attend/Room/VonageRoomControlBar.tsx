import { SettingsIcon } from "@chakra-ui/icons";
import { Button, HStack, useDisclosure } from "@chakra-ui/react";
import React, { useCallback } from "react";
import FAIcon from "../../../Icons/FAIcon";
import { useVonageRoom, VonageRoomStateActionType } from "../../../Vonage/useVonageRoom";
import DeviceChooserModal from "./DeviceChooserModal";

export function VonageRoomControlBar({
    onJoinRoom,
    onLeaveRoom,
    inRoom,
}: {
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
    inRoom: boolean;
}): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const { isOpen, onClose, onOpen } = useDisclosure();

    const startCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: true,
        });
    }, [dispatch]);

    const stopCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
        });
    }, [dispatch]);

    const startMicrophone = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: true,
        });
    }, [dispatch]);

    const stopMicrophone = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: false,
        });
    }, [dispatch]);

    const startScreenShare = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetScreenShareIntendedState,
            screenEnabled: true,
        });
    }, [dispatch]);

    const stopScreenShare = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetScreenShareIntendedState,
            screenEnabled: false,
        });
    }, [dispatch]);

    return (
        <>
            <HStack p={2}>
                <Button leftIcon={<SettingsIcon />} onClick={onOpen}>
                    Settings
                </Button>
                {state.cameraStream ? (
                    <Button onClick={stopCamera}>
                        <FAIcon icon="video-slash" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop video</span>
                    </Button>
                ) : (
                    <Button onClick={startCamera}>
                        <FAIcon icon="video" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Start video</span>
                    </Button>
                )}
                {state.microphoneStream ? (
                    <Button onClick={stopMicrophone} mr="auto">
                        <FAIcon icon="microphone-slash" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop microphone</span>
                    </Button>
                ) : (
                    <Button onClick={startMicrophone} mr="auto">
                        <FAIcon icon="microphone" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Start microphone</span>
                    </Button>
                )}
                {inRoom ? (
                    <Button colorScheme="green" onClick={onLeaveRoom}>
                        Leave Room
                    </Button>
                ) : (
                    <Button colorScheme="green" onClick={onJoinRoom}>
                        Join Room
                    </Button>
                )}
            </HStack>
            <DeviceChooserModal
                cameraId={
                    state.preferredCameraId ?? state.cameraStream?.getVideoTracks()[0].getSettings().deviceId ?? null
                }
                microphoneId={
                    state.preferredMicrophoneId ??
                    state.microphoneStream?.getAudioTracks()[0].getSettings().deviceId ??
                    null
                }
                isOpen={isOpen}
                onChangeCamera={(cameraId) =>
                    dispatch({ type: VonageRoomStateActionType.SetPreferredCamera, cameraId })
                }
                onChangeMicrophone={(microphoneId) =>
                    dispatch({ type: VonageRoomStateActionType.SetPreferredMicrophone, microphoneId })
                }
                onClose={onClose}
                onOpen={onOpen}
            />
        </>
    );
}
