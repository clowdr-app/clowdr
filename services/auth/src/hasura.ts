import { computeAuthHeaders, getAuthHeader } from "@midspace/auth/auth";
import { AuthHeader } from "@midspace/shared-types/auth";
import { json } from "body-parser";
import type { Request, Response } from "express";
import express from "express";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import fetch from "node-fetch";

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

router.get("/auth", json() as any, async (req: Request, res: Response) => {
    try {
        const { openIdConfig, jwksClient } = await getOpenIdConfig();

        const getHeader = (normalcaseHeaderName: string): string | undefined =>
            getAuthHeader(req.headers, normalcaseHeaderName);

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
        const conferenceId = getHeader(AuthHeader.ConferenceId);
        const subconferenceId = getHeader(AuthHeader.SubconferenceId);
        const roomId = getHeader(AuthHeader.RoomId);
        const magicToken = getHeader(AuthHeader.MagicToken);
        const inviteCode = getHeader(AuthHeader.InviteCode);
        const role = getHeader(AuthHeader.Role);
        const includeRoomIds = getHeader(AuthHeader.IncludeRoomIds);
        const refreshRegistrationsCache = getHeader(AuthHeader.RefreshRegistrationsCache);

        const result = await computeAuthHeaders(
            req.log,
            { userId },
            {
                conferenceId,
                subconferenceId,
                roomId,
                magicToken,
                inviteCode,
                role,
                includeRoomIds: includeRoomIds?.toLowerCase() === "true",
                refreshRegistrationsCache: refreshRegistrationsCache?.toLowerCase() === "true",
            }
        );
        req.log.trace({ result }, "Handled webhook");
        if (typeof result !== "string") {
            res.status(200).json(result);
        } else {
            res.status(401).json("Unauthorized");

            req.log.info(
                {
                    userId,
                    conferenceId,
                    subconferenceId,
                    roomId,
                    magicToken,
                    inviteCode,
                    role,
                    includeRoomIds,
                    jwtPresent: Boolean(encodedToken),
                    reason: result,
                },
                "Unauthorizing request"
            );
        }
    } catch (err) {
        req.log.error({ err }, "Failure/error while handling Hasura Auth webhook");
        res.status(500).json("Failure while handling Hasura Auth webhook");
        return;
    }
});
