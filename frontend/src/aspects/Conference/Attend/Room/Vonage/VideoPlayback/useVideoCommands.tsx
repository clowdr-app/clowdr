import { useLatestRef } from "@chakra-ui/react";
import type { VonageVideoPlaybackCommandSignal } from "@midspace/shared-types/video/vonage-video-playback-command";
import { useTimeoutCallback } from "@react-hook/timeout";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCallbackRef } from "use-callback-ref";
import { AutoplayContext } from "./AutoplayContext";
import { VonageVideoPlaybackContext } from "./VonageVideoPlaybackContext";

export interface Outputs {
    videoRef: React.MutableRefObject<HTMLVideoElement | null>;
    videoElement: HTMLVideoElement | null;
    playing: boolean;
    ended: boolean;
    disableControls: boolean;
    temporarilyDisableControls: () => void;
    currentTime: number;
    duration: number;
}

async function setVideoElementState(
    videoEl: HTMLMediaElement,
    latestCommand: VonageVideoPlaybackCommandSignal
): Promise<void> {
    if (latestCommand.command?.type === "video") {
        const offsetMillis = Date.now() - latestCommand.createdAtMillis;
        const seekPosition = latestCommand.command.playing
            ? latestCommand.command.currentTimeSeconds + offsetMillis / 1000
            : latestCommand.command.currentTimeSeconds;

        if (seekPosition > videoEl.duration) {
            videoEl.currentTime = videoEl.duration;
        } else if (Math.abs(videoEl.currentTime - seekPosition) > 2) {
            videoEl.currentTime = seekPosition;
        }

        if (latestCommand.command.playing) {
            await videoEl.play();
        } else {
            videoEl.pause();
        }
    }
}

export function useVideoCommands(): Outputs {
    const videoPlayback = useContext(VonageVideoPlaybackContext);
    const videoPlaybackRef = useLatestRef(videoPlayback);
    const autoplay = useContext(AutoplayContext);

    const [ended, setEnded] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(NaN);

    const [disableControls, setDisableControls] = useState<boolean>(false);
    const [startControlsDisabledTimeout] = useTimeoutCallback(() => setDisableControls(false), 2000);
    const temporarilyDisableControls = useCallback(() => {
        setDisableControls(true);
        startControlsDisabledTimeout();
    }, [startControlsDisabledTimeout]);

    const [currentTime, setCurrentTime] = useState<number>(0);

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
                    if (videoPlaybackRef.current.latestCommand) {
                        setVideoElementState(event.target, videoPlaybackRef.current.latestCommand).catch(() => {
                            autoplay.unblockAutoplay().catch((err) => console.error(err));
                        });
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
        if (!autoplay.autoplayBlocked) {
            if (videoElement && videoPlayback.latestCommand?.command.type === "video") {
                setVideoElementState(videoElement, videoPlayback.latestCommand).catch(() => {
                    autoplay.unblockAutoplay().catch((err) => console.error(err));
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoplay.autoplayBlocked]);

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
        if (videoElement && videoPlayback.latestCommand?.command.type === "video") {
            setVideoElementState(videoElement, videoPlayback.latestCommand).catch(() => {
                autoplay.unblockAutoplay().catch((err) => console.error(err));
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoElement, videoPlayback.latestCommand]);

    return {
        videoRef,
        videoElement,
        playing,
        ended,
        disableControls,
        temporarilyDisableControls,
        currentTime,
        duration,
    };
}
