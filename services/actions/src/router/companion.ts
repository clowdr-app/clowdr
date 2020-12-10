import companion from "@uppy/companion";
import assert from "assert";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";

assert(
    process.env.AWS_ACCESS_KEY_ID,
    "AWS_ACCESS_KEY_ID environment variable not provided."
);
assert(
    process.env.AWS_SECRET_ACCESS_KEY,
    "AWS_SECRET_ACCESS_KEY environment variable not provided."
);
assert(process.env.AWS_REGION, "AWS_REGION environment variable not provided.");
assert(process.env.HOST, "HOST environment variable not provided.");
assert(
    process.env.AWS_CONTENT_BUCKET_ID,
    "AWS_CONTENT_BUCKET_ID environment variable not provided."
);

export const router = express.Router();

router.use(
    cors({
        origin: "*",
    })
);
router.use(bodyParser.json());
router.use(
    companion.app({
        providerOptions: {
            s3: {
                bucket: process.env.AWS_CONTENT_BUCKET_ID,
                key: process.env.AWS_ACCESS_KEY_ID,
                secret: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION,
                getKey(_req, filename, _metadata) {
                    return filename;
                },
                acl: "private",
                awsClientOptions: {
                    logger: console,
                },
            },
        },
        server: {
            host: process.env.HOST,
        },
        filePath: "./",
        secret: "foo",
    })
);
