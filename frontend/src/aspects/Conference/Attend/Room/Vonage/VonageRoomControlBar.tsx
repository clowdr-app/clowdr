import { SettingsIcon } from "@chakra-ui/icons";
import { Box, Button, useDisclosure, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import FAIcon from "../../../../Icons/FAIcon";
import { useOpenTok } from "../../../../Vonage/useOpenTok";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";
import DeviceChooserModal from "./DeviceChooserModal";

export function VonageRoomControlBar({
    onJoinRoom,
    onLeaveRoom,
    inRoom,
    joining,
}: {
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
    inRoom: boolean;
    joining: boolean;
}): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const [openTokProps] = useOpenTok();
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

    const receivingScreenShare = useMemo(() => openTokProps.streams.find((s) => s.videoType === "screen"), [
        openTokProps.streams,
    ]);

    return (
        <>
            <Wrap p={2}>
                <WrapItem>
                    <Button leftIcon={<SettingsIcon />} onClick={onOpen}>
                        Settings
                    </Button>
                </WrapItem>
                {state.cameraStream ? (
                    <WrapItem>
                        <Button onClick={stopCamera}>
                            <FAIcon icon="video-slash" iconStyle="s" />
                            <span style={{ marginLeft: "1rem" }}>Stop camera</span>
                        </Button>
                    </WrapItem>
                ) : (
                    <WrapItem>
                        <Button onClick={startCamera}>
                            <FAIcon icon="video" iconStyle="s" />
                            <span style={{ marginLeft: "1rem" }}>Start camera</span>
                        </Button>
                    </WrapItem>
                )}
                {state.microphoneStream ? (
                    <WrapItem>
                        <Button onClick={stopMicrophone}>
                            <FAIcon icon="microphone-slash" iconStyle="s" />
                            <span style={{ marginLeft: "1rem" }}>Stop microphone</span>
                        </Button>
                    </WrapItem>
                ) : (
                    <WrapItem>
                        <Button onClick={startMicrophone}>
                            <FAIcon icon="microphone" iconStyle="s" />
                            <span style={{ marginLeft: "1rem" }}>Start microphone</span>
                        </Button>
                    </WrapItem>
                )}
                {openTokProps.isSessionConnected && (!receivingScreenShare || state.screenShareIntendedEnabled) ? (
                    state.screenShareIntendedEnabled ? (
                        <WrapItem>
                            <Button onClick={stopScreenShare} mr="auto" colorScheme="red">
                                <span style={{ marginLeft: "1rem" }}>Stop sharing</span>
                            </Button>
                        </WrapItem>
                    ) : (
                        <WrapItem>
                            <Button onClick={startScreenShare} mr="auto">
                                <FAIcon icon="desktop" iconStyle="s" mr="auto" />
                                <span style={{ marginLeft: "1rem" }}>Share screen</span>
                            </Button>
                        </WrapItem>
                    )
                ) : (
                    <Box mr="auto"></Box>
                )}
                {inRoom ? (
                    <WrapItem ml="auto">
                        <Button colorScheme="green" onClick={onLeaveRoom} size="lg">
                            Leave Room
                        </Button>
                    </WrapItem>
                ) : (
                    <WrapItem ml="auto">
                        <Button
                            colorScheme="green"
                            size="lg"
                            onClick={onJoinRoom}
                            isLoading={joining && !openTokProps.isSessionConnected}
                        >
                            Join Room
                        </Button>
                    </WrapItem>
                )}
            </Wrap>
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
