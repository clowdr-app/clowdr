import React, { useEffect, useMemo, useRef, useState } from "react";
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import hlsQualitySelector from "videojs-hls-quality-selector";
import useTrackView from "../../../../Realtime/Analytics/useTrackView";

const VideoJSInner = React.forwardRef<HTMLVideoElement, unknown>(function VideoJSInner(_, ref): JSX.Element {
    return (
        <div data-vjs-player>
            <video ref={ref} className="video-js vjs-big-play-centered" />
        </div>
    );
});

function PlayerAnalytics({ isPlaying, roomId }: { isPlaying: boolean; roomId: string }) {
    useTrackView(isPlaying, roomId, "Room.HLSStream");

    return null;
}

export function HlsPlayer({
    roomId,
    hlsUri,
    canPlay,
    isMuted,
}: {
    roomId?: string;
    hlsUri: string;
    canPlay: boolean;
    isMuted?: boolean;
}): JSX.Element {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [intendPlayStream, setIntendPlayStream] = useState<boolean>(true);

    const videoRef = useRef<HTMLVideoElement>(null);

    const options = useMemo<VideoJsPlayerOptions>(
        () => ({
            autoplay: "muted",
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
        if (!videoRef.current || isMuted === undefined) {
            return;
        }
        videoRef.current.muted = isMuted;
    }, [isMuted]);

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

            return () => {
                videoElement?.removeEventListener("play", onPlay);
                videoElement?.removeEventListener("playing", onPlaying);
                videoElement?.removeEventListener("pause", onPause);
                videoElement?.removeEventListener("ended", onEnded);
                videoElement?.removeEventListener("error", onError);
                videoElement?.removeEventListener("waiting", onWaiting);
            };
        }
    }, []);

    useEffect(() => {
        // Registered on import, but it likes to deregister itself when the player is disposed
        if (!videojs.getPlugin("hlsQualitySelector")) {
            videojs.registerPlugin("hlsQualitySelector", hlsQualitySelector);
        }

        const videoJs = videoRef.current
            ? videojs(videoRef.current, options, function onReady(this: VideoJsPlayer): void {
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
                      });
                  }
              })
            : null;

        return () => {
            if (videoJs) {
                videoJs.reset();
            }
        };
    }, [options]);

    return (
        <>
            {roomId ? <PlayerAnalytics isPlaying={isPlaying} roomId={roomId} /> : undefined}
            <VideoJSInner ref={videoRef} />
        </>
    );

    // const playerEl = useMemo(() => {
    //     const hlsOptions: Partial<HlsConfig> = {
    //         liveSyncDurationCount: 5,
    //         enableCEA708Captions: false,
    //         enableWebVTT: true,
    //         backBufferLength: 180,
    //     };
    //     return (
    //         <Box>
    //             <ReactPlayer
    //                 width="100%"
    //                 height="auto"
    //                 url={hlsUri}
    //                 config={{
    //                     file: {
    //                         hlsVersion: "1.0.2",
    //                         hlsOptions,
    //                     },
    //                 }}
    //                 ref={playerRef}
    //                 playing={canPlay && intendPlayStream}
    //                 controls={true}
    //                 muted={isMuted}
    //                 onEnded={() => {
    //                     setIsPlaying(false);
    //                 }}
    //                 onError={() => {
    //                     setIsPlaying(false);
    //                 }}
    //                 onPause={() => {
    //                     setIsPlaying(false);
    //                     setIntendPlayStream(false);
    //                 }}
    //                 onPlay={() => {
    //                     setIsPlaying(true);
    //                     setIntendPlayStream(true);
    //                 }}
    //             />
    //         </Box>
    //     );
    // }, [canPlay, hlsUri, intendPlayStream, isMuted]);

    // useEffect(() => {
    //     if (playerRef.current) {
    //         const hls: Hls = playerRef.current.getInternalPlayer("hls") as Hls;
    //         if (hls) {
    //             hls.subtitleDisplay = false;
    //         }
    //     }
    // }, []);
}
