import sgMail from "@sendgrid/mail";
import assert from "assert";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { AuthenticatedRequest } from "./checkScopes";
import handlerEcho from "./handlers/echo";
import {
    invitationConfirmCurrentHandler,
    invitationConfirmSendInitialEmailHandler,
    invitationConfirmSendRepeatEmailHandler,
    invitationConfirmWithCodeHandler,
} from "./handlers/invitation";
import protectedEchoHandler from "./handlers/protectedEcho";
import { initialiseAwsClient } from "./lib/aws/awsClient";
import { checkEventSecret } from "./middlewares/checkEventSecret";
import { checkJwt } from "./middlewares/checkJwt";
import { checkUserScopes } from "./middlewares/checkScopes";
import { router as amazonTranscribeRouter } from "./router/amazonTranscribe";
import { router as attendeeGoogleAccountRouter } from "./router/attendeeGoogleAccount";
import { router as broadcastContentItemRouter } from "./router/broadcastContentItem";
import { router as channelsRouter } from "./router/channels";
import { router as chatRouter } from "./router/chat";
import { router as combineVideosJobRouter } from "./router/combineVideosJob";
import { router as companionRouter } from "./router/companion";
import { router as conferencePrepareJobRouter } from "./router/conferencePrepareJob";
import { router as contentItemRouter } from "./router/contentItem";
import { router as elasticTranscoderRouter } from "./router/elasticTranscoder";
import { router as eventRouter } from "./router/event";
import { router as eventPersonRouter } from "./router/eventPerson";
import { router as eventRoomJoinRequestRouter } from "./router/eventRoomJoinRequest";
import { router as eventVonageSessionRouter } from "./router/eventVonageSession";
import { router as googleRouter } from "./router/google";
import { router as mediaConvertRouter } from "./router/mediaConvert";
import { router as mediaLiveRouter } from "./router/mediaLive";
import { router as mediaPackageRouter } from "./router/mediaPackage";
import { router as mediaPackageHarvestJobRouter } from "./router/mediaPackageHarvestJob";
import { router as openshotRouter } from "./router/openshot";
import { router as profileRouter } from "./router/profile";
import { router as queuesRouter } from "./router/queues";
import { router as roomRouter } from "./router/room";
import { router as shuffleRoomsRouter } from "./router/shuffleRooms";
import { router as videoRenderJobRouter } from "./router/videoRenderJob";
import { router as vonageRouter } from "./router/vonage";

if (process.env.NODE_ENV !== "test") {
    assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN environment variable not provided.");
    assert(process.env.AUTH0_AUDIENCE, "AUTH0_AUDIENCE environment variable not provided.");
    assert(process.env.AUTH0_ISSUER_DOMAIN, "AUTH0_ISSUER_DOMAIN environment variable not provided.");

    assert(process.env.SENDGRID_API_KEY, "SENDGRID_API_KEY environment variable not provided.");
    assert(process.env.SENDGRID_SENDER, "SENDGRID_SENDER environment variable not provided.");

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    assert(process.env.FRONTEND_DOMAIN, "FRONTEND_DOMAIN environment variable not provided.");
    process.env.FRONTEND_PROTOCOL =
        process.env.FRONTEND_PROTOCOL || (process.env.FRONTEND_DOMAIN.startsWith("localhost") ? "http" : "https");

    assert(
        process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS,
        "STOP_EMAILS_CONTACT_EMAIL_ADDRESS environment variable not provided."
    );
}

assert(
    process.env.EVENT_SECRET,
    "EVENT_SECRET (x-hasura-event-secret custom session variable) environment variable not provided."
);

export const app: express.Application = express();

app.use("/companion", companionRouter);
app.use("/openshot", openshotRouter);
app.use("/mediaConvert", mediaConvertRouter);
app.use("/amazonTranscribe", amazonTranscribeRouter);
app.use("/elasticTranscoder", elasticTranscoderRouter);
app.use("/mediaLive", mediaLiveRouter);
app.use("/mediaPackage", mediaPackageRouter);
app.use("/google", googleRouter);

app.use("/vonage", vonageRouter);

app.use("/contentItem", contentItemRouter);
app.use("/conferencePrepareJob", conferencePrepareJobRouter);
app.use("/videoRenderJob", videoRenderJobRouter);
app.use("/broadcastContentItem", broadcastContentItemRouter);
app.use("/event", eventRouter);
app.use("/room", roomRouter);
app.use("/eventVonageSession", eventVonageSessionRouter);
app.use("/eventRoomJoinRequest", eventRoomJoinRequestRouter);
app.use("/eventPerson", eventPersonRouter);
app.use("/mediaPackageHarvestJob", mediaPackageHarvestJobRouter);
app.use("/combineVideosJob", combineVideosJobRouter);
app.use("/attendeeGoogleAccount", attendeeGoogleAccountRouter);

app.use("/channels", channelsRouter);

app.use("/profile", profileRouter);
app.use("/shuffle", shuffleRoomsRouter);
app.use("/chat", chatRouter);

app.use("/queues", queuesRouter);

app.get("/", function (_req, res) {
    res.send("Clowdr");
});

app.use(checkEventSecret);

const jsonParser = bodyParser.json();

app.post("/protectedEcho", jsonParser, checkJwt, checkUserScopes, async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedRequest;
    const params: protectedEchoArgs = req.body.input;
    console.log(`Echoing (protected) "${params.message}"`);
    const result = await protectedEchoHandler(req.userId, params);
    return res.json(result);
});

app.post("/echo", jsonParser, async (req: Request, res: Response) => {
    const params: echoArgs = req.body.input;
    console.log(`Echoing "${params.message}"`);
    const result = handlerEcho(params);
    return res.json(result);
});

app.post("/invitation/confirm/current", jsonParser, checkJwt, checkUserScopes, async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedRequest;
    const params: invitationConfirmCurrentArgs = req.body.input;
    console.log("Invitation/confirm/current", params);
    try {
        const result = await invitationConfirmCurrentHandler(params, req.userId);
        return res.json(result);
    } catch (e) {
        console.error("Failure while processing /invitation/confirm/current", e);
        res.status(500).json("Failure");
        return;
    }
});

app.post("/invitation/confirm/code", jsonParser, checkJwt, checkUserScopes, async (_req: Request, res: Response) => {
    const req = _req as AuthenticatedRequest;
    const params: invitationConfirmWithCodeArgs = req.body.input;
    console.log("Invitation/confirm/code", params);
    try {
        const result = await invitationConfirmWithCodeHandler(params, req.userId);
        return res.json(result);
    } catch (e) {
        console.error("Failure while processing /invitation/confirm/code", e);
        res.status(500).json("Failure");
        return;
    }
});

app.post(
    "/invitation/confirm/send/initial",
    jsonParser,
    checkJwt,
    checkUserScopes,
    async (_req: Request, res: Response) => {
        const req = _req as AuthenticatedRequest;
        const params: invitationConfirmSendInitialEmailArgs = req.body.input;
        console.log("Invitation/confirm/send/initial", params);
        try {
            const result = await invitationConfirmSendInitialEmailHandler(params, req.userId);
            return res.json(result);
        } catch (e) {
            console.error("Failure while processing /invitation/confirm/send/initial", e);
            res.status(500).json("Failure");
            return;
        }
    }
);

app.post(
    "/invitation/confirm/send/repeat",
    jsonParser,
    checkJwt,
    checkUserScopes,
    async (_req: Request, res: Response) => {
        const req = _req as AuthenticatedRequest;
        const params: invitationConfirmSendRepeatEmailArgs = req.body.input;
        console.log("Invitation/confirm/send/repeat", params);
        try {
            const result = await invitationConfirmSendRepeatEmailHandler(params, req.userId);
            return res.json(result);
        } catch (e) {
            console.error("Failure while processing /invitation/confirm/send/repeat", e);
            res.status(500).json("Failure");
            return;
        }
    }
);

const portNumber = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
export const server = app.listen(portNumber, function () {
    console.log(`App is listening on port ${process.env.PORT}!`);
    console.log("Initialising AWS client");
    initialiseAwsClient().then(() => {
        console.log("Initialised AWS client");
    });
});
