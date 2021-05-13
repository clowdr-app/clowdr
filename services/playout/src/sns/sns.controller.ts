import { Logger } from "@eropple/nestjs-bunyan";
import { Body, Controller, Post } from "@nestjs/common";
import parseArn from "@unbounce/parse-aws-arn";
import axios from "axios";
import * as Bunyan from "bunyan";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { CloudFormationService } from "../aws/cloud-formation/cloud-formation.service";
import { MediaLiveNotification } from "../aws/medialive/medialive-notification.dto";
import { ChannelStackService } from "../channel-stack/channel-stack/channel-stack.service";
import { Video_JobStatus_Enum } from "../generated/graphql";
import { ChannelStackDeleteJobService } from "../hasura-data/channel-stack-delete-job/channel-stack-delete-job.service";
import { ScheduleSyncService } from "../schedule/schedule-sync/schedule-sync.service";
import { SNSNotificationDto } from "./sns-notification.dto";

@Controller("aws")
export class SnsController {
    private readonly logger: Bunyan;

    constructor(
        @Logger() requestLogger: Bunyan,
        private cloudFormationService: CloudFormationService,
        private channelsService: ChannelStackService,
        private channelStackDeleteJobService: ChannelStackDeleteJobService,
        private scheduleSyncService: ScheduleSyncService
    ) {
        this.logger = requestLogger.child({ component: this.constructor.name });
    }

    @Post("medialive/notify")
    async notifyMediaLive(@Body() notification: SNSNotificationDto): Promise<void> {
        if (notification.Type === "SubscriptionConfirmation" && notification.SubscribeURL) {
            this.logger.info("Subscribing to MediaLive notifications");
            axios.get(notification.SubscribeURL);
        }

        if (notification.Type === "Notification") {
            const message: string = notification.Message;
            const parsedMessage = JSON.parse(message);
            const mediaLiveNotification = plainToClass(MediaLiveNotification, {
                type: "notification",
                notification: parsedMessage,
            });
            const errors = validateSync(mediaLiveNotification);

            if (errors.length) {
                this.logger.warn({ errors, message }, "SNS notification from MediaLive did not match expected format");
                return;
            }

            if (
                mediaLiveNotification.notification["detail-type"] === "MediaLive Channel State Change" &&
                mediaLiveNotification.notification.detail.state === "RUNNING"
            ) {
                const { resourceId: mediaLiveChannelId } = parseArn(
                    mediaLiveNotification.notification.detail.channel_arn
                );

                if (!mediaLiveChannelId) {
                    this.logger.error(
                        { mediaLiveChannelArn: mediaLiveNotification.notification.detail.channel_arn },
                        "Could not parse MediaLive channel resource ID from ARN"
                    );
                    return;
                }

                this.logger.info({ mediaLiveChannelId }, "Received notification that MediaLive channel has started");
                try {
                    await this.scheduleSyncService.syncChannelOnStartup(mediaLiveChannelId);
                } catch (err) {
                    this.logger.error({ err, mediaLiveChannelId }, "Could not sync channel on startup");
                }
            }
        }
    }

    @Post("cloudformation/notify")
    async notifyCloudFormation(@Body() notification: SNSNotificationDto): Promise<void> {
        if (notification.Type === "SubscriptionConfirmation" && notification.SubscribeURL) {
            this.logger.info("Subscribing to CloudFormation notifications");
            axios.get(notification.SubscribeURL);
        }

        if (notification.Type === "Notification") {
            const message: string = notification.Message;
            const parsedMessage = this.cloudFormationService.parseCloudFormationEvent(message);

            if (parsedMessage["ResourceType"] !== "AWS::CloudFormation::Stack") {
                return;
            }

            if (!parsedMessage["LogicalResourceId"]) {
                this.logger.warn({ message }, "Did not find LogicalResourceId in CloudFormation event");
                return;
            }

            switch (parsedMessage["ResourceStatus"]) {
                case "CREATE_FAILED":
                    try {
                        this.logger.error({ message }, "Creation of a channel stack failed, recording error");
                        await this.channelsService.handleFailedChannelStack(
                            parsedMessage["LogicalResourceId"],
                            parsedMessage["ResourceStatusReason"] ?? "Unknown reason"
                        );
                    } catch (e) {
                        this.logger.error(
                            {
                                err: e,
                                message,
                            },
                            "Failed to handle failure of channel stack creation"
                        );
                    }
                    break;
                case "CREATE_COMPLETE": {
                    try {
                        this.logger.info({ message }, "Creation of a channel stack completed, handling");
                        await this.channelsService.handleCompletedChannelStack(
                            parsedMessage["LogicalResourceId"],
                            parsedMessage["PhysicalResourceId"]
                        );
                    } catch (e) {
                        this.logger.error(
                            {
                                err: e,
                                message,
                            },
                            "Failed to handle completion of channel stack creation"
                        );
                        await this.channelsService.handleFailedChannelStack(
                            parsedMessage["LogicalResourceId"],
                            JSON.stringify(e)
                        );
                    }
                    break;
                }
                case "DELETE_COMPLETE": {
                    try {
                        if (parsedMessage["StackId"]) {
                            await this.channelStackDeleteJobService.setStatusChannelStackDeleteJob(
                                parsedMessage["StackId"],
                                Video_JobStatus_Enum.Completed,
                                null
                            );
                        }
                    } catch (err) {
                        this.logger.error(
                            {
                                err,
                                message,
                            },
                            "Failed to handle deletion of channel stack"
                        );
                    }
                    break;
                }
                case "DELETE_FAILED": {
                    try {
                        if (parsedMessage["StackId"]) {
                            await this.channelStackDeleteJobService.setStatusChannelStackDeleteJob(
                                parsedMessage["StackId"],
                                Video_JobStatus_Enum.Failed,
                                parsedMessage["ResourceStatusReason"] ?? "Unknown reason"
                            );
                        }
                    } catch (err) {
                        this.logger.error(
                            {
                                err,
                                message,
                            },
                            "Failed to handle deletion of channel stack"
                        );
                    }
                    break;
                }
            }
        }
    }
}
