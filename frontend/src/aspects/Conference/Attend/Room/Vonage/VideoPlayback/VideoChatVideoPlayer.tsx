import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, WarningIcon } from "@chakra-ui/icons";
import type { ToastId } from "@chakra-ui/react";
import {
    Alert,
    AlertIcon,
    Box,
    ButtonGroup,
    HStack,
    IconButton,
    Skeleton,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Spacer,
    Tag,
    TagLabel,
    Tooltip,
    useToast,
} from "@chakra-ui/react";
import { Duration } from "luxon";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import FAIcon from "../../../../../Chakra/FAIcon";
import { VideoAspectWrapperAuto } from "../../Video/VideoAspectWrapper";
import { useVonageRoom, VonageRoomStateActionType } from "../State/VonageRoomProvider";
import { AutoplayContext } from "./AutoplayContext";
import { useVideoCommands } from "./useVideoCommands";
import { VonageVideoPlaybackContext } from "./VonageVideoPlaybackContext";

export default function VideoChatVideoPlayer(): JSX.Element {
    const {
        videoElement,
        playing,
        ended,
        videoRef,
        disableControls,
        currentTime,
        duration,
        temporarilyDisableControls,
    } = useVideoCommands();

    const videoPlayback = useContext(VonageVideoPlaybackContext);
    const autoplay = useContext(AutoplayContext);
    const [volume, setVolume] = useState<number>(0.5);

    useEffect(() => {
        if (videoElement) {
            videoElement.volume = volume;
        }
    }, [videoElement, volume]);

    const isMicOnRef = useRef<boolean>(false);
    const vonageRoom = useVonageRoom();
    const toast = useToast();
    const mutedToastIdRef = useRef<ToastId | undefined>(undefined);
    const unmutedToastIdRef = useRef<ToastId | undefined>(undefined);

    const onPlay = useCallback(() => {
        isMicOnRef.current = vonageRoom.state.microphoneIntendedEnabled;
        if (vonageRoom.state.microphoneIntendedEnabled) {
            vonageRoom.dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: false,
                explicitlyDisabled: false,
                onError: () => {
                    console.error("VideoChatVideoPlayer: Error auto-muting");
                },
            });
            if (unmutedToastIdRef.current !== undefined) {
                toast.close(unmutedToastIdRef.current);
                unmutedToastIdRef.current = undefined;
            }
            mutedToastIdRef.current = toast({
                title: "Auto muted",
                status: "info",
                position: "top",
                description:
                    "You have been automatically muted to avoid an audio feedback loop in the room. You will be automatically unmuted when the video is paused or ends.",
                isClosable: true,
                duration: 15000,
                variant: "subtle",
            });
        }
    }, [toast, vonageRoom]);

    const onPause = useCallback(() => {
        if (isMicOnRef.current && !vonageRoom.state.microphoneIntendedEnabled) {
            vonageRoom.dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: true,
                explicitlyDisabled: false,
                onError: () => {
                    console.error("VideoChatVideoPlayer: Error auto-un-muting");
                },
            });
            if (mutedToastIdRef.current !== undefined) {
                toast.close(mutedToastIdRef.current);
                mutedToastIdRef.current = undefined;
            }
            unmutedToastIdRef.current = toast({
                title: "Auto un-muted",
                status: "info",
                position: "top",
                isClosable: true,
                duration: 3000,
                variant: "subtle",
            });
        }
    }, [toast, vonageRoom]);

    useEffect(() => {
        // This condition is detecting when the user re-enables their mic after an auto-mute
        // i.e. overrides the auto-mute state for the first time since the auto-mute
        if (isMicOnRef.current && vonageRoom.state.microphoneIntendedEnabled) {
            // Suppress the auto-un-mute
            isMicOnRef.current = false;
        }
    }, [vonageRoom.state.microphoneIntendedEnabled]);

    useEffect(() => {
        if (videoElement) {
            videoElement.addEventListener("play", onPlay);
            videoElement.addEventListener("pause", onPause);
            return () => {
                videoElement.removeEventListener("play", onPlay);
                videoElement.removeEventListener("pause", onPause);
            };
        }
        return () => {
            //
        };
    }, [onPlay, onPause, videoElement]);

    useEffect(() => {
        if (videoPlayback.latestCommand?.command?.type === "no-video") {
            onPause();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoPlayback.latestCommand?.command]);

    const videoEl = useMemo(
        () => <video ref={videoRef} src={videoPlayback.video?.url}></video>,
        [videoPlayback.video?.url, videoRef]
    );

    return (
        <>
            {videoPlayback.errors.parseBlobError ||
            videoPlayback.errors.queryError ||
            videoPlayback.errors.parseBlobError ? (
                <Alert status="error">
                    <AlertIcon />
                    Could not load video
                </Alert>
            ) : undefined}
            {videoPlayback.latestCommand?.command.type === "video" ? (
                <VideoAspectWrapperAuto>
                    {() => (
                        <Box position="relative" h="100%" w="100%">
                            <Skeleton isLoaded={Boolean(videoPlayback.video?.url)} position="relative">
                                {videoEl}
                            </Skeleton>
                            <HStack p={2} position="absolute" bottom="0px" left="0px" width="100%" alignItems="stretch">
                                {videoPlayback.canControlPlaybackAs.length ? (
                                    <>
                                        <Tooltip label={playing ? "Pause" : "Play"}>
                                            <IconButton
                                                aria-label={playing ? "Pause video" : "Play video"}
                                                icon={<FAIcon iconStyle="s" icon={playing ? "pause" : "play"} />}
                                                isDisabled={ended || disableControls}
                                                onClick={() => {
                                                    temporarilyDisableControls();
                                                    if (
                                                        videoElement &&
                                                        videoPlayback.latestCommand?.command?.type === "video"
                                                    ) {
                                                        videoPlayback.sendCommand({
                                                            type: "video",
                                                            currentTimeSeconds: videoElement.currentTime,
                                                            elementId: videoPlayback.latestCommand.command.elementId,
                                                            playing: !playing,
                                                            volume: videoPlayback.latestCommand.command.volume,
                                                        });
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                        <ButtonGroup isAttached>
                                            <Tooltip label="Skip backward 15s">
                                                <IconButton
                                                    aria-label="Skip backward 15s in video"
                                                    icon={<ArrowLeftIcon />}
                                                    isDisabled={disableControls}
                                                    onClick={() => {
                                                        temporarilyDisableControls();
                                                        if (
                                                            videoElement &&
                                                            videoPlayback.latestCommand?.command?.type === "video"
                                                        ) {
                                                            videoPlayback.sendCommand({
                                                                type: "video",
                                                                currentTimeSeconds: Math.max(
                                                                    videoElement.currentTime - 15,
                                                                    0
                                                                ),
                                                                elementId:
                                                                    videoPlayback.latestCommand.command.elementId,
                                                                playing,
                                                                volume: videoPlayback.latestCommand.command.volume,
                                                            });
                                                        }
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip label="Skip forward 15s">
                                                <IconButton
                                                    aria-label="Skip forward 15s in video"
                                                    icon={<ArrowRightIcon />}
                                                    isDisabled={disableControls}
                                                    onClick={() => {
                                                        temporarilyDisableControls();
                                                        if (
                                                            videoElement &&
                                                            videoPlayback.latestCommand?.command?.type === "video"
                                                        ) {
                                                            videoPlayback.sendCommand({
                                                                type: "video",
                                                                currentTimeSeconds: Math.max(
                                                                    videoElement.currentTime + 15,
                                                                    0
                                                                ),
                                                                elementId:
                                                                    videoPlayback.latestCommand.command.elementId,
                                                                playing,
                                                                volume: videoPlayback.latestCommand.command.volume,
                                                            });
                                                        }
                                                    }}
                                                />
                                            </Tooltip>
                                        </ButtonGroup>
                                    </>
                                ) : undefined}
                                <Tag size="lg">
                                    <TagLabel>
                                        {Duration.fromMillis(currentTime * 1000).toFormat("hh:mm:ss")}
                                        {!isNaN(duration)
                                            ? ` / ${Duration.fromMillis(duration * 1000).toFormat("hh:mm:ss")}`
                                            : ""}
                                    </TagLabel>
                                </Tag>
                                <FAIcon
                                    iconStyle="s"
                                    icon="volume-down"
                                    color="white"
                                    w="max-content"
                                    display="flex"
                                    flexDirection="column"
                                    justifyContent="center"
                                />
                                <Slider
                                    aria-label="Volume slider"
                                    defaultValue={0.5}
                                    max={1}
                                    min={0}
                                    step={0.05}
                                    w="4em"
                                    maxW="30%"
                                    onChange={(val) => setVolume(val)}
                                >
                                    <SliderTrack>
                                        <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                </Slider>

                                <Spacer />
                                {autoplay.autoplayBlocked ? (
                                    <Tooltip label="Video playback is not enabled. Click for more details.">
                                        <IconButton
                                            colorScheme="red"
                                            aria-label="Video playback is not enabled. Click for more details."
                                            icon={<WarningIcon />}
                                            isDisabled={ended || disableControls}
                                            onClick={() => {
                                                autoplay.setAutoplayAlertDismissed(false);
                                            }}
                                        />
                                    </Tooltip>
                                ) : undefined}
                                {videoPlayback.canControlPlaybackAs.length ? (
                                    <Tooltip label="Close video">
                                        <IconButton
                                            ml="auto"
                                            aria-label="Close video"
                                            icon={<CloseIcon />}
                                            isDisabled={disableControls}
                                            onClick={() => {
                                                temporarilyDisableControls();
                                                if (
                                                    videoElement &&
                                                    videoPlayback.latestCommand?.command?.type === "video"
                                                ) {
                                                    videoPlayback.sendCommand({
                                                        type: "no-video",
                                                    });
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                ) : undefined}
                            </HStack>
                        </Box>
                    )}
                </VideoAspectWrapperAuto>
            ) : undefined}
        </>
    );
}
