import type { SNSNotification } from "@clowdr-app/shared-types/build/sns";
import axios from "axios";
import MessageValidator from "sns-validator";
import { assertType } from "typescript-is";
import { promisify } from "util";

export async function validateSNSNotification(body: string): Promise<Maybe<SNSNotification<any>>> {
    const validator = new MessageValidator();
    const validate = promisify(validator.validate.bind(validator));

    let message;
    try {
        message = JSON.parse(body);
        await validate(message);
        assertType<SNSNotification<any>>(message);
    } catch (e) {
        console.log("Received invalid SNS notification", e, body);
        return null;
    }

    return message;
}

async function confirmSubscription(url: string): Promise<boolean> {
    try {
        await axios.get(url);
        console.log("Confirmed subscription");
        return true;
    } catch (e) {
        console.error("Failed to confirm subscription", e);
        return false;
    }
}

/**
 * Given an SNSNotification, subscribe to it if it is a subscription confirmation.
 * Else do nothing.
 *
 * @return Whether the SNSNotification was a subscription confirmation.
 */
export async function tryConfirmSubscription(notification: SNSNotification<unknown>): Promise<boolean> {
    if (notification.Type === "SubscriptionConfirmation") {
        if (await confirmSubscription(notification.SubscribeURL)) {
            return true;
        } else {
            throw new Error("Failed while attempting to subscribe to an SNS topic");
        }
    } else {
        return false;
    }
}
