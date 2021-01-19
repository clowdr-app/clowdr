import { SettingsIcon } from "@chakra-ui/icons";
import { Box, Button, useDisclosure, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import FAIcon from "../../../../Icons/FAIcon";
import { useVonageRoom, VonageRoomStateActionType } from "../../../../Vonage/useVonageRoom";
import DeviceChooserModal from "./DeviceChooserModal";
import { StateType } from "./VonageGlobalState";
import { useVonageGlobalState } from "./VonageGlobalStateProvider";

export function VonageRoomControlBar({
    onJoinRoom,
    onLeaveRoom,
    joining,
}: {
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
    joining: boolean;
}): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const vonage = useVonageGlobalState();
    const { isOpen, onClose: innerOnClose, onOpen } = useDisclosure();
    const [startCameraOnClose, setStartCameraOnClose] = useState<boolean>(false);
    const [startMicrophoneOnClose, setStartMicrophoneOnClose] = useState<boolean>(false);
    const onClose = useCallback(
        (madeSelection: boolean, cameraId: string | null = null, microphoneId: string | null = null) => {
            if (madeSelection) {
                if (cameraId && cameraId !== state.preferredCameraId) {
                    dispatch({ type: VonageRoomStateActionType.SetPreferredCamera, cameraId });
                }

                if (microphoneId && microphoneId !== state.preferredMicrophoneId) {
                    dispatch({ type: VonageRoomStateActionType.SetPreferredMicrophone, microphoneId });
                }

                if (startCameraOnClose && cameraId) {
                    dispatch({
                        type: VonageRoomStateActionType.SetCameraIntendedState,
                        cameraEnabled: true,
                    });
                }

                if (startMicrophoneOnClose && microphoneId) {
                    dispatch({
                        type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                        microphoneEnabled: true,
                    });
                }
            }

            setStartCameraOnClose(false);
            setStartMicrophoneOnClose(false);

            innerOnClose();
        },
        [
            dispatch,
            innerOnClose,
            startCameraOnClose,
            startMicrophoneOnClose,
            state.preferredCameraId,
            state.preferredMicrophoneId,
        ]
    );

    const startCamera = useCallback(() => {
        if (!state.preferredCameraId) {
            setStartCameraOnClose(true);
            onOpen();
        } else {
            dispatch({
                type: VonageRoomStateActionType.SetCameraIntendedState,
                cameraEnabled: true,
            });
        }
    }, [dispatch, onOpen, state.preferredCameraId]);

    const stopCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
        });
    }, [dispatch]);

    const startMicrophone = useCallback(() => {
        if (!state.preferredMicrophoneId) {
            setStartMicrophoneOnClose(true);
            onOpen();
        } else {
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: true,
            });
        }
    }, [dispatch, onOpen, state.preferredMicrophoneId]);

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

    const receivingScreenShare = useMemo(
        () =>
            vonage.state.type === StateType.Connected
                ? vonage.state.streams.find((s) => s.videoType === "screen")
                : false,
        [vonage.state]
    );

    return (
        <>
            <VStack my={4}>
                <Box>
                    {vonage.state.type === StateType.Connected ? (
                        <Button colorScheme="green" onClick={onLeaveRoom} size="lg">
                            Leave Room
                        </Button>
                    ) : (
                        <Button colorScheme="green" size="lg" onClick={onJoinRoom} isLoading={joining}>
                            Join Room
                        </Button>
                    )}
                </Box>
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
                    {vonage.state.type === StateType.Connected &&
                    (!receivingScreenShare || state.screenShareIntendedEnabled) ? (
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
                    ) : undefined}
                </Wrap>
            </VStack>
            <DeviceChooserModal
                cameraId={
                    state.cameraStream?.getVideoTracks()[0].getSettings().deviceId ?? state.preferredCameraId ?? null
                }
                microphoneId={
                    state.microphoneStream?.getAudioTracks()[0].getSettings().deviceId ??
                    state.preferredMicrophoneId ??
                    null
                }
                isOpen={isOpen}
                onClose={onClose}
                onOpen={onOpen}
            />
        </>
    );
}
