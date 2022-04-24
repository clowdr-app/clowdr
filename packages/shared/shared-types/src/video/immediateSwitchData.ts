import { z } from "zod";

const immediateSwitchKind = {
    Filler: "filler",
    Video: "video",
    RtmpPush: "rtmp_push",
} as const;

const ImmediateSwitchKind = z.nativeEnum(immediateSwitchKind);
export type ImmediateSwitchKind = z.infer<typeof ImmediateSwitchKind>;

const BaseImmediateSwitchData = z.object({
    kind: ImmediateSwitchKind,
});
export type BaseImmediateSwitchData = z.infer<typeof BaseImmediateSwitchData>;

const FillerImmediateSwitchData = BaseImmediateSwitchData.extend({
    kind: z.literal("filler"),
}).strict();
export type FillerImmediateSwitchData = z.infer<typeof FillerImmediateSwitchData>;

const VideoImmediateSwitchData = BaseImmediateSwitchData.extend({
    kind: z.literal("video"),
    elementId: z.string().uuid(),
}).strict();
export type VideoImmediateSwitchData = z.infer<typeof VideoImmediateSwitchData>;

const rtmpSources = {
    RtmpEvent: "rtmpEvent",
    RtmpRoom: "rtmpRoom",
} as const;

const RtmpSource = z.nativeEnum(rtmpSources);
export type RtmpSource = z.infer<typeof RtmpSource>;

const RtmpPushImmediateSwitchData = BaseImmediateSwitchData.extend({
    kind: z.literal("rtmp_push"),
    source: z.optional(RtmpSource),
}).strict();
export type RtmpPushImmediateSwitchData = z.infer<typeof RtmpPushImmediateSwitchData>;

export const ImmediateSwitchData = z.union([
    FillerImmediateSwitchData,
    VideoImmediateSwitchData,
    RtmpPushImmediateSwitchData,
]);
export type ImmediateSwitchData = z.infer<typeof ImmediateSwitchData>;

export const ImmediateSwitchExecutedSignal = z.object({
    immediateSwitch: ImmediateSwitchData,
    executedAtMillis: z.number(),
});

export type ImmediateSwitchExecutedSignal = z.infer<typeof ImmediateSwitchExecutedSignal>;
