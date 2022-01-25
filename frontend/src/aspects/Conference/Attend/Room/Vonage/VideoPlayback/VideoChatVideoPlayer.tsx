import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertIcon,
    AspectRatio,
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
    useLatestRef,
} from "@chakra-ui/react";
import { useTimeoutCallback } from "@react-hook/timeout";
import { Duration } from "luxon";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCallbackRef } from "use-callback-ref";
import FAIcon from "../../../../../Chakra/FAIcon";
import { VonageVideoPlaybackContext } from "./VonageVideoPlaybackContext";

export default function VideoChatVideoPlayer(): JSX.Element {
    const videoPlayback = useContext(VonageVideoPlaybackContext);

    const videoPlaybackRef = useLatestRef(videoPlayback);

    const [ended, setEnded] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(NaN);

    const [controlsDisabled, setControlsDisabled] = useState<boolean>(false);
    const [startControlsDisabledTimeout] = useTimeoutCallback(() => setControlsDisabled(false), 2000);
    const temporarilyDisableControls = useCallback(() => {
        setControlsDisabled(true);
        startControlsDisabledTimeout();
    }, [startControlsDisabledTimeout]);

    const [currentTime, setCurrentTime] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0.5);

    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const videoRef = useCallbackRef(null, (value: HTMLVideoElement | null) => {
        setVideoElement(value);

        if (value) {
            const endedListener = (_event: Event) => {
                setEnded(true);
            };

            const timeUpdateListener = (event: Event) => {
                if (event.target instanceof HTMLMediaElement) {
                    setCurrentTime(event.target.currentTime);
                }
            };

            const durationChangeListener = (event: Event) => {
                if (event.target instanceof HTMLMediaElement) {
                    setDuration(event.target.duration);
                }
            };

            const readyListener = (event: Event) => {
                if (event.target instanceof HTMLMediaElement) {
                    if (
                        videoPlaybackRef.current &&
                        videoPlaybackRef.current.latestCommand?.command?.type === "video" &&
                        videoPlaybackRef.current.latestCommand.command.playing
                    ) {
                        const offsetMillis = Date.now() - videoPlaybackRef.current.latestCommand.createdAtMillis;
                        const seekPosition =
                            videoPlaybackRef.current.latestCommand.command.currentTimeSeconds + offsetMillis / 1000;

                        if (seekPosition > event.target.duration) {
                            event.target.currentTime = event.target.duration;
                        } else {
                            event.target.play();
                        }
                    }
                }
            };

            value.addEventListener("ended", endedListener);
            value.addEventListener("timeupdate", timeUpdateListener);
            value.addEventListener("durationchange", durationChangeListener);
            value.addEventListener("canplay", readyListener);

            return () => {
                if (value) {
                    value.removeEventListener("pause", endedListener);
                    value.removeEventListener("timeupdate", timeUpdateListener);
                    value.removeEventListener("durationchange", durationChangeListener);
                    value.removeEventListener("canplay", readyListener);
                }
            };
        }
        return () => {
            //
        };
    });

    useEffect(() => {
        if (currentTime < duration) {
            setEnded(false);
        }
    }, [duration, currentTime]);

    const playing = useMemo(
        () =>
            videoPlayback.latestCommand?.command?.type === "video" &&
            videoPlayback.latestCommand.command.playing &&
            !ended,
        [ended, videoPlayback.latestCommand?.command]
    );

    useEffect(() => {
        if (videoElement) {
            if (videoPlayback.latestCommand?.command.type === "video") {
                if (videoPlayback.latestCommand.command.playing) {
                    videoElement.play();
                } else {
                    videoElement.pause();
                }
                const offsetMillis = videoPlayback.latestCommand.command.playing
                    ? Date.now() - videoPlayback.latestCommand.createdAtMillis
                    : 0;
                const seekPosition = videoPlayback.latestCommand.command.currentTimeSeconds + offsetMillis / 1000;
                videoElement.currentTime = seekPosition;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoElement, videoPlayback.latestCommand]);

    useEffect(() => {
        if (videoElement) {
            videoElement.volume = volume;
        }
    }, [videoElement, volume]);

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
                <Box position="relative">
                    <AspectRatio w="min(100%, 90vh * (16 / 9))" maxW="100%" maxH="80vh" ratio={16 / 9} mx="auto">
                        <Box>
                            <Skeleton isLoaded={Boolean(videoPlayback.video?.url)} position="relative">
                                <video ref={videoRef} src={videoPlayback.video?.url}></video>
                            </Skeleton>
                            <HStack p={2} position="absolute" bottom="0px" left="0px" width="100%" alignItems="stretch">
                                {videoPlayback.canControlPlayback ? (
                                    <>
                                        <Tooltip label={playing ? "Pause" : "Play"}>
                                            <IconButton
                                                aria-label={playing ? "Pause video" : "Play video"}
                                                icon={<FAIcon iconStyle="s" icon={playing ? "pause" : "play"} />}
                                                isDisabled={ended || controlsDisabled}
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
                                                    isDisabled={controlsDisabled}
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
                                                    isDisabled={controlsDisabled}
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
                                {videoPlayback.canControlPlayback ? (
                                    <Tooltip label="Close video">
                                        <IconButton
                                            ml="auto"
                                            aria-label="Close video"
                                            icon={<CloseIcon />}
                                            isDisabled={controlsDisabled}
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
                    </AspectRatio>
                </Box>
            ) : undefined}
        </>
    );
}
