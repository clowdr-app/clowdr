import { chakra } from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import hlsQualitySelector from "videojs-hls-quality-selector";
import { useRestorableState, useSessionState } from "../../../../Generic/useRestorableState";
import { PlayerAnalytics } from "./PlayerAnalytics";

const VideoJSInner = React.forwardRef<HTMLVideoElement, unknown>(function VideoJSInner(_, ref): JSX.Element {
    return (
        <chakra.div data-vjs-player color="black">
            <video ref={ref} className="video-js vjs-big-play-centered" />
        </chakra.div>
    );
});

export function HlsPlayer({
    roomId,
    hlsUri,
    canPlay,
    forceMute,
    onAspectRatioChange,
}: {
    roomId?: string;
    hlsUri: string;
    canPlay: boolean;
    forceMute?: boolean;
    onAspectRatioChange?: (aspectRatio: number) => void;
}): JSX.Element {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [intendPlayStream, setIntendPlayStream] = useState<boolean>(true);
    const [intendMuted, setIntendMuted] = useSessionState<boolean>(
        "StreamPlayer_IntendMuted",
        false,
        (x) => (x ? "true" : "false"),
        (x) => x === "true"
    );
    const [volume, setVolume] = useRestorableState<number>(
        "StreamPlayer_Volume",
        1.0,
        (x) => x.toString(),
        (x) => parseFloat(x)
    );

    const videoRef = useRef<HTMLVideoElement>(null);

    const options = useMemo<VideoJsPlayerOptions>(
        () => ({
            autoplay: "play",
            bigPlayButton: true,
            controls: true,
            fluid: true,
            liveui: true,
            preload: "auto",
            src: hlsUri,
            html5: {
                vhs: {
                    parse708captions: false,
                },
            },
        }),
        [hlsUri]
    );

    useEffect(() => {
        if (canPlay && intendPlayStream) {
            videoRef?.current?.play();
        }
    }, [canPlay, intendPlayStream]);

    useEffect(() => {
        if (!videoRef.current) {
            return;
        }
        videoRef.current.muted = forceMute || intendMuted;
    }, [forceMute, intendMuted]);

    useEffect(() => {
        if (!videoRef.current || videoRef.current.volume === volume) {
            return;
        }
        videoRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            const onPlay = () => {
                setIntendPlayStream(true);
            };
            videoElement.addEventListener("play", onPlay);
            const onPlaying = () => {
                setIsPlaying(true);
            };
            videoElement.addEventListener("playing", onPlaying);
            const onPause = () => {
                setIsPlaying(false);
                setIntendPlayStream(false);
            };
            videoElement.addEventListener("pause", onPause);
            const onEnded = () => {
                setIsPlaying(false);
            };
            videoElement.addEventListener("ended", onEnded);
            const onError = () => {
                setIsPlaying(false);
            };
            videoElement.addEventListener("error", onError);
            const onWaiting = () => {
                setIsPlaying(false);
            };
            videoElement.addEventListener("waiting", onWaiting);
            const onVolumeChange = () => {
                if (videoElement) {
                    setIntendMuted(videoElement.muted ?? false);
                    setVolume(videoElement.volume);
                }
            };
            videoElement.addEventListener("volumechange", onVolumeChange);
            const onResize = () => {
                if (videoElement && videoElement.videoWidth !== 0 && videoElement.videoHeight !== 0) {
                    onAspectRatioChange?.(videoElement.videoWidth / videoElement.videoHeight);
                }
            };
            videoElement.addEventListener("resize", onResize);

            return () => {
                videoElement?.removeEventListener("play", onPlay);
                videoElement?.removeEventListener("playing", onPlaying);
                videoElement?.removeEventListener("pause", onPause);
                videoElement?.removeEventListener("ended", onEnded);
                videoElement?.removeEventListener("error", onError);
                videoElement?.removeEventListener("waiting", onWaiting);
                videoElement?.removeEventListener("volumechange", onVolumeChange);
                videoElement?.removeEventListener("resize", onResize);
            };
        }
    }, [onAspectRatioChange, setIntendMuted, setVolume]);

    // Re-initialise the player when the options (i.e. the stream URI) change
    useEffect(() => {
        // Registered on import, but it likes to deregister itself when the player is disposed
        if (!videojs.getPlugin("hlsQualitySelector")) {
            videojs.registerPlugin("hlsQualitySelector", hlsQualitySelector);
        }

        const videoJs = videoRef.current
            ? videojs(
                  videoRef.current,
                  { ...options, muted: forceMute || intendMuted ? true : undefined, defaultVolume: volume },
                  function onReady(this: VideoJsPlayer): void {
                      if (videoJs) {
                          if (options.src) {
                              videoJs.src(options.src);
                          }
                          // This will probably crash occasionally without this guard
                          if (typeof videoJs.hlsQualitySelector === "function") {
                              videoJs.hlsQualitySelector({ displayCurrentQuality: true });
                          } else {
                              console.warn("hlsQualitySelector plugin was not registered, skipping initialisation");
                          }

                          videoJs.on("loadedmetadata", () => {
                              const tracks = videoJs.textTracks();
                              for (let i = 0; i < tracks.length; i++) {
                                  tracks[i].mode = "disabled";
                              }
                              if (videoJs.videoWidth() !== 0 && videoJs.videoHeight() !== 0) {
                                  onAspectRatioChange?.(videoJs.videoWidth() / videoJs.videoHeight());
                              }
                          });
                      }
                  }
              )
            : null;

        return () => {
            if (videoJs) {
                videoJs.reset();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options]);

    return (
        <>
            {roomId ? <PlayerAnalytics isPlaying={isPlaying} roomId={roomId} /> : undefined}
            <VideoJSInner ref={videoRef} />
        </>
    );
}
