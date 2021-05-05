import { Logger } from "@eropple/nestjs-bunyan";
import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";
import * as Bunyan from "bunyan";
import { CloudFormationService } from "../aws/cloud-formation/cloud-formation.service";
import { ChannelStackService } from "../channel-stack/channel-stack/channel-stack.service";
import { Video_JobStatus_Enum } from "../generated/graphql";
import { ChannelStackDeleteJobService } from "../hasura-data/channel-stack-delete-job/channel-stack-delete-job.service";
import { ChannelStackDataService } from "../hasura-data/channel-stack/channel-stack.service";
import { SNSNotificationDto } from "./sns-notification.dto";

@Controller("aws")
export class SnsController {
    private readonly logger: Bunyan;

    constructor(
        @Logger() requestLogger: Bunyan,
        private cloudformationService: CloudFormationService,
        private channelsService: ChannelStackService,
        private channelStackDataService: ChannelStackDataService,
        private channelStackDeleteJobService: ChannelStackDeleteJobService
    ) {
        this.logger = requestLogger.child({ component: this.constructor.name });
    }

    @Post("cloudformation/notify")
    async notify(@Body() notification: SNSNotificationDto): Promise<void> {
        if (notification.Type === "SubscriptionConfirmation" && notification.SubscribeURL) {
            this.logger.info("Subscribing to CloudFormation notifications");
            axios.get(notification.SubscribeURL);
        }

        if (notification.Type === "Notification") {
            const message: string = notification.Message;
            const parsedMessage = this.cloudformationService.parseCloudFormationEvent(message);

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
