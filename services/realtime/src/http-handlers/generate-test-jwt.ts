import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import { testJWKs } from "../jwks";

export async function generateTestJWKs(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
        if (testJWKs) {
            if (!req.query.userId) {
                throw new Error("Missing userId query parameter");
            }
            if (!req.query.confSlug) {
                throw new Error("Missing confSlug query parameter");
            }

            const testPEM = jwkToPem(testJWKs[0], {
                private: true,
            });

            // Fake parts of an Auth0 token
            res.status(200).send(
                jwt.sign(
                    {
                        "https://hasura.io/jwt/claims": {
                            "x-hasura-default-role": "user",
                            "x-hasura-allowed-roles": ["user"],
                            "x-hasura-user-id": req.query.userId,
                            "x-hasura-conference-slug": req.query.confSlug,
                        },
                    },
                    testPEM,
                    {
                        algorithm: testJWKs[0].alg,
                        audience: ["hasura", "https://clowdr.eu.auth0.com/userinfo"],
                        issuer: "https://auth.clowdr.org/",
                        subject: req.query.userId as string,
                        keyid: testJWKs[0].kid,
                        expiresIn: "1800s",
                    }
                )
            );
        } else {
            res.status(503).send("Test JWKs not available");
        }
    } catch (e) {
        res.status(500).send(e.toString());
    }
}
