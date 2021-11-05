import type { MediaPackageEvent } from "@midspace/shared-types/sns/mediaPackage";
import { text } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import { assertType } from "typescript-is";
import { completeMediaPackageHarvestJob, failMediaPackageHarvestJob } from "../handlers/recording";
import { tryConfirmSubscription, validateSNSNotification } from "../lib/sns/sns";

export const router = express.Router();

// Unprotected routes
router.post("/harvest/notify", text(), async (req: Request, res: Response) => {
    req.log.info("Received MediaPackage notification");

    try {
        const message = await validateSNSNotification(req.log, req.body);
        if (!message) {
            res.status(403).json("Access denied");
            return;
        }

        if (message.TopicArn !== process.env.AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN) {
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

            let event: MediaPackageEvent;
            try {
                event = JSON.parse(message.Message);
                assertType<MediaPackageEvent>(event);
            } catch (err) {
                req.log.error({ err }, "Unrecognised notification message");
                res.status(500).json("Unrecognised notification message");
                return;
            }

            if (event["detail-type"] === "MediaPackage HarvestJob Notification") {
                const eventDetail = event.detail;
                if (eventDetail.harvest_job.status === "SUCCEEDED") {
                    await completeMediaPackageHarvestJob(
                        req.log,
                        eventDetail.harvest_job.id,
                        eventDetail.harvest_job.s3_destination.bucket_name,
                        eventDetail.harvest_job.s3_destination.manifest_key
                    );
                }

                if (eventDetail.harvest_job.status === "FAILED") {
                    await failMediaPackageHarvestJob(
                        req.log,
                        eventDetail.harvest_job.id,
                        "message" in eventDetail ? eventDetail.message : "No message found"
                    );
                }
            }
        }

        res.status(200).json("OK");
    } catch (e: any) {
        req.log.error({ err: e }, "Failed to handle request");
        res.status(200).json("Failure");
    }
});
