import assert from "assert";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";
import { is } from "typescript-is";
import checkScopes from "./checkScopes";
import handlerEcho from "./handlers/echo";
import { handleConferenceCreated } from "./handlers/event";
import protectedEchoHandler from "./handlers/protectedEcho";
import { ConferenceData, Payload } from "./types/event";

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
}

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 1,
        jwksUri: `https://${process.env.AUTH0_API_DOMAIN}/.well-known/jwks.json`,
    }),

    // Validate the audience and the issuer.
    audience: process.env.AUTH0_AUDIENCE,
    issuer: process.env.AUTH0_ISSUER_DOMAIN,
    algorithms: ["RS256"],
    requestProperty: "auth",
    getToken: function fromHeaderOrQuerystring(req) {
        if (
            req.headers.authorization &&
            req.headers.authorization.split(" ")[0] === "Bearer"
        ) {
            return req.headers.authorization.split(" ")[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    },
});

const checkUserScopes = checkScopes(
    ["user"],
    "auth",
    "https://hasura.io/jwt/claims",
    "x-hasura-allowed-roles"
);

export const app: express.Application = express();
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

const portNumber = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
export const server = app.listen(portNumber, function () {
    console.log(`App is listening on port ${process.env.PORT}!`);
});
