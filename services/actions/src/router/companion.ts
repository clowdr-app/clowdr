import companion from "@uppy/companion";
import { json } from "body-parser";
import cors from "cors";
import express from "express";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { awsClient, getAWSParameter, getHostUrl } from "../lib/aws/awsClient";

export async function createRouter(): Promise<express.Router> {
    const router = express.Router();

    const credentials = await awsClient.credentials();

    router.use(
        cors({
            origin: (await getAWSParameter(`${process.env.SERVICE_NAME}_CORS_ORIGIN`)).split(","),
        })
    );
    router.use(json());
    router.use(
        companion.app({
            providerOptions: {
                s3: {
                    bucket: await getAWSParameter("CONTENT_BUCKET_ID"),
                    key: credentials.accessKeyId,
                    secret: credentials.secretAccessKey,
                    region: awsClient.region,
                    getKey(_req, filename, _metadata) {
                        const extension = extname(filename);
                        return `${uuidv4()}${extension}`;
                    },
                    acl: "private",
                    awsClientOptions: {
                        logger: console,
                    },
                },
            },
            server: {
                host: await getHostUrl(),
            },
            filePath: "./",
            secret: "foo",
        })
    );

    return router;
}
