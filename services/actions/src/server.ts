import assert from "assert";
import { json } from "body-parser";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import type { AuthenticatedRequest } from "./checkScopes";
import { invitationConfirmCurrentHandler } from "./handlers/invitation";
import { initialiseAwsClient } from "./lib/aws/awsClient";
import { checkEventSecret } from "./middlewares/checkEventSecret";
import { checkJwt } from "./middlewares/checkJwt";
import { checkUserScopes } from "./middlewares/checkScopes";
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
import { router as eventRouter } from "./router/event";
import { router as googleRouter } from "./router/google";
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
app.use("/analytics", analyticsRouter);

app.use("/su", superuserRouter);

app.use("/conference", conferenceRouter);

app.get("/", function (_req, res) {
    res.send("Midspace");
});

app.use(checkEventSecret);

const jsonParser = json();

app.post("/invitation/confirm/current", jsonParser, checkJwt, checkUserScopes, async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedRequest;
    const params: invitationConfirmCurrentArgs = req.body.input;
    console.log("Invitation/confirm/current", params);
    try {
        const result = await invitationConfirmCurrentHandler(params, req.userId);
        return res.json(result);
    } catch (e: any) {
        console.error("Failure while processing /invitation/confirm/current", e);
        res.status(500).json("Failure");
        return;
    }
});

const portNumber = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
export const server = app.listen(portNumber, function () {
    console.log(`App is listening on port ${process.env.PORT}!`);
    console.log("Initialising AWS client");
    initialiseAwsClient().then(() => {
        console.log("Initialised AWS client");
    });
});
