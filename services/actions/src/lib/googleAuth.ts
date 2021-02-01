import assert from "assert";
import { google } from "googleapis";

assert(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID environment variable not provided");
assert(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET environment variable not provided");

export const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

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
