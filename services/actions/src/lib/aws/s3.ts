import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import getStream from "get-stream";
import { Readable } from "stream";
import { S3 } from "./awsClient";

export async function checkS3Url(
    url: string
): Promise<{ result: "success"; key: string } | { result: "error"; message: string }> {
    const { region, bucket, key } = AmazonS3URI(url);
    if (region !== process.env.AWS_REGION) {
        return { result: "error", message: "Invalid S3 URL (region mismatch)" };
    }
    if (bucket !== process.env.AWS_CONTENT_BUCKET_ID) {
        return { result: "error", message: "Invalid S3 URL (bucket mismatch)" };
    }
    if (!key) {
        return { result: "error", message: "Invalid S3 URL (missing key)" };
    }

    try {
        await S3.headObject({
            Bucket: bucket,
            Key: key,
        });
    } catch (e: any) {
        return {
            result: "error",
            message: "Could not retrieve object from S3",
        };
    }

    return { result: "success", key };
}

export async function getS3TextObject(bucket: string, key: string): Promise<string> {
    const object = await S3.getObject({
        Bucket: bucket,
        Key: key,
    });

    assert(object.Body, "Object has no body");

    let text;
    if ("text" in object.Body && typeof object.Body.text === "function") {
        text = await object.Body.text();
    } else if (object.Body instanceof Readable) {
        text = await getStream(object.Body);
    } else {
        throw new Error("Could not get text from S3 object");
    }

    return text;
}
