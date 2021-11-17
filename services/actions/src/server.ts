import { checkEventSecret } from "@midspace/auth/middlewares/checkEventSecret";
import { checkJwt } from "@midspace/auth/middlewares/checkJwt";
import { requestId } from "@midspace/server-utils/middlewares/request-id";
import type { invitationConfirmCurrentArgs } from "@midspace/hasura/actionTypes";
import assert from "assert";
import { json } from "body-parser";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import type { P } from "pino";
import pino from "pino";
import pinoHttp from "pino-http";
import { is } from "typescript-is";
import { invitationConfirmCurrentHandler } from "./handlers/invitation";
import { initialiseAwsClient } from "./lib/aws/awsClient";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/error-handler";
import { router as amazonTranscribeRouter } from "./router/amazonTranscribe";
import { router as analyticsRouter } from "./router/analytics";
import { router as chatRouter } from "./router/chat";
import { router as chimeRouter } from "./router/chime";
import { router as combineVideosJobRouter } from "./router/combineVideosJob";
import { router as companionRouter } from "./router/companion";
import { router as conferenceRouter } from "./router/conference";
import { router as conferencePrepareJobRouter } from "./router/conferencePrepareJob";
import { router as elasticTranscoderRouter } from "./router/elasticTranscoder";
import { router as elementRouter } from "./router/element";
import { router as emailRouter } from "./router/email";
import { router as eventRouter } from "./router/event";
import { router as googleRouter } from "./router/google";
import { router as invitationRouter } from "./router/invitation";
import { router as mediaConvertRouter } from "./router/mediaConvert";
import { router as mediaPackageRouter } from "./router/mediaPackage";
import { router as mediaPackageHarvestJobRouter } from "./router/mediaPackageHarvestJob";
import { router as profileRouter } from "./router/profile";
import { router as queuesRouter } from "./router/queues";
import { router as registrantGoogleAccountRouter } from "./router/registrantGoogleAccount";
import { router as roomRouter } from "./router/room";
import { router as shuffleRoomsRouter } from "./router/shuffleRooms";
import { router as superuserRouter } from "./router/superuser";
import { router as videoRenderJobRouter } from "./router/videoRenderJob";
import { router as vonageRouter } from "./router/vonage";
import { router as vonageSessionLayoutRouter } from "./router/vonageSessionLayout";

if (process.env.NODE_ENV !== "test") {
    assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN environment variable not provided.");
    assert(process.env.AUTH0_AUDIENCE, "AUTH0_AUDIENCE environment variable not provided.");
    assert(process.env.AUTH0_ISSUER_DOMAIN, "AUTH0_ISSUER_DOMAIN environment variable not provided.");
}

assert(
    process.env.EVENT_SECRET,
    "EVENT_SECRET (x-hasura-event-secret custom session variable) environment variable not provided."
);
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

export const app: express.Application = express();

app.use(requestId());

app.use(
    pinoHttp({
        logger: logger as any, // 7.0-compatible @types not yet released for pino-http
        autoLogging: process.env.LOG_LEVEL === "trace" ? true : false,
        genReqId: (req) => req.id,
        serializers: {
            req: pino.stdSerializers.wrapRequestSerializer((r) => {
                const headers = { ...r.headers };
                delete headers["authorization"];
                delete headers["x-hasura-admin-secret"];
                delete headers["x-hasura-event-secret"];
                const s = {
                    ...r,
                    headers,
                };
                return s;
            }),
        },
        useLevel: is<P.Level>(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : "info",
    })
);

app.use(
    cors({
        origin: process.env.CORS_ORIGIN.split(","),
    })
);

app.use("/companion", companionRouter);
app.use("/mediaConvert", mediaConvertRouter);
app.use("/amazonTranscribe", amazonTranscribeRouter);
app.use("/elasticTranscoder", elasticTranscoderRouter);
app.use("/mediaPackage", mediaPackageRouter);
app.use("/google", googleRouter);

app.use("/vonage", vonageRouter);
app.use("/chime", chimeRouter);

app.use("/element", elementRouter);
app.use("/conferencePrepareJob", conferencePrepareJobRouter);
app.use("/videoRenderJob", videoRenderJobRouter);
app.use("/event", eventRouter);
app.use("/room", roomRouter);
app.use("/vonageSessionLayout", vonageSessionLayoutRouter);
app.use("/mediaPackageHarvestJob", mediaPackageHarvestJobRouter);
app.use("/combineVideosJob", combineVideosJobRouter);
app.use("/registrantGoogleAccount", registrantGoogleAccountRouter);

app.use("/profile", profileRouter);
app.use("/shuffle", shuffleRoomsRouter);
app.use("/chat", chatRouter);

app.use("/queues", queuesRouter);
app.use("/email", emailRouter);
app.use("/analytics", analyticsRouter);

app.use("/su", superuserRouter);

app.use("/conference", conferenceRouter);
app.use("/invitation", invitationRouter);

app.get("/", function (_req, res) {
    res.send("Midspace");
});

app.use(checkEventSecret);

const jsonParser = json();

app.post("/invitation/confirm/current", jsonParser, checkJwt, async (req: Request, res: Response) => {
    const params: invitationConfirmCurrentArgs = req.body.input;
    req.log.info({ params }, "Invitation/confirm/current");
    try {
        const result = await invitationConfirmCurrentHandler(req.log, params, (req as any).user.sub);
        return res.json(result);
    } catch (e: any) {
        req.log.error({ err: e }, "Failure while processing /invitation/confirm/current");
        res.status(500).json("Failure");
        return;
    }
});

app.use(errorHandler);

const portNumber = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
export const server = app.listen(portNumber, function () {
    logger.info({ port: portNumber }, "Actions service is listening");
    logger.info("Initialising AWS client");
    initialiseAwsClient(logger).then(() => {
        logger.info("Initialised AWS client");
    });
});
