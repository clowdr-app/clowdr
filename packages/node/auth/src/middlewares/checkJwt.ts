import type { AWSClient } from "@midspace/component-clients/aws/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
export const checkJwt = (
    awsClient: AWSClient
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return async (req, res, next) => {
        const AUTH0_API_DOMAIN = await awsClient.getAWSParameter("AUTH0_API_DOMAIN");
        const AUTH0_AUDIENCE = await awsClient.getAWSParameter("AUTH0_AUDIENCE");
        const AUTH0_ISSUER_DOMAIN = await awsClient.getAWSParameter("AUTH0_ISSUER_DOMAIN");

        return jwt({
            // Dynamically provide a signing key
            // based on the kid in the header and
            // the signing keys provided by the JWKS endpoint.
            secret: jwksRsa.expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 1,
                jwksUri: `https://${AUTH0_API_DOMAIN}/.well-known/jwks.json`,
            }),

            // Validate the audience and the issuer.
            audience: AUTH0_AUDIENCE,
            issuer: AUTH0_ISSUER_DOMAIN,
            algorithms: ["RS256"],
            getToken: function fromHeaderOrQuerystring(req) {
                if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
                    return req.headers.authorization.split(" ")[1];
                } else if (req.query && req.query.token) {
                    return req.query.token;
                }
                return null;
            },
        })(req, res, next);
    };
};
