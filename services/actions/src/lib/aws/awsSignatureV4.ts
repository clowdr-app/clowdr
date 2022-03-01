import type { BinaryToTextEncoding } from "crypto";
import crypto from "crypto";
import type { ParsedQuery } from "query-string";
import querystring from "query-string";

function createCanonicalRequest(
    method: string,
    pathname: string,
    query: ParsedQuery,
    headers: Record<string, string | number>,
    payload: any
) {
    return [
        method.toUpperCase(),
        pathname,
        createCanonicalQueryString(query),
        createCanonicalHeaders(headers),
        createSignedHeaders(headers),
        payload,
    ].join("\n");
}

function createCanonicalQueryString(params: ParsedQuery) {
    return Object.keys(params)
        .filter((key) => typeof params[key] === "string")
        .sort()
        .map(function (key) {
            return encodeURIComponent(key) + "=" + encodeURIComponent(params[key] as string);
        })
        .join("&");
}

function createCanonicalHeaders(headers: Record<string, string | number>) {
    return Object.keys(headers)
        .sort()
        .map(function (name) {
            return name.toLowerCase().trim() + ":" + headers[name].toString().trim() + "\n";
        })
        .join("");
}

function createSignedHeaders(headers: Record<string, string | number>) {
    return Object.keys(headers)
        .sort()
        .map(function (name) {
            return name.toLowerCase().trim();
        })
        .join(";");
}

function createCredentialScope(time: string | number | Date, region: string, service: string) {
    return [toDate(time), region, service, "aws4_request"].join("/");
}

function createStringToSign(time: string | number | Date, region: string, service: string, request: string) {
    return ["AWS4-HMAC-SHA256", toTime(time), createCredentialScope(time, region, service), hash(request, "hex")].join(
        "\n"
    );
}

function createSignature(
    secret: string,
    time: string | number | Date,
    region: string,
    service: string,
    stringToSign: string
) {
    const h1 = hmac("AWS4" + secret, toDate(time)); // date-key
    const h2 = hmac(h1, region); // region-key
    const h3 = hmac(h2, service); // service-key
    const h4 = hmac(h3, "aws4_request"); // signing-key
    return hmac(h4, stringToSign, "hex") as string;
}

export function createPresignedURL(
    method: string,
    host: string,
    path: string,
    service: string,
    payload: any,
    options: {
        key: string;
        secret: string;
        protocol?: string;
        headers?: Record<string, string>;
        timestamp?: number;
        region?: string;
        expires?: number;
        query?: string;
        sessionToken?: string;
    }
) {
    options = options || {};
    options.protocol = options.protocol || "https";
    options.timestamp = options.timestamp || Date.now();
    options.region = options.region || "eu-west-1";
    options.expires = options.expires || 86400; // 24 hours
    options.headers = options.headers || {};

    // host is required
    options.headers.Host = host;

    const query = options.query ? querystring.parse(options.query) : {};
    query["X-Amz-Algorithm"] = "AWS4-HMAC-SHA256";
    query["X-Amz-Credential"] = options.key + "/" + createCredentialScope(options.timestamp, options.region, service);
    query["X-Amz-Date"] = toTime(options.timestamp);
    query["X-Amz-Expires"] = options.expires.toString();
    query["X-Amz-SignedHeaders"] = createSignedHeaders(options.headers);
    if (options.sessionToken) {
        query["X-Amz-Security-Token"] = options.sessionToken;
    }

    const canonicalRequest = createCanonicalRequest(method, path, query, options.headers, payload);
    const stringToSign = createStringToSign(options.timestamp, options.region, service, canonicalRequest);
    const signature = createSignature(options.secret, options.timestamp, options.region, service, stringToSign);
    query["X-Amz-Signature"] = signature;
    return options.protocol + "://" + host + path + "?" + querystring.stringify(query);
}

function toTime(time: string | number | Date): string {
    return new Date(time).toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDate(time: string | number | Date): string {
    return toTime(time).substring(0, 8);
}

function hmac(key: string | Buffer, string: string, encoding?: BinaryToTextEncoding): string | Buffer {
    const x = crypto.createHmac("sha256", key).update(string, "utf8");
    if (encoding) {
        return x.digest(encoding);
    }
    return x.digest();
}

function hash(string: string, encoding: BinaryToTextEncoding): string {
    return crypto.createHash("sha256").update(string, "utf8").digest(encoding);
}
