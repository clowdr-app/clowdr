import { Logger } from "@eropple/nestjs-bunyan";
import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";
import * as Bunyan from "bunyan";
import { CloudFormationService } from "./cloud-formation/cloud-formation.service";
import { SNSNotificationDto } from "./sns-notification.dto";

@Controller("aws")
export class AwsController {
    private readonly _logger: Bunyan;

    constructor(@Logger() requestLogger: Bunyan, private cloudformationService: CloudFormationService) {
        this._logger = requestLogger.child({ component: this.constructor.name });
    }

    @Post("cloudformation/notify")
    notify(@Body() notification: SNSNotificationDto): string {
        this._logger.info({ msg: "aws/notify", notification });

        if (notification.Type === "SubscriptionConfirmation" && notification.SubscribeURL) {
            this._logger.info("Subscribing to CloudFormation notifications");
            axios.get(notification.SubscribeURL);
        }

        if (notification.Type === "Notification") {
            const message: string = notification.Message;
            const parsedMessage = this.cloudformationService.parseCloudFormationEvent(message);

            switch (parsedMessage["ResourceStatus"]) {
                case "CREATE_COMPLETE":
                    // do something
                    break;
            }
        }

        return "ack";
    }
}
