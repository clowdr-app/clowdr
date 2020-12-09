import sgMail from "@sendgrid/mail";
import assert from "assert";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { is } from "typescript-is";
import handlerEcho from "./handlers/echo";
import { handleConferenceCreated, handleEmailCreated } from "./handlers/event";
import protectedEchoHandler from "./handlers/protectedEcho";
import { checkJwt } from "./middlewares/checkJwt";
import { checkUserScopes } from "./middlewares/checkScopes";
import { router as companionRouter } from "./router/companion";
import { ConferenceData, EmailData, Payload } from "./types/event";

if (process.env.NODE_ENV !== "test") {
    assert(
        process.env.AUTH0_API_DOMAIN,
        "AUTH0_API_DOMAIN environment variable not provided."
    );
    assert(
        process.env.AUTH0_AUDIENCE,
        "AUTH0_AUDIENCE environment variable not provided."
    );
    assert(
        process.env.AUTH0_ISSUER_DOMAIN,
        "AUTH0_ISSUER_DOMAIN environment variable not provided."
    );

    assert(
        process.env.SENDGRID_API_KEY,
        "SENDGRID_API_KEY environment variable not provided."
    );
    assert(
        process.env.SENDGRID_SENDER,
        "SENDGRID_SENDER environment variable not provided."
    );

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

assert(
    process.env.EVENT_SECRET,
    "EVENT_SECRET (x-hasura-event-secret custom session variable) environment variable not provided."
);

export const app: express.Application = express();

app.use("/companion", companionRouter);

app.use(function (req, res, next) {
    if (req.headers["x-hasura-event-secret"] !== process.env.EVENT_SECRET) {
        res.status(401);
        res.send({});
        next(new Error("Event secret missing"));
    } else {
        next();
    }
});

const jsonParser = bodyParser.json();

app.get("/", function (_req, res) {
    res.send("Hello World!");
});

app.post(
    "/protectedEcho",
    jsonParser,
    checkJwt,
    checkUserScopes,
    async (req: Request, res: Response) => {
        const params: protectedEchoArgs = req.body.input;
        console.log(`Echoing (protected) "${params.message}"`);
        const result = await protectedEchoHandler(params);
        return res.json(result);
    }
);

app.post("/echo", jsonParser, async (req: Request, res: Response) => {
    const params: echoArgs = req.body.input;
    console.log(`Echoing "${params.message}"`);
    const result = handlerEcho(params);
    return res.json(result);
});

app.post("/event", jsonParser, async (req: Request, res: Response) => {
    if (is<Payload>(req.body)) {
        try {
            if (
                req.body.trigger.name === "ConferenceCreated" &&
                is<Payload<ConferenceData>>(req.body)
            ) {
                await handleConferenceCreated(req.body);
            } else {
                console.log("Received unhandled payload");
            }
        } catch (e) {
            res.status(500).json("Failure while handling event");
            return;
        }
        res.status(200).json("OK");
    } else {
        console.log("Received incorrect payload");
        res.status(500).json("Unexpected payload");
    }
});

app.post("/emailCreated", jsonParser, async (req: Request, res: Response) => {
    if (is<Payload>(req.body)) {
        try {
            if (
                req.body.trigger.name === "EmailCreated" &&
                is<Payload<EmailData>>(req.body)
            ) {
                await handleEmailCreated(req.body);
            } else {
                console.log(
                    `Received unhandled payload: ${req.body.trigger.name}`
                );
                res.status(400).json("Received unhandled payload");
                return;
            }
        } catch (e) {
            res.status(500).json("Failure while handling event");
            return;
        }
        res.status(200).json("OK");
    } else {
        console.log("Received incorrect payload");
        res.status(500).json("Unexpected payload");
    }
});

const portNumber = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
export const server = app.listen(portNumber, function () {
    console.log(`App is listening on port ${process.env.PORT}!`);
});
