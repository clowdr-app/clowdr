import { Logger } from "@eropple/nestjs-bunyan";
import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";
import * as Bunyan from "bunyan";
import { ChannelStackCreateJobService } from "../hasura/channel-stack-create-job/channel-stack-create-job.service";
import { CloudFormationService } from "./cloud-formation/cloud-formation.service";
import { SNSNotificationDto } from "./sns-notification.dto";

@Controller("aws")
export class AwsController {
    private readonly _logger: Bunyan;

    constructor(
        @Logger() requestLogger: Bunyan,
        private cloudformationService: CloudFormationService,
        private channelStackCreateJobService: ChannelStackCreateJobService
    ) {
        this._logger = requestLogger.child({ component: this.constructor.name });
    }

    @Post("cloudformation/notify")
    async notify(@Body() notification: SNSNotificationDto): Promise<void> {
        this._logger.info({ msg: "aws/notify", notification });

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
                this._logger.warn("Did not find LogicalResourceId in CloudFormation event", { message });
                return;
            }

            const jobId = await this.channelStackCreateJobService.findChannelStackCreateJobByLogicalResourceId(
                parsedMessage["LogicalResourceId"]
            );

            if (!jobId) {
                this._logger.warn(
                    "Could not find a ChannelStackCreateJob matching this CloudFormation stack, ignoring",
                    { message }
                );
                return;
            }

            switch (parsedMessage["ResourceStatus"]) {
                case "CREATE_FAILED":
                    this.channelStackCreateJobService.failChannelStackCreateJob(
                        jobId,
                        parsedMessage["ResourceStatusReason"] ?? "Unknown reason"
                    );
                    break;
                case "CREATE_COMPLETE":
                    // todo
                    break;
            }
        }
    }
}
