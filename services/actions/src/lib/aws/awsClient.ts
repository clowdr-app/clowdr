import { Chime } from "@aws-sdk/client-chime";
import { CloudFront } from "@aws-sdk/client-cloudfront";
import { ElasticTranscoder } from "@aws-sdk/client-elastic-transcoder";
import { IAM } from "@aws-sdk/client-iam";
import { MediaConvert } from "@aws-sdk/client-mediaconvert";
import { MediaPackage } from "@aws-sdk/client-mediapackage";
import { S3 } from "@aws-sdk/client-s3";
import { SNS } from "@aws-sdk/client-sns";
import { AssumeRoleCommand, STS } from "@aws-sdk/client-sts";
import { Transcribe } from "@aws-sdk/client-transcribe";
import type { Credentials } from "@aws-sdk/types";
import assert from "assert";
import { customAlphabet } from "nanoid";
import { getHostUrl } from "../../utils";
import { fromEnv } from "./credentialProviders";

assert(process.env.AWS_PREFIX, "Missing AWS_PREFIX environment variable");
assert(process.env.AWS_ACTIONS_USER_ACCESS_KEY_ID, "Missing AWS_ACTIONS_USER_ACCESS_KEY_ID environment variable");
assert(
    process.env.AWS_ACTIONS_USER_SECRET_ACCESS_KEY,
    "Missing AWS_ACTIONS_USER_SECRET_ACCESS_KEY environment variable"
);
assert(
    process.env.AWS_CHIME_ACTIONS_USER_ACCESS_KEY_ID,
    "Missing AWS_CHIME_ACTIONS_USER_ACCESS_KEY_ID environment variable"
);
assert(
    process.env.AWS_CHIME_ACTIONS_USER_SECRET_ACCESS_KEY,
    "Missing AWS_CHIME_ACTIONS_USER_SECRET_ACCESS_KEY environment variable"
);

assert(process.env.AWS_REGION, "Missing AWS_REGION environment variable");
assert(process.env.AWS_MEDIACONVERT_SERVICE_ROLE_ARN, "Missing AWS_MEDIACONVERT_SERVICE_ROLE_ARN environment variable");
assert(
    process.env.AWS_ELASTIC_TRANSCODER_SERVICE_ROLE_ARN,
    "Missing AWS_ELASTIC_TRANSCODER_SERVICE_ROLE_ARN environment variable"
);
assert(process.env.AWS_TRANSCRIBE_SERVICE_ROLE_ARN, "Missing AWS_TRANSCRIBE_SERVICE_ROLE_ARN environment variable");
assert(
    process.env.AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN,
    "Missing AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN environment variable"
);
assert(
    process.env.AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN,
    "Missing AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN environment variable"
);
assert(
    process.env.AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN,
    "Missing AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN environment variable"
);
assert(process.env.AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN, "Missing AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN environment variable");
assert(
    process.env.AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN,
    "Missing AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN environment variable"
);

const credentials = fromEnv({
    envKey: "AWS_ACTIONS_USER_ACCESS_KEY_ID",
    envSecret: "AWS_ACTIONS_USER_SECRET_ACCESS_KEY",
});
const chimeUserCredentials = fromEnv({
    envKey: "AWS_CHIME_ACTIONS_USER_ACCESS_KEY_ID",
    envSecret: "AWS_CHIME_ACTIONS_USER_SECRET_ACCESS_KEY",
});
const region = process.env.AWS_REGION;

const iam = new IAM({
    credentials,
    region,
});

const s3 = new S3({
    credentials,
    region,
    signingRegion: region,
});

const sns = new SNS({
    credentials,
    region,
});

const snsChime = new SNS({
    credentials: chimeUserCredentials,
    region: "us-east-1",
});

const transcribe = new Transcribe({
    credentials,
    region,
});

const transcoder = new ElasticTranscoder({
    credentials,
    region,
});

const mediaPackage = new MediaPackage({
    credentials,
    region,
});

const cloudFront = new CloudFront({
    credentials,
    region,
});

const sts = new STS({
    credentials,
    region,
});

const assumeChimeRoleCommand = new AssumeRoleCommand({
    RoleArn: process.env.AWS_CHIME_MANAGER_ROLE_ARN,
    RoleSessionName: "chime-session",
    DurationSeconds: 3600,
});

let chimeCredentials: Credentials | null;
const chime = new Chime({
    credentials: async () => {
        if (!chimeCredentials?.expiration || chimeCredentials.expiration.getTime() - Date.now() < 300000) {
            const assumeRoleOutput = await sts.send(assumeChimeRoleCommand);
            const Credentials = assumeRoleOutput.Credentials;

            assert(Credentials);
            assert(Credentials.AccessKeyId);
            assert(Credentials.SecretAccessKey);

            chimeCredentials = {
                accessKeyId: Credentials.AccessKeyId,
                secretAccessKey: Credentials.SecretAccessKey,
                expiration: Credentials.Expiration,
                sessionToken: Credentials.SessionToken,
            };

            console.log("Generated new Chime credentials", { roleArn: process.env.AWS_CHIME_MANAGER_ROLE_ARN });
        }

        return chimeCredentials;
    },
    region,
    // endpoint: "https://service.chime.aws.amazon.com/console",
});

let mediaconvert: MediaConvert | null = null;

const shortId = customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", 5);

async function getMediaConvertClient(): Promise<MediaConvert> {
    let mediaConvertEndpoint = process.env.AWS_MEDIACONVERT_API_ENDPOINT;

    if (!mediaConvertEndpoint) {
        const mediaConvertEndpointDescription = await new MediaConvert({
            apiVersion: "2017-08-29",
            credentials,
            region,
        }).describeEndpoints({});

        if (
            !mediaConvertEndpointDescription.Endpoints ||
            mediaConvertEndpointDescription.Endpoints.length < 1 ||
            !mediaConvertEndpointDescription.Endpoints[0].Url
        ) {
            throw new Error("Could not retrieve customer-specific endpoint for MediaConvert");
        }
        mediaConvertEndpoint = mediaConvertEndpointDescription.Endpoints[0].Url;
    }

    return new MediaConvert({
        apiVersion: "2017-08-29",
        credentials,
        region,
        endpoint: mediaConvertEndpoint,
    });
}

async function initialiseAwsClient(): Promise<void> {
    mediaconvert = await getMediaConvertClient();

    // Subscribe to transcode SNS topic
    const transcodeNotificationUrl = new URL(getHostUrl());
    transcodeNotificationUrl.pathname = "/mediaConvert/notify";

    console.log("Subscribing to SNS topic: transcode notifications");
    const transcodeSubscribeResult = await sns.subscribe({
        Protocol: process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http",
        TopicArn: process.env.AWS_TRANSCODE_NOTIFICATIONS_TOPIC_ARN,
        Endpoint: transcodeNotificationUrl.toString(),
    });
    console.log("Subscribed to SNS topic: transcode notifications");

    if (!transcodeSubscribeResult.SubscriptionArn) {
        throw new Error("Could not subscribe to transcode notifications");
    }

    // Subscribe to transcribe SNS topic
    const transcribeNotificationUrl = new URL(getHostUrl());
    transcribeNotificationUrl.pathname = "/amazonTranscribe/notify";

    console.log("Subscribing to SNS topic: transcribe notifications");
    const transcribeSubscribeResult = await sns.subscribe({
        Protocol: process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http",
        TopicArn: process.env.AWS_TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN,
        Endpoint: transcribeNotificationUrl.toString(),
    });
    console.log("Subscribed to SNS topic: transcribe notifications");

    if (!transcribeSubscribeResult.SubscriptionArn) {
        throw new Error("Could not subscribe to transcribe notifications");
    }

    // Subscribe to Elastic Transcoder SNS topic
    const elasticTranscoderNotificationUrl = new URL(getHostUrl());
    elasticTranscoderNotificationUrl.pathname = "/elasticTranscoder/notify";

    console.log("Subscribing to SNS topic: Elastic Transcoder notifications");
    const elasticTranscoderSubscribeResult = await sns.subscribe({
        Protocol: process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http",
        TopicArn: process.env.AWS_ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN,
        Endpoint: elasticTranscoderNotificationUrl.toString(),
    });
    console.log("Subscribed to SNS topic: Elastic Transcoder notifications");

    if (!elasticTranscoderSubscribeResult.SubscriptionArn) {
        throw new Error("Could not subscribe to Elastic Transcoder notifications");
    }

    // Subscribe to MediaPackage Harvest SNS topic
    const mediaPackageHarvestNotificationUrl = new URL(getHostUrl());
    mediaPackageHarvestNotificationUrl.pathname = "/mediaPackage/harvest/notify";

    console.log("Subscribing to SNS topic: MediaPackage harvest job notifications");
    const mediaPackageHarvestSubscribeResult = await sns.subscribe({
        Protocol: process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http",
        TopicArn: process.env.AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN,
        Endpoint: mediaPackageHarvestNotificationUrl.toString(),
    });
    console.log("Subscribed to SNS topic: MediaPackage harvest notifications");

    if (!mediaPackageHarvestSubscribeResult.SubscriptionArn) {
        throw new Error("Could not subscribe to MediaPackage harvest notifications");
    }

    // Subscribe to Chime SNS topic
    const chimeNotificationUrl = new URL(getHostUrl());
    chimeNotificationUrl.pathname = "/chime/notify";

    if (process.env.AWS_CHIME_NOTIFICATIONS_TOPIC_ARN) {
        console.log("Subscribing to SNS topic: Chime notifications");
        const chimeSubscribeResult = await snsChime.subscribe({
            Protocol: process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http",
            TopicArn: process.env.AWS_CHIME_NOTIFICATIONS_TOPIC_ARN,
            Endpoint: chimeNotificationUrl.toString(),
        });
        console.log("Subscribed to SNS topic: Chime notifications");

        if (!chimeSubscribeResult.SubscriptionArn) {
            throw new Error("Could not subscribe to Chime notifications");
        }
    } else {
        console.warn("Not subscribing to SNS topic: Chime notifications (AWS_CHIME_NOTIFICATIONS_TOPIC_ARN not set)");
    }
}

export {
    iam as IAM,
    s3 as S3,
    mediaconvert as MediaConvert,
    transcribe as Transcribe,
    transcoder as ElasticTranscoder,
    mediaPackage as MediaPackage,
    cloudFront as CloudFront,
    sts as STS,
    chime as Chime,
    initialiseAwsClient,
    shortId,
};
