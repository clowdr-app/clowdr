import type { SecretsManagerEvent } from "@midspace/shared-types/sns/secretsManager";
import { text } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import pMemoize from "p-memoize";
import { assertType } from "typescript-is";
import type { AWSClient } from "../client";
import { tryConfirmSubscription, validateSNSNotification } from "../sns";

export function createRouter(awsClient: AWSClient) {
    const router = express.Router();

    // Unprotected routes
    router.post("/notify", text(), async (req: Request, res: Response) => {
        req.log.info("Received Secrets Manager notification");

        try {
            const message = await validateSNSNotification(req.log, req.body);
            if (!message) {
                res.status(403).json("Access denied");
                return;
            }

            if (message.TopicArn !== (await awsClient.getAWSParameter("SECRETS_MANAGER_NOTIFICATIONS_TOPIC_ARN"))) {
                req.log.info({ TopicArn: message.TopicArn }, "Received SNS notification for the wrong topic");
                res.status(403).json("Access denied");
                return;
            }

            const subscribed = await tryConfirmSubscription(req.log, message);
            if (subscribed) {
                res.status(200).json("OK");
                return;
            }

            if (message.Type === "Notification") {
                req.log.info({ MessageId: message.MessageId, Message: message.Message }, "Received message");

                let event: SecretsManagerEvent;
                try {
                    event = JSON.parse(message.Message);
                    assertType<SecretsManagerEvent>(event);
                } catch (err) {
                    req.log.error({ err }, "Unrecognised notification message");
                    res.status(500).json("Unrecognised notification message");
                    return;
                }

                try {
                    pMemoize.clear(awsClient.getSecret);
                } catch (e: any) {
                    req.log.error({ err: e }, "Failed to handle secret change");
                    res.status(500).json("Failed to handle secret change");
                    return;
                }
            }

            res.status(200).json("OK");
        } catch (e: any) {
            req.log.error({ err: e }, "Failed to handle request");
            res.status(500).json("Failure");
        }
    });

    return router;
}
