import { json } from "body-parser";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { assertType } from "typescript-is";
import { handleAuthWebhook } from "../handlers/hasura";

export const router = express.Router();

const jwksClient = jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 1,
    jwksUri: `https://${process.env.AUTH0_API_DOMAIN}/.well-known/jwks.json`,
});

router.post("/auth", json(), async (req: Request, res: Response) => {
    try {
        assertType<AuthPayload>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }

    const payload: AuthPayload = req.body;

    try {
        let decodedToken: any | null = null;
        const encodedToken = payload.headers.Authorization?.split(" ")[1];
        if (encodedToken && typeof encodedToken === "string") {
            const completeDecodedToken = jwt.decode(encodedToken, { complete: true });

            try {
                if (completeDecodedToken && typeof completeDecodedToken !== "string") {
                    const key = await jwksClient.getSigningKey(completeDecodedToken.header.kid);
                    decodedToken = jwt.verify(encodedToken, key.getPublicKey(), { algorithms: ["RS256"] });
                }
            } catch {
                // Ignore
            }
        }

        let userId: undefined | string;
        if (
            "https://hasura.io/jwt/claims" in decodedToken &&
            decodedToken["https://hasura.io/jwt/claims"] &&
            "x-hasura-allowed-roles" in decodedToken["https://hasura.io/jwt/claims"] &&
            decodedToken["https://hasura.io/jwt/claims"]["x-hasura-allowed-roles"]
        ) {
            const scopesSource: any = decodedToken["https://hasura.io/jwt/claims"]["x-hasura-allowed-roles"];
            let authScopes: string[];
            if (typeof scopesSource === "string") {
                authScopes = scopesSource.split(" ");
            } else if (Array.isArray(scopesSource)) {
                authScopes = scopesSource;
            } else {
                authScopes = [];
            }

            if (authScopes.includes("user")) {
                userId = decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
            }
        }

        const result = await handleAuthWebhook(payload, userId);
        if (result !== false) {
            res.status(200).json(result);
        } else {
            res.status(401).json("Unauthorized");
        }
    } catch (e) {
        console.error("Failure while handling Hasura Auth webhook", e);
        res.status(500).json("Failure while handling Hasura Auth webhook");
        return;
    }
});
