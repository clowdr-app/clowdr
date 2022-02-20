import { Type } from "class-transformer";
import {
    Equals,
    IsEnum,
    IsNotEmpty,
    IsNotEmptyObject,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from "class-validator";

export class BaseImmediateSwitchData {
    @IsNotEmpty()
    kind: "filler" | "video" | "rtmp_push";
}

export class FillerImmediateSwitchData extends BaseImmediateSwitchData {
    @IsNotEmpty()
    kind: "filler";
}

export class VideoImmediateSwitchData extends BaseImmediateSwitchData {
    @IsNotEmpty()
    kind: "video";
    @IsString()
    @IsUUID()
    elementId: string;
}

export class RtmpPushImmediateSwitchData extends BaseImmediateSwitchData {
    @IsNotEmpty()
    kind: "rtmp_push";
    @IsOptional()
    @IsEnum(["rtmpEvent", "rtmpRoom"])
    source?: "rtmpEvent" | "rtmpRoom";
}

export class ImmediateSwitchData {
    @Equals("switch")
    type: "switch";
    @ValidateNested()
    @Type(() => BaseImmediateSwitchData, {
        keepDiscriminatorProperty: true,
        discriminator: {
            property: "kind",
            subTypes: [
                { value: FillerImmediateSwitchData, name: "filler" },
                { value: VideoImmediateSwitchData, name: "video" },
                { value: RtmpPushImmediateSwitchData, name: "rtmp_push" },
            ],
        },
    })
    @IsNotEmptyObject()
    data: FillerImmediateSwitchData | VideoImmediateSwitchData | RtmpPushImmediateSwitchData;
}
