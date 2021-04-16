import { CheckCircleIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Tag,
    TagLabel,
    TagLeftIcon,
    useToast,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import {
    MeetingStatus,
    useAudioInputs,
    useAudioVideo,
    useContentShareControls,
    useContentShareState,
    useLocalVideo,
    useMeetingManager,
    useMeetingStatus,
    useSelectAudioInputDevice,
    useSelectVideoInputDevice,
    useToggleLocalMute,
    useVideoInputs,
} from "amazon-chime-sdk-component-library-react";
import React, { useCallback } from "react";
import { FAIcon } from "../../../../Icons/FAIcon";

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
    const { isLocalUserSharing, isLocalShareLoading, sharingAttendeeId } = useContentShareState();
    const { muted, toggleMute } = useToggleLocalMute();
    const { toggleContentShare } = useContentShareControls();

    const onLeaveRoom = useCallback(async () => {
        await meetingManager.leave();
    }, [meetingManager]);

    return (
        <>
            <Wrap p={2}>
                <WrapItem>
                    <Box>
                        {meetingStatus === MeetingStatus.Succeeded ? (
                            <Button colorScheme="green" onClick={onLeaveRoom}>
                                Leave Room
                            </Button>
                        ) : undefined}
                    </Box>
                </WrapItem>
                {audioVideo ? (
                    <WrapItem>
                        {meetingStatus === MeetingStatus.Succeeded ? (
                            <Button onClick={toggleMute}>
                                {muted ? (
                                    <>
                                        <FAIcon icon="microphone-slash" iconStyle="s" />
                                        <span style={{ marginLeft: "1rem" }}>Unmute</span>
                                    </>
                                ) : (
                                    <>
                                        <FAIcon icon="microphone" iconStyle="s" />
                                        <span style={{ marginLeft: "1rem" }}>Mute</span>
                                    </>
                                )}
                            </Button>
                        ) : undefined}

                        <Menu onOpen={() => meetingManager.updateDeviceLists()}>
                            <MenuButton
                                as={Button}
                                rightIcon={<ChevronDownIcon />}
                                pl={0}
                                pr={3}
                                aria-label="Choose microphone"
                            />
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
                            <Button onClick={toggleVideo}>
                                {isVideoEnabled ? (
                                    <>
                                        <FAIcon icon="video-slash" iconStyle="s" />
                                        <span style={{ marginLeft: "1rem" }}>Disable camera</span>
                                    </>
                                ) : (
                                    <>
                                        <FAIcon icon="video" iconStyle="s" />
                                        <span style={{ marginLeft: "1rem" }}>Start camera</span>
                                    </>
                                )}
                            </Button>
                        ) : undefined}

                        <Menu onOpen={() => meetingManager.updateDeviceLists()}>
                            <MenuButton
                                as={Button}
                                rightIcon={<ChevronDownIcon />}
                                pl={0}
                                pr={3}
                                aria-label="Choose camera"
                            />
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
                {audioVideo ? (
                    <WrapItem>
                        {meetingStatus === MeetingStatus.Succeeded ? (
                            isLocalUserSharing ? (
                                <Button onClick={toggleContentShare}>
                                    <>
                                        <FAIcon icon="desktop" iconStyle="s" />
                                        <span style={{ marginLeft: "1rem" }}>Stop sharing</span>
                                    </>
                                </Button>
                            ) : isLocalShareLoading ? (
                                <Button onClick={toggleContentShare} isLoading={true}>
                                    <>
                                        <FAIcon icon="desktop" iconStyle="s" />
                                        <span style={{ marginLeft: "1rem" }}>Share screen</span>
                                    </>
                                </Button>
                            ) : sharingAttendeeId ? (
                                <Tag
                                    size="sm"
                                    variant="outline"
                                    colorScheme="blue"
                                    px={2}
                                    py="4px"
                                    ml={1}
                                    mr="auto"
                                    maxW="190px"
                                >
                                    <TagLeftIcon as={CheckCircleIcon} />
                                    <TagLabel whiteSpace="normal">
                                        Someone else is sharing their screen at the moment
                                    </TagLabel>
                                </Tag>
                            ) : (
                                <Button onClick={toggleContentShare}>
                                    <>
                                        <FAIcon icon="desktop" iconStyle="s" />
                                        <span style={{ marginLeft: "1rem" }}>Share screen</span>
                                    </>
                                </Button>
                            )
                        ) : undefined}
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
