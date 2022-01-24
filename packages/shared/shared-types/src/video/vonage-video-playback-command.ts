import { z } from "zod";

export const videoCommand = z.object(
    {
        type: z.literal("video"),
        elementId: z.string({ description: "ID of the element containing the video to be shown." }),
        playing: z.boolean({ description: "Whether the video is currently playing." }),
        volume: z.number({ description: "Volume on a scale of 0.0 (silent) to 1.0 (maximum)." }),
        currentTimeSeconds: z.number({ description: "Current time offset in the video in seconds." }),
    },
    {
        description: "This command displays a video with a determined state (e.g. at the start, playing, volume 50%).",
    }
);

export const noVideoCommand = z.object(
    {
        type: z.literal("no-video"),
    },
    {
        description: "This command stops any video from being shown.",
    }
);

export const vonageVideoPlaybackCommand = z.union([videoCommand, noVideoCommand]);

export type VonageVideoPlaybackCommand = z.infer<typeof vonageVideoPlaybackCommand>;

export type VideoCommand = z.infer<typeof videoCommand>;
export type NoVideoCommand = z.infer<typeof noVideoCommand>;

export const vonageVideoPlaybackCommandSignal = z.object({
    command: vonageVideoPlaybackCommand,
    createdByRegistrantId: z.nullable(z.string()),
    createdAtMillis: z.number(),
});

export type VonageVideoPlaybackCommandSignal = z.infer<typeof vonageVideoPlaybackCommandSignal>;
