import assert from "assert";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { assertType } from "typescript-is";
import { GetVideoRenderJobDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { handleOpenShotExportNotification } from "../handlers/openshot";
import { ExportWebhookData } from "../lib/openshot/openshotTypes";
import { failVideoRenderJob } from "../lib/videoRenderJob";

export const router = express.Router();

async function validateOpenshotWebhook(data: ExportWebhookData, videoRenderJobId: string) {
    // Validate the webhook call
    const videoRenderJobResult = await apolloClient.query({
        query: GetVideoRenderJobDocument,
        variables: {
            videoRenderJobId,
        },
    });

    if (
        !videoRenderJobResult.data.VideoRenderJob_by_pk?.data ||
        !videoRenderJobResult.data.VideoRenderJob_by_pk.data.webhookKey ||
        videoRenderJobResult.data.VideoRenderJob_by_pk.data.webhookKey !== data.json.webhookKey
    ) {
        console.error("Invalid webhook call", videoRenderJobId, data.json.webhookKey);
        throw new Error("Invalid webhook call");
    }
}

router.post(
    "/notifyExport/:videoRenderJobId",
    bodyParser.json({ type: "application/json" }),
    async (req: Request<{ videoRenderJobId: string }>, res: Response) => {
        console.log(req.originalUrl);

        const body = req.body;
        try {
            assertType<ExportWebhookData>(body);
            assert(req.params.videoRenderJobId, "Expected videoRenderJobId parameter");
        } catch (err) {
            console.error(`${req.originalUrl}: unrecognised message from OpenShot`, err);
            res.status(400).json("Unrecognised message format");
            return;
        }

        try {
            await validateOpenshotWebhook(body, req.params.videoRenderJobId);
        } catch (e) {
            res.status(403).json("Invalid OpenShot webhook call");
            return;
        }

        try {
            await handleOpenShotExportNotification(body, req.params.videoRenderJobId);
        } catch (e) {
            console.error(`${req.originalUrl}: failure while handling OpenShot export webhook`, e);
            try {
                await failVideoRenderJob(req.params.videoRenderJobId, body.json.detail);
            } catch (e) {
                console.error("Failure while recording failure of video render job", e);
            }
            // await failConferencePrepareJob();
            res.status(500).json("Failure while handling webhook");
            return;
        }
        res.status(200).json("OK");
    }
);
