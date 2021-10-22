import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import fetch from "node-fetch";
import { assertType } from "typescript-is";
import { handleAuthWebhook } from "../http-handlers/hasura";

export const router = express.Router();

interface OpenIdConfig {
    issuer: string;
    jwks_uri: string;
}

let _jwksClient: jwksRsa.JwksClient;
let _openIdConfig: OpenIdConfig;
async function getOpenIdConfig(): Promise<{
    jwksClient: jwksRsa.JwksClient;
    openIdConfig: OpenIdConfig;
}> {
    if (!_openIdConfig) {
        const response = await fetch(`https://${process.env.AUTH0_API_DOMAIN}/.well-known/openid-configuration`);
        _openIdConfig = await response.json();
    }

    if (_openIdConfig && !_jwksClient) {
        _jwksClient = jwksRsa({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 1,
            jwksUri: _openIdConfig.jwks_uri,
        });
    }

    return {
        jwksClient: _jwksClient,
        openIdConfig: _openIdConfig,
    };
}

// Note: The "Import Content/Schedule" pages caused body parser to regularly hit
// the default 100kb limit. 5mb should be enough but for a very large conference
// it may still fail. This manifests as an `"Invalid response from authorization hook"`
// error response from Hasura to the browser.
router.post("/auth", json({ limit: "20mb" }) as any, async (req: Request, res: Response) => {
    // console.log("Auth request started");

    try {
        assertType<AuthPayload>(req.body);
    } catch (e) {
        console.error(`${req.originalUrl}: received incorrect payload`, e);
        res.status(500).json("Unexpected payload");
        return;
    }

    const payload: AuthPayload = req.body;
    // console.log("Auth payload", JSON.stringify(payload));

    try {
        const { openIdConfig, jwksClient } = await getOpenIdConfig();

        const getHeader = (normalcaseHeaderName: string): string | undefined => {
            if (payload.headers[normalcaseHeaderName]) {
                const header = payload.headers[normalcaseHeaderName];
                if (typeof header === "string" && header.length) {
                    return header;
                }
            }
            const lowercaseHeaderName = normalcaseHeaderName.toLowerCase();
            if (payload.headers[lowercaseHeaderName]) {
                const header = payload.headers[lowercaseHeaderName];
                if (typeof header === "string" && header.length) {
                    return header;
                }
            }
            const uppercaseHeaderName = normalcaseHeaderName.toUpperCase();
            if (payload.headers[uppercaseHeaderName]) {
                const header = payload.headers[uppercaseHeaderName];
                if (typeof header === "string" && header.length) {
                    return header;
                }
            }

            return undefined;
        };

        let decodedToken: any | null = null;
        const encodedToken = getHeader("Authorization")?.split(" ")[1];
        if (encodedToken && typeof encodedToken === "string") {
            const completeDecodedToken = jwt.decode(encodedToken, { complete: true });
            try {
                if (completeDecodedToken && typeof completeDecodedToken !== "string") {
                    const key = await jwksClient.getSigningKey(completeDecodedToken.header.kid);

                    decodedToken = jwt.verify(encodedToken, key.getPublicKey(), {
                        algorithms: [key.alg as jwt.Algorithm],
                        audience: process.env.JWT_AUDIENCE ?? "hasura",
                        issuer: openIdConfig.issuer,
                    });
                }
            } catch {
                // Ignore
            }
        }

        const userId: undefined | string = decodedToken?.["sub"];
        const conferenceId = getHeader("X-Auth-Conference-Id");
        const subconferenceId = getHeader("X-Auth-Subconference-Id");
        const roomId = getHeader("X-Auth-Room-Id");
        const magicToken = getHeader("X-Auth-Magic-Token");
        const inviteCode = getHeader("X-Auth-Invite-Code");
        const role = getHeader("X-Auth-Role");
        const includeRoomIds = getHeader("X-Auth-Include-Room-Ids");

        const result = await handleAuthWebhook(
            payload,
            { userId },
            {
                conferenceId,
                subconferenceId,
                roomId,
                magicToken,
                inviteCode,
                role,
                includeRoomIds: includeRoomIds?.toLowerCase() === "true",
            }
        );
        console.log(result);
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
