/* eslint-disable @typescript-eslint/ban-types */
import { IsDefined, IsIn, IsISO8601, IsOptional, IsString, IsUrl } from "class-validator";

export class SNSNotificationDto {
    @IsDefined()
    @IsString()
    MessageId: string; //
    @IsDefined()
    Message: any;
    @IsDefined()
    @IsString()
    TopicArn: string; //
    @IsDefined()
    @IsISO8601()
    Timestamp: string; //
    @IsDefined()
    @IsString()
    SignatureVersion: string; //
    @IsDefined()
    @IsString()
    Signature: string; //
    @IsDefined()
    @IsUrl()
    SigningCertURL: string; //
    @IsIn(["SubscriptionConfirmation", "Notification", "UnsubscribeConfirmation"])
    Type: "SubscriptionConfirmation" | "Notification" | "UnsubscribeConfirmation"; //
    @IsOptional()
    @IsString()
    Token: string;
    @IsOptional()
    @IsUrl()
    SubscribeURL?: string;
    @IsOptional()
    @IsUrl()
    UnsubscribeURL?: string;
}
