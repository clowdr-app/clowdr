import { Type } from "class-transformer";
import {
    Equals,
    IsArray,
    IsIn,
    IsNotEmptyObject,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator";

export abstract class NotificationBase {
    @IsString()
    version: string;
    @IsString()
    id: string;
    @IsString()
    "detail-type": string;
    @Equals("aws.medialive")
    source: "aws.medialive";
    @IsString()
    account: string;
    @IsString()
    time: string;
    @IsString()
    region: string;
    @IsArray()
    @IsString({ each: true })
    resources: string[];
}

export class ChannelStateChangeDetail {
    @IsNumber()
    pipelines_running_count: number;
    @IsIn(["RUNNING", "STOPPED", "STOPPING", "DELETING", "CREATED", "DELETED", "STARTING"])
    state: "RUNNING" | "STOPPED" | "STOPPING" | "DELETING" | "CREATED" | "DELETED" | "STARTING";
    @IsOptional()
    @IsString()
    pipeline?: string;
    @IsString()
    channel_arn: string;
    @IsString()
    message: string;
}

export class ChannelStateChange extends NotificationBase {
    @Equals("MediaLive Channel State Change")
    "detail-type": "MediaLive Channel State Change";
    @ValidateNested()
    detail: ChannelStateChangeDetail;
}

export class ChannelInputChangeDetail {
    @IsString()
    active_input_switch_action_name: string;
    @IsString()
    active_input_attachment_name: string;
    @IsString()
    pipeline: string;
    @IsString()
    message: string;
    @IsString()
    channel_arn: string;
}

export class ChannelInputChange extends NotificationBase {
    @Equals("MediaLive Channel Input Change")
    "detail-type": "MediaLive Channel Input Change";
    @ValidateNested()
    detail: ChannelInputChangeDetail;
}

export class ChannelAlert extends NotificationBase {
    @Equals("MediaLive Channel Alert")
    "detail-type": "MediaLive Channel Alert";
}

export class MediaLiveNotification {
    @Equals("notification")
    type: "notification";
    @ValidateNested()
    @Type(() => NotificationBase, {
        keepDiscriminatorProperty: true,
        discriminator: {
            property: "detail-type",
            subTypes: [
                { value: ChannelStateChange, name: "MediaLive Channel State Change" },
                { value: ChannelInputChange, name: "MediaLive Channel Input Change" },
                { value: ChannelAlert, name: "MediaLive Channel Alert" },
            ],
        },
    })
    @IsNotEmptyObject()
    notification: ChannelStateChange | ChannelInputChange | ChannelAlert;
}
