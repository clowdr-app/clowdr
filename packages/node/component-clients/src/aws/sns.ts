import type { SNSNotification } from "@midspace/shared-types/sns/index";
import axios from "axios";
import type { P } from "pino";
import MessageValidator from "sns-validator";
import { assertType } from "typescript-is";
import { promisify } from "util";

export async function validateSNSNotification(
    logger: P.Logger,
    body: string
): Promise<null | undefined | SNSNotification<any>> {
    const validator = new MessageValidator();
    const validate = promisify(validator.validate.bind(validator));

    let message;
    try {
        message = JSON.parse(body);
        await validate(message);
        assertType<SNSNotification<any>>(message);
    } catch (e: any) {
        logger.info({ err: e, body }, "Received invalid SNS notification");
        return null;
    }

    return message;
}

async function confirmSubscription(logger: P.Logger, url: string): Promise<boolean> {
    try {
        await axios.get(url);
        logger.info("Confirmed subscription");
        return true;
    } catch (e: any) {
        logger.error({ err: e }, "Failed to confirm subscription");
        return false;
    }
}

/**
 * Given an SNSNotification, subscribe to it if it is a subscription confirmation.
 * Else do nothing.
 *
 * @return Whether the SNSNotification was a subscription confirmation.
 */
export async function tryConfirmSubscription(
    logger: P.Logger,
    notification: SNSNotification<unknown>
): Promise<boolean> {
    if (notification.Type === "SubscriptionConfirmation") {
        if (await confirmSubscription(logger, notification.SubscribeURL)) {
            return true;
        } else {
            throw new Error("Failed while attempting to subscribe to an SNS topic");
        }
    } else {
        return false;
    }
}
