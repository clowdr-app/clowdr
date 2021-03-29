/* eslint-disable @typescript-eslint/ban-types */
import { IsDefined, IsIn, IsOptional, IsString } from "class-validator";

export class SNSNotificationDto {
    @IsDefined()
    @IsString()
    MessageId: string;
    @IsDefined()
    Message: any;
    @IsDefined()
    @IsString()
    TopicArn: string;
    @IsDefined()
    @IsString()
    Timestamp: string;
    @IsDefined()
    @IsString()
    SignatureVersion: string;
    @IsDefined()
    @IsString()
    Signature: string;
    @IsDefined()
    @IsString()
    SigningCertURL: string;
    @IsIn(["SubscriptionConfirmation", "Notification", "UnsubscribeConfirmation"])
    Type: "SubscriptionConfirmation" | "Notification" | "UnsubscribeConfirmation";
    @IsDefined()
    @IsString()
    Token: string;
    @IsOptional()
    @IsString()
    SubscribeURL?: string;
    @IsOptional()
    @IsString()
    UnsubscribeURL?: string;
}
