import { Type } from "class-transformer";
import { Equals, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";

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
    key: string;
}

export class RtmpPushImmediateSwitchData extends BaseImmediateSwitchData {
    @IsNotEmpty()
    kind: "rtmp_push";
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
