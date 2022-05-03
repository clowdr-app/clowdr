import { Request, RequestHandler } from "express";
import { expressjwt as jwt } from "express-jwt";
import { Jwt, Secret } from "jsonwebtoken";
import jwksRsa from "jwks-rsa";

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
export const checkJwt: RequestHandler = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: (req: Request, token: Jwt | undefined) =>
        new Promise<Secret>((resolve, reject) => {
            const getter = jwksRsa.expressJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 1,
                jwksUri: `https://${process.env.AUTH0_API_DOMAIN}/.well-known/jwks.json`,
            });
            getter(req, token?.header, token?.payload, (err: any, secret?: Secret | undefined) => {
                if (err) {
                    reject(err);
                }
                if (secret) {
                    resolve(secret);
                }
                reject("No secret returned");
            });
        }),

    // Validate the audience and the issuer.
    audience: process.env.AUTH0_AUDIENCE,
    issuer: process.env.AUTH0_ISSUER_DOMAIN,
    algorithms: ["RS256"],
    getToken: function fromHeaderOrQuerystring(req) {
        if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
            return req.headers.authorization.split(" ")[1];
        } else if (req.query && req.query.token && typeof req.query.token === "string") {
            return req.query.token;
        }
        return undefined;
    },
});
