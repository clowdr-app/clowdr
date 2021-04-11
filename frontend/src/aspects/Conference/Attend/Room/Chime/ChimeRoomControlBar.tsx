import { ChevronDownIcon } from "@chakra-ui/icons";
import { Box, Button, Menu, MenuButton, MenuItem, MenuList, useToast, Wrap, WrapItem } from "@chakra-ui/react";
import {
    MeetingStatus,
    useAudioInputs,
    useAudioVideo,
    useLocalVideo,
    useMeetingManager,
    useMeetingStatus,
    useSelectAudioInputDevice,
    useSelectVideoInputDevice,
    useToggleLocalMute,
    useVideoInputs,
} from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React, { useCallback, useState } from "react";

export function ChimeRoomControlBar(): JSX.Element {
    const toast = useToast();
    const meetingManager = useMeetingManager();
    const meetingStatus = useMeetingStatus();
    const audioInputs = useAudioInputs();
    const selectAudioInput = useSelectAudioInputDevice();
    const videoInputs = useVideoInputs();
    const selectVideoInput = useSelectVideoInputDevice();
    const audioVideo = useAudioVideo();
    const { isVideoEnabled, toggleVideo } = useLocalVideo();
    const [isOpening, setIsOpening] = useState<boolean>(false);
    const { muted, toggleMute } = useToggleLocalMute();

    const onLeaveRoom = useCallback(async () => {
        await meetingManager.leave();
    }, [meetingManager]);

    // useEffect(() => {
    //     async function fn() {
    //         await meetingManager.start();
    //     }

    //     fn();

    //     return () => {
    //         meetingManager.leave();
    //     };
    // }, [meetingManager]);

    // useEffect(() => {
    //     async function fn() {
    //         if (audioVideo) {
    //             console.log("Listing audio input devices");
    //             // await audioVideo?.listAudioInputDevices();
    //             const devices = await audioVideo.listAudioInputDevices();
    //             console.log("Audio input devices", devices);
    //         }
    //         // const devices = meetingManager.audioInputDevices;
    //         // const devices2 = await audioVideo?.listAudioInputDevices();
    //     }
    //     fn();
    // }, [audioVideo]);

    // const stopMicrophone = useCallback(async () => {
    //     try {
    //         await audioVideo?.chooseAudioInputDevice(null);
    //     } catch (e) {
    //         console.error("Failed to stop microphone", e);
    //         toast({
    //             title: "Failed to stop microphone",
    //         });
    //     }
    // }, [audioVideo, toast]);

    return (
        <>
            <Wrap p={2}>
                <WrapItem>
                    <Box>
                        {meetingStatus === MeetingStatus.Succeeded ? (
                            <Button colorScheme="green" onClick={onLeaveRoom}>
                                Leave Room
                            </Button>
                        ) : (
                            <></>
                        )}
                    </Box>
                </WrapItem>
                {audioVideo ? (
                    <WrapItem>
                        {meetingStatus === MeetingStatus.Succeeded ? (
                            <Button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</Button>
                        ) : undefined}

                        <Menu onOpen={() => meetingManager.updateDeviceLists()}>
                            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                Choose microphone
                            </MenuButton>
                            <MenuList>
                                {audioInputs.devices.map((device) => (
                                    <MenuItem
                                        key={device.deviceId}
                                        onClick={() => selectAudioInput(device.deviceId)}
                                        fontWeight={
                                            meetingManager.selectedAudioInputDevice === device.deviceId
                                                ? "bold"
                                                : "normal"
                                        }
                                    >
                                        {device.label}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>
                    </WrapItem>
                ) : undefined}
                {audioVideo ? (
                    <WrapItem>
                        {meetingStatus === MeetingStatus.Succeeded ? (
                            <Button onClick={toggleVideo}>{isVideoEnabled ? "Disable camera" : "Enable camera"}</Button>
                        ) : undefined}

                        <Menu onOpen={() => meetingManager.updateDeviceLists()}>
                            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                Choose camera
                            </MenuButton>
                            <MenuList>
                                {videoInputs.devices.map((device) => (
                                    <MenuItem
                                        key={device.deviceId}
                                        onClick={() => selectVideoInput(device.deviceId)}
                                        fontWeight={
                                            meetingManager.selectedVideoInputDevice === device.deviceId
                                                ? "bold"
                                                : "normal"
                                        }
                                    >
                                        {device.label}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>
                    </WrapItem>
                ) : undefined}
                {/* <WrapItem>
                    <AudioInputControl />
                </WrapItem> */}
                {/* {audioInputs.selectedDevice ? (
                    <WrapItem>
                        <Button onClick={stopMicrophone} colorScheme="purple">
                            <FAIcon icon="microphone" iconStyle="s" />
                            <span style={{ marginLeft: "1rem" }}>Stop microphone</span>
                        </Button>
                    </WrapItem>
                ) : (
                    <WrapItem>
                        <Button isLoading={isOpening} onClick={startMicrophone}>
                            <FAIcon icon="microphone-slash" iconStyle="s" />
                            <span style={{ marginLeft: "1rem" }}>Start microphone</span>
                        </Button>
                    </WrapItem>
                )} */}
            </Wrap>
            {/* <DeviceChooserModal
                cameraId={
                    state.cameraStream?.getVideoTracks()[0].getSettings().deviceId ?? state.preferredCameraId ?? null
                }
                microphoneId={
                    state.microphoneStream?.getAudioTracks()[0].getSettings().deviceId ??
                    state.preferredMicrophoneId ??
                    null
                }
                isOpen={deviceModalState.isOpen}
                showCamera={deviceModalState.showCamera}
                showMicrophone={deviceModalState.showMicrophone}
                onClose={onClose}
                onOpen={() => onOpen(true, true)}
            /> */}
        </>
    );
}
