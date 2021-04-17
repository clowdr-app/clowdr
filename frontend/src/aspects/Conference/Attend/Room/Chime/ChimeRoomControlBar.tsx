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
import type { DeviceChangeObserver } from "amazon-chime-sdk-js";
import React, { useCallback, useEffect, useRef } from "react";
import { FAIcon } from "../../../../Icons/FAIcon";
import { PermissionInstructions } from "./PermissionInstructions";

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
    const videoNeedsRestartRef = useRef<boolean>(false);

    const onLeaveRoom = useCallback(async () => {
        await meetingManager.leave();
    }, [meetingManager]);

    useEffect(() => {
        async function toggle() {
            try {
                videoNeedsRestartRef.current = true;
                await toggleVideo();
            } catch (e) {
                toast({
                    title: "Could not enable camera",
                    description: <PermissionInstructions />,
                    isClosable: true,
                    duration: null,
                    status: "error",
                });
            }
        }

        if (meetingStatus === MeetingStatus.Succeeded) {
            if (isVideoEnabled) {
                toggle();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meetingStatus]);

    useEffect(() => {
        async function toggle() {
            try {
                videoNeedsRestartRef.current = false;
                await toggleVideo();
            } catch (e) {
                toast({
                    title: "Could not enable camera",
                    description: <PermissionInstructions />,
                    isClosable: true,
                    duration: null,
                    status: "error",
                });
            }
        }
        if (videoNeedsRestartRef.current && !isVideoEnabled) {
            toggle();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVideoEnabled]);

    useEffect(() => {
        const deviceChangeObserver: DeviceChangeObserver = {
            videoInputStreamEnded: async () => {
                console.log("Video input stream ended", { isVideoEnabled });
                await selectVideoInput("none");
                if (isVideoEnabled) {
                    await toggleVideo();
                }
            },
            audioInputStreamEnded: async () => {
                console.log("Audio input stream ended");
                await selectAudioInput("none");
            },
        };

        audioVideo?.addDeviceChangeObserver(deviceChangeObserver);

        return () => {
            audioVideo?.removeDeviceChangeObserver(deviceChangeObserver);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioVideo]);

    const toggleVideoWrapper = useCallback(async () => {
        try {
            await toggleVideo();
        } catch (e) {
            toast({
                title: "Could not enable camera",
                description: <PermissionInstructions />,
                isClosable: true,
                duration: null,
                status: "error",
            });
        }
    }, [toast, toggleVideo]);

    const changeAudioInputDevice = useCallback(
        async (deviceId: string) => {
            try {
                await audioVideo?.chooseAudioInputDevice(deviceId);
                await selectAudioInput(deviceId);
            } catch (e) {
                toast({
                    title: "Could not change audio input device",
                    description: <PermissionInstructions />,
                    isClosable: true,
                    duration: null,
                    status: "error",
                });
                try {
                    await selectAudioInput("none");
                } catch (e) {
                    console.error("Failed to unselect audio device", e);
                }
            }
        },
        [audioVideo, selectAudioInput, toast]
    );

    const changeVideoInputDevice = useCallback(
        async (deviceId: string) => {
            try {
                if (deviceId !== "smpte") {
                    await audioVideo?.chooseVideoInputDevice(deviceId);
                }
                await selectVideoInput(deviceId);
            } catch (e) {
                toast({
                    title: "Could not change camera device",
                    description: <PermissionInstructions />,
                    isClosable: true,
                    duration: null,
                    status: "error",
                });
                try {
                    await selectVideoInput("none");
                } catch (e) {
                    console.error("Failed to unselect camera device", e);
                }
            }
        },
        [audioVideo, selectVideoInput, toast]
    );

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
                        <Button onClick={toggleMute} isDisabled={!audioInputs.selectedDevice}>
                            {muted || !audioInputs.selectedDevice ? (
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

                        <Menu onOpen={() => meetingManager.updateDeviceLists()}>
                            <MenuButton
                                as={Button}
                                rightIcon={<ChevronDownIcon />}
                                pl={0}
                                pr={3}
                                aria-label="Choose microphone"
                            />
                            <MenuList zIndex="300">
                                {audioInputs.devices.map((device) => (
                                    <MenuItem
                                        key={device.deviceId}
                                        onClick={() => changeAudioInputDevice(device.deviceId)}
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
                        <Button onClick={toggleVideoWrapper} isDisabled={!videoInputs.selectedDevice}>
                            {isVideoEnabled && videoInputs.selectedDevice ? (
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

                        <Menu onOpen={() => meetingManager.updateDeviceLists()}>
                            <MenuButton
                                as={Button}
                                rightIcon={<ChevronDownIcon />}
                                pl={0}
                                pr={3}
                                aria-label="Choose camera"
                            />
                            <MenuList zIndex="300">
                                {videoInputs.devices.map((device) => (
                                    <MenuItem
                                        key={device.deviceId}
                                        onClick={() => changeVideoInputDevice(device.deviceId)}
                                        fontWeight={
                                            meetingManager.selectedVideoInputDevice === device.deviceId
                                                ? "bold"
                                                : "normal"
                                        }
                                    >
                                        {device.label}
                                    </MenuItem>
                                ))}
                                {import.meta.env.MODE === "development" ? (
                                    <MenuItem
                                        key="smpte"
                                        onClick={() => changeVideoInputDevice("smpte")}
                                        fontWeight={
                                            meetingManager.selectedVideoInputDevice === "smpte" ? "bold" : "normal"
                                        }
                                    >
                                        Test video
                                    </MenuItem>
                                ) : undefined}
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
            </Wrap>
        </>
    );
}
