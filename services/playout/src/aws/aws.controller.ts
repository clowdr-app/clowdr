import { Logger } from "@eropple/nestjs-bunyan";
import { Body, Controller, Post, ValidationPipe } from "@nestjs/common";
import axios from "axios";
import * as Bunyan from "bunyan";
import { SNSNotificationDto } from "./sns-notification.dto";

@Controller("aws")
export class AwsController {
    private readonly _logger: Bunyan;

    constructor(@Logger() requestLogger: Bunyan) {
        this._logger = requestLogger.child({ component: this.constructor.name });
    }

    @Post("cloudformation/notify")
    notify(@Body(new ValidationPipe()) notification: SNSNotificationDto): string {
        this._logger.info({ msg: "aws/notify", notification });

        if (notification.Type === "SubscriptionConfirmation" && notification.SubscribeURL) {
            this._logger.info("Subscribing to CloudFormation notifications");
            axios.get(notification.SubscribeURL);
        }

        return "ack";
    }
}
