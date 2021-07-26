import { Alert, AlertDescription, AlertIcon, AlertProps, Button, chakra, CloseButton } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import hlsQualitySelector from "videojs-hls-quality-selector";
import { useRestorableState, useSessionState } from "../../../../Generic/useRestorableState";
import useTrackView from "../../../../Realtime/Analytics/useTrackView";
import "./hls-player.css";
import { HlsPlayerError } from "./HlsPlayerError";

const VideoJSInner = React.forwardRef<
    HTMLVideoElement,
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>(function VideoJSInner(
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
    ref: React.ForwardedRef<HTMLVideoElement>
): JSX.Element {
    return (
        <div data-vjs-player {...props} style={{ position: "relative", ...(props.style ?? {}) }}>
            <video ref={ref} className="video-js vjs-big-play-centered" />
        </div>
    );
});

function PlayerAnalytics({ isPlaying, roomId }: { isPlaying: boolean; roomId: string }) {
    useTrackView(isPlaying, roomId, "Room.HLSStream");

    return null;
}

function NonLiveAlert({
    onReload,
    onDismiss,
    ...props
}: AlertProps & { onReload: () => void; onDismiss: () => void }): JSX.Element {
    return (
        <Alert status="warning" p={1} display="flex" flexDir="row" {...props}>
            <AlertIcon ml={2} />
            <AlertDescription fontSize="sm">
                You may need to reload this video to get the latest content.
            </AlertDescription>
            <Button ml="auto" mr={2} size="sm" onClick={onReload}>
                Reload
            </Button>
            <CloseButton onClick={onDismiss} />
        </Alert>
    );
}

type HlsPlayerProps = {
    roomId?: string;
    hlsUri: string;
    canPlay: boolean;
    forceMute?: boolean;
    initialMute?: boolean;
    expectLivestream?: boolean;
    onAspectRatioChange?: (aspectRatio: number) => void;
};

export function HlsPlayerInner({
    roomId,
    hlsUri,
    canPlay,
    forceMute,
    initialMute,
    expectLivestream,
    onAspectRatioChange,
}: HlsPlayerProps): JSX.Element {
    const playerRef = useRef<VideoJsPlayer | null>(null);

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
    const [isLive, setIsLive] = useState<boolean>(false);
    const [dismissAlert, setDismissAlert] = useState<boolean>(false);

    useEffect(() => {
        setDismissAlert(false);
    }, [expectLivestream]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoKey, setVideoKey] = useState<number>(0);

    const options = useMemo<VideoJsPlayerOptions>(
        () => ({
            autoplay: initialMute ? "muted" : "play",
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
        [hlsUri, initialMute]
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

    const addListeners = useCallback(
        (videoElement: HTMLVideoElement) => {
            console.log("dbg (add event listeners)");
            const onPlay = () => {
                setIntendPlayStream(true);
            };
            videoElement.addEventListener("play", onPlay);
            const onPlaying = () => {
                console.log("dbg (play)");
                setIsPlaying(true);
            };
            videoElement.addEventListener("playing", onPlaying);
            const onPause = () => {
                setIsPlaying(false);
                setIntendPlayStream(false);
            };
            videoElement.addEventListener("pause", onPause);
            const onEnded = () => {
                console.log("dbg (pause)");
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
            // const onDurationChange = () => {
            //     if (videoElement) {
            //         console.log("dbg (durationchange)", { duration: videoElement.duration });
            //         setIsLive(videoElement.duration === Infinity);
            //     }
            // };
            // videoElement.addEventListener("durationchange", onDurationChange);

            return () => {
                console.log("dbg (remove event listeners)");
                videoElement?.removeEventListener("play", onPlay);
                videoElement?.removeEventListener("playing", onPlaying);
                videoElement?.removeEventListener("pause", onPause);
                videoElement?.removeEventListener("ended", onEnded);
                videoElement?.removeEventListener("error", onError);
                videoElement?.removeEventListener("waiting", onWaiting);
                videoElement?.removeEventListener("volumechange", onVolumeChange);
                videoElement?.removeEventListener("resize", onResize);
                // videoElement?.removeEventListener("durationchange", onDurationChange);
            };
        },
        [onAspectRatioChange, setIntendMuted, setVolume]
    );

    // useEffect(() => {
    //     const videoElement = videoRef.current;
    //     if (videoElement) {
    //         return addListeners(videoElement);
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [videoKey]);

    useEffect(() => {
        return () => {
            console.log("dbg (global unmount)", { player: playerRef.current, src: playerRef.current?.src() });
            const player = playerRef.current;
            playerRef.current = null;
            setVideoKey((i) => i + 1);
            setTimeout(() => {
                if (player && !player.isDisposed()) {
                    player.dispose();
                }
            }, 0);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initialisePlayer = useCallback(
        (options: VideoJsPlayerOptions) => {
            // Registered on import, but it likes to deregister itself
            if (!videojs.getPlugin("hlsQualitySelector")) {
                videojs.registerPlugin("hlsQualitySelector", hlsQualitySelector);
            }
            const src = options.src ?? "no source";
            console.log("dbg (loadedmetadata)", { src });
            const removeListeners = videoRef.current ? addListeners(videoRef.current) : null;

            const targetVideoEl = videoRef.current;
            const player = (playerRef.current = targetVideoEl
                ? videojs(
                      targetVideoEl,
                      { ...options, muted: forceMute || intendMuted ? true : undefined, defaultVolume: volume },
                      function onReady(this: VideoJsPlayer): void {
                          if (this === playerRef.current) {
                              if (options.src) {
                                  this.src(options.src);
                              }
                              // This will probably crash occasionally without this guard
                              if (typeof this.hlsQualitySelector === "function") {
                                  this.hlsQualitySelector({ displayCurrentQuality: true });
                              } else {
                                  console.warn("hlsQualitySelector plugin was not registered, skipping initialisation");
                              }

                              const onLoadedMetadata = () => {
                                  console.log("dbg (loadedmetadata)", { player: this, src }); //debug
                                  const tracks = this.textTracks();
                                  for (let i = 0; i < tracks.length; i++) {
                                      tracks[i].mode = "disabled";
                                  }
                                  if (this.videoWidth() !== 0 && this.videoHeight() !== 0) {
                                      onAspectRatioChange?.(this.videoWidth() / this.videoHeight());
                                  }
                                  setDismissAlert(false);
                                  setIsLive(this.duration() === Infinity);
                              };

                              this.on("loadedmetadata", onLoadedMetadata);
                              this.one("playerreset", () => {
                                  console.log("dbg (playerreset)", { player: this, src }); //debug
                                  this.off("loadedmetadata", onLoadedMetadata);
                              });
                          }
                      }
                  )
                : null);

            return () => {
                if (player && player === playerRef.current && !player.isDisposed()) {
                    console.log("dbg (unmount)", { player, src });
                    removeListeners?.();
                    if (targetVideoEl && targetVideoEl === videoRef.current) {
                        console.log("dbg (reset)", { player, src });
                        player.reset();
                    }
                }
            };
        },
        [addListeners, forceMute, intendMuted, onAspectRatioChange, volume]
    );

    // Re-initialise the player when the options (i.e. the stream URI) change
    useEffect(() => {
        return initialisePlayer(options);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, videoKey]);

    const handleReload = useCallback(() => {
        setDismissAlert(true);
        initialisePlayer(options);
    }, [initialisePlayer, options]);

    const handleDismiss = useCallback(() => {
        setDismissAlert(true);
    }, [setDismissAlert]);

    return (
        <chakra.div h="100%" w="100%" position="relative">
            {roomId ? <PlayerAnalytics isPlaying={isPlaying} roomId={roomId} /> : undefined}
            <VideoJSInner ref={videoRef} style={{ zIndex: 1 }} key={videoKey} />
            {!isLive && expectLivestream && !dismissAlert ? (
                <NonLiveAlert
                    position="absolute"
                    width="100%"
                    zIndex={2}
                    top={0}
                    onReload={handleReload}
                    onDismiss={handleDismiss}
                />
            ) : undefined}
        </chakra.div>
    );
}

export function HlsPlayer(props: HlsPlayerProps): JSX.Element {
    return (
        <ErrorBoundary FallbackComponent={HlsPlayerError}>
            <HlsPlayerInner {...props} />
        </ErrorBoundary>
    );
}
