import { EventWebhook, EventWebhookHeader } from "@sendgrid/eventwebhook";
import { text } from "body-parser";
import express from "express";
import { initSGMail, processEmailWebhook } from "../handlers/email";

export const router = express.Router();

function verifyRequest(publicKey: string, payload: string | Buffer, signature: string, timestamp: string) {
    const eventWebhook = new EventWebhook();
    const ecPublicKey = eventWebhook.convertPublicKeyToECDSA(publicKey);
    return eventWebhook.verifySignature(ecPublicKey, payload, signature, timestamp);
}

router.use(text({ type: "application/json" }));

router.post("/webhook", async (req, resp) => {
    try {
        const sgMailParams = await initSGMail();
        if (sgMailParams) {
            const key = sgMailParams.webhookPublicKey;
            const signature = req.get(EventWebhookHeader.SIGNATURE());
            const timestamp = req.get(EventWebhookHeader.TIMESTAMP());
            const requestBody = req.body;

            if (signature && timestamp && verifyRequest(key, requestBody, signature, timestamp)) {
                await processEmailWebhook(requestBody);
                resp.sendStatus(204);
            } else {
                resp.sendStatus(403);
            }
        } else {
            resp.sendStatus(204);
        }
    } catch (error) {
        resp.status(500).send(error);
    }
});
