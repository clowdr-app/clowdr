import assert from "assert";
import getStream from "get-stream";
import { Readable } from "stream";
import { S3 } from "../../aws/awsClient";

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
