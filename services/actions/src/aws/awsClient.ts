import { CloudFormation } from "@aws-sdk/client-cloudformation";
import { IAM } from "@aws-sdk/client-iam";
import { fromEnv } from "@aws-sdk/region-provider";
import { Credentials } from "@aws-sdk/types";
import { customAlphabet } from "nanoid";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
        "Missing AWS credentials: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY"
    );
}

const credentials: Credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

if (!process.env.AWS_REGION) {
    throw new Error("Missing AWS_REGION");
}

const region = fromEnv({ environmentVariableName: "AWS_REGION" });

const cf = new CloudFormation({
    apiVersion: "2010-05-15",
    credentials,
    region,
});

const iam = new IAM({
    apiVersion: "2010-05-08",
    credentials,
    region,
});

const shortId = customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", 5);

export { cf as CloudFormation, iam as IAM, shortId };
