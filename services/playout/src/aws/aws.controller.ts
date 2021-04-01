import { Logger } from "@eropple/nestjs-bunyan";
import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";
import * as Bunyan from "bunyan";
import { ChannelStackCreateJobService } from "../hasura/channel-stack-create-job/channel-stack-create-job.service";
import { MediaLiveChannelService } from "../hasura/media-live-channel/media-live-channel.service";
import { AwsService } from "./aws.service";
import { CloudFormationService } from "./cloud-formation/cloud-formation.service";
import { SNSNotificationDto } from "./sns-notification.dto";

@Controller("aws")
export class AwsController {
    private readonly _logger: Bunyan;

    constructor(
        @Logger() requestLogger: Bunyan,
        private cloudformationService: CloudFormationService,
        private awsService: AwsService,
        private channelStackCreateJobService: ChannelStackCreateJobService,
        private mediaLiveChannelService: MediaLiveChannelService
    ) {
        this._logger = requestLogger.child({ component: this.constructor.name });
    }

    @Post("cloudformation/notify")
    async notify(@Body() notification: SNSNotificationDto): Promise<void> {
        if (notification.Type === "SubscriptionConfirmation" && notification.SubscribeURL) {
            this._logger.info("Subscribing to CloudFormation notifications");
            axios.get(notification.SubscribeURL);
        }

        if (notification.Type === "Notification") {
            const message: string = notification.Message;
            const parsedMessage = this.cloudformationService.parseCloudFormationEvent(message);

            if (parsedMessage["ResourceType"] !== "AWS::CloudFormation::Stack") {
                return;
            }

            // let resourceProperties;
            // try {
            //     resourceProperties = JSON.parse(parsedMessage["ResourceProperties"]);
            // } catch (e) {
            //     this._logger.error(e, {
            //         msg: "Could not parse ResourceProperties from CloudFormation event",
            //         message: notification.Message,
            //     });
            //     return;
            // }

            if (!parsedMessage["LogicalResourceId"]) {
                this._logger.warn({ message }, "Did not find LogicalResourceId in CloudFormation event");
                return;
            }

            const job = await this.channelStackCreateJobService.findChannelStackCreateJobByLogicalResourceId(
                parsedMessage["LogicalResourceId"]
            );

            if (!job) {
                this._logger.warn(
                    { message },
                    "Could not find a ChannelStackCreateJob matching this CloudFormation stack, ignoring"
                );
                return;
            }

            switch (parsedMessage["ResourceStatus"]) {
                case "CREATE_FAILED":
                    await this.channelStackCreateJobService.failChannelStackCreateJob(
                        job.jobId,
                        parsedMessage["ResourceStatusReason"] ?? "Unknown reason"
                    );
                    break;
                case "CREATE_COMPLETE": {
                    try {
                        const description = await this.awsService.describeChannelStack(
                            parsedMessage["LogicalResourceId"]
                        );
                        await this.mediaLiveChannelService.createMediaLiveChannel(
                            description,
                            parsedMessage["PhysicalResourceId"],
                            job.jobId,
                            job.conferenceId
                        );
                        await this.channelStackCreateJobService.completeChannelStackCreateJob(job.jobId);
                    } catch (e) {
                        this._logger.error(
                            {
                                err: e,
                                message,
                            },
                            "Failed to process completion of channel stack creation"
                        );
                        await this.channelStackCreateJobService.failChannelStackCreateJob(job.jobId, JSON.stringify(e));
                    }
                    break;
                }
            }
        }
    }
}
