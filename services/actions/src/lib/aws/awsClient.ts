import { CloudFront } from "@aws-sdk/client-cloudfront";
import { ElasticTranscoder } from "@aws-sdk/client-elastic-transcoder";
import { IAM } from "@aws-sdk/client-iam";
import { MediaConvert } from "@aws-sdk/client-mediaconvert";
import { MediaLive } from "@aws-sdk/client-medialive";
import { MediaPackage } from "@aws-sdk/client-mediapackage";
import { S3 } from "@aws-sdk/client-s3";
import { SNS } from "@aws-sdk/client-sns";
import { Transcribe } from "@aws-sdk/client-transcribe";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import assert from "assert";
import { customAlphabet } from "nanoid";
import { getHostUrl } from "../../utils";

assert(process.env.AWS_PREFIX, "Missing AWS_PREFIX environment variable");
assert(process.env.AWS_ACCESS_KEY_ID, "Missing AWS_ACCESS_KEY_ID environment variable");
assert(process.env.AWS_SECRET_ACCESS_KEY, "Missing AWS_SECRET_ACCESS_KEY environment variable");

assert(process.env.AWS_REGION, "Missing AWS_REGION environment variable");
assert(process.env.AWS_MEDIALIVE_SERVICE_ROLE_ARN, "Missing AWS_MEDIALIVE_SERVICE_ROLE_ARN environment variable");
assert(
    process.env.AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN,
    "Missing AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN environment variable"
);
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
assert(
    process.env.AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID,
    "Missing AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID environment variable"
);
assert(process.env.AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN, "Missing AWS_MEDIAPACKAGE_SERVICE_ROLE_ARN environment variable");
assert(
    process.env.AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN,
    "Missing AWS_MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN environment variable"
);

const credentials = fromEnv();
const region = process.env.AWS_REGION;

const iam = new IAM({
    apiVersion: "2010-05-08",
    credentials,
    region,
});

const s3 = new S3({
    apiVersion: "2006-03-01",
    credentials,
    region,
    signingRegion: region,
});

const sns = new SNS({
    apiVersion: "2010-03-31",
    credentials,
    region,
});

const transcribe = new Transcribe({
    apiVersion: "2017-10-26",
    credentials,
    region,
});

const transcoder = new ElasticTranscoder({
    apiVersion: "2012-09-25",
    credentials,
    region,
});

const mediaLive = new MediaLive({
    apiVersion: "2017-10-14",
    credentials,
    region,
});

const mediaPackage = new MediaPackage({
    apiVersion: "2017-10-14",
    credentials,
    region,
});

const cloudFront = new CloudFront({
    apiVersion: "2020-05-31",
    credentials,
    region,
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

    // Subscribe to MediaLive SNS topic
    const mediaLiveNotificationUrl = new URL(getHostUrl());
    mediaLiveNotificationUrl.pathname = "/mediaLive/notify";

    console.log("Subscribing to SNS topic: MediaLive notifications");
    const mediaLiveSubscribeResult = await sns.subscribe({
        Protocol: process.env.HOST_SECURE_PROTOCOLS !== "false" ? "https" : "http",
        TopicArn: process.env.AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN,
        Endpoint: mediaLiveNotificationUrl.toString(),
    });
    console.log("Subscribed to SNS topic: MediaLive notifications");

    if (!mediaLiveSubscribeResult.SubscriptionArn) {
        throw new Error("Could not subscribe to MediaLive notifications");
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
}

export {
    iam as IAM,
    s3 as S3,
    mediaconvert as MediaConvert,
    transcribe as Transcribe,
    transcoder as ElasticTranscoder,
    mediaLive as MediaLive,
    mediaPackage as MediaPackage,
    cloudFront as CloudFront,
    initialiseAwsClient,
    shortId,
};
