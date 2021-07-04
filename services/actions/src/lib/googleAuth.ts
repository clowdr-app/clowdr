import assert from "assert";
import { OAuth2Client } from "google-auth-library";

export function createOAuth2Client(): OAuth2Client {
    assert(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID environment variable not provided");
    assert(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET environment variable not provided");

    return new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });
}

export interface GoogleIdToken {
    iss: string;
    azp: string;
    aud: string;
    sub: string;
    at_hash: string;
    hd: string;
    email: string;
    email_verified: string;
    iat: number;
    exp: number;
    nonce: string;
}
