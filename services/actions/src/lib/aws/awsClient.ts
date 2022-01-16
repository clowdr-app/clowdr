import { Chime } from "@aws-sdk/client-chime";
import { CloudFront } from "@aws-sdk/client-cloudfront";
import { ElasticTranscoder } from "@aws-sdk/client-elastic-transcoder";
import { IAM } from "@aws-sdk/client-iam";
import { MediaConvert } from "@aws-sdk/client-mediaconvert";
import { MediaPackage } from "@aws-sdk/client-mediapackage";
import { S3 } from "@aws-sdk/client-s3";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { AssumeRoleCommand, STS } from "@aws-sdk/client-sts";
import { Transcribe } from "@aws-sdk/client-transcribe";
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";
import type { Credentials } from "@aws-sdk/types";
import { createAWSClient, subscribeToSNSNotifications } from "@midspace/component-clients/aws/client";
import assert from "assert";
import { customAlphabet } from "nanoid";
import pMemoize from "p-memoize";
import { logger } from "../logger";

assert(process.env.SERVICE_NAME, "Missing SERVICE_NAME environment variable");

const awsClient = createAWSClient(process.env.SERVICE_NAME, logger);
const chimeClient = createAWSClient("CHIME_" + process.env.SERVICE_NAME, logger);

async function getImagesSecretsManagerClient(): Promise<SecretsManager> {
    const AWS_IMAGES_SECRET_ACCESS_ROLE_ARN = await awsClient.getAWSParameter("IMAGES_SECRET_ACCESS_ROLE_ARN");

    return new SecretsManager({
        credentials: fromTemporaryCredentials({
            masterCredentials: awsClient.credentials,
            params: {
                RoleArn: AWS_IMAGES_SECRET_ACCESS_ROLE_ARN,
                DurationSeconds: 3600,
            },
            clientConfig: {
                region: awsClient.region,
            },
        }),
        region: awsClient.region,
    });
}

const imagesSecretsManager = pMemoize(getImagesSecretsManagerClient);

const iam = new IAM({
    credentials: awsClient.credentials,
    region: awsClient.region,
});

const s3 = new S3({
    credentials: awsClient.credentials,
    region: awsClient.region,
    signingRegion: awsClient.region,
});

const transcribe = new Transcribe({
    credentials: awsClient.credentials,
    region: awsClient.region,
});

const transcoder = new ElasticTranscoder({
    credentials: awsClient.credentials,
    region: awsClient.region,
});

const mediaPackage = new MediaPackage({
    credentials: awsClient.credentials,
    region: awsClient.region,
});

const cloudFront = new CloudFront({
    credentials: awsClient.credentials,
    region: awsClient.region,
});

const sts = new STS({
    credentials: awsClient.credentials,
    region: awsClient.region,
});

let chimeCredentials: Credentials | null;
const chime = new Chime({
    credentials: async () => {
        if (!chimeCredentials?.expiration || chimeCredentials.expiration.getTime() - Date.now() < 300000) {
            const AWS_CHIME_MANAGER_ROLE_ARN = await awsClient.getAWSParameter("CHIME_MANAGER_ROLE_ARN");

            const assumeChimeRoleCommand = new AssumeRoleCommand({
                RoleArn: AWS_CHIME_MANAGER_ROLE_ARN,
                RoleSessionName: "chime-session",
                DurationSeconds: 3600,
            });

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

            logger.info({ roleArn: AWS_CHIME_MANAGER_ROLE_ARN }, "Generated new Chime credentials");
        }

        return chimeCredentials;
    },
    region: awsClient.region,
    // endpoint: "https://service.chime.aws.amazon.com/console",
});

let mediaconvert: MediaConvert | null = null;

const shortId = customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", 5);

async function getMediaConvertClient(): Promise<MediaConvert> {
    let mediaConvertEndpoint = await awsClient.getAWSOptionalParameter("MEDIACONVERT_API_ENDPOINT");

    if (!mediaConvertEndpoint) {
        const mediaConvertEndpointDescription = await new MediaConvert({
            apiVersion: "2017-08-29",
            credentials: awsClient.credentials,
            region: awsClient.region,
        }).describeEndpoints({});

        if (
            !mediaConvertEndpointDescription.Endpoints ||
            mediaConvertEndpointDescription.Endpoints.length < 1 ||
            !mediaConvertEndpointDescription.Endpoints[0].Url
        ) {
            throw new Error("Could not retrieve endpoint for MediaConvert");
        }
        mediaConvertEndpoint = mediaConvertEndpointDescription.Endpoints[0].Url;
    }

    return new MediaConvert({
        apiVersion: "2017-08-29",
        credentials: awsClient.credentials,
        region: awsClient.region,
        endpoint: mediaConvertEndpoint,
    });
}

async function initialiseAwsClient(): Promise<void> {
    mediaconvert = await getMediaConvertClient();

    await subscribeToSNSNotifications(
        awsClient,
        logger,
        "Systems Manager Parameter Store notifications",
        "PARAMETER_STORE_NOTIFICATIONS_TOPIC_ARN",
        "/systemsManager/parameterStore/notify"
    );
    await subscribeToSNSNotifications(
        awsClient,
        logger,
        "Secrets Manager notifications",
        "SECRETS_MANAGER_NOTIFICATIONS_TOPIC_ARN",
        "/secretsManager/notify"
    );
    await subscribeToSNSNotifications(
        awsClient,
        logger,
        "transcode notifications",
        "TRANSCODE_NOTIFICATIONS_TOPIC_ARN",
        "/mediaConvert/notify"
    );
    await subscribeToSNSNotifications(
        awsClient,
        logger,
        "transcribe notifications",
        "TRANSCRIBE_NOTIFICATIONS_TOPIC_ARN",
        "/amazonTranscribe/notify"
    );
    await subscribeToSNSNotifications(
        awsClient,
        logger,
        "Elastic Transcoder notifications",
        "ELASTIC_TRANSCODER_NOTIFICATIONS_TOPIC_ARN",
        "/elasticTranscoder/notify"
    );
    await subscribeToSNSNotifications(
        awsClient,
        logger,
        "MediaPackage harvest job notifications",
        "MEDIAPACKAGE_HARVEST_NOTIFICATIONS_TOPIC_ARN",
        "/mediaPackage/harvest/notify"
    );
    await subscribeToSNSNotifications(
        awsClient,
        logger,
        "Chime notifications",
        "CHIME_NOTIFICATIONS_TOPIC_ARN",
        "/chime/notify",
        true,
        "us-east-1",
        chimeClient
    );
}

const getAWSOptionalParameter = awsClient.getAWSOptionalParameter;
const getAWSParameter = awsClient.getAWSParameter;
const getHostUrl = awsClient.getHostUrl;

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
    imagesSecretsManager as ImagesSecretsManager,
    initialiseAwsClient,
    shortId,
    getAWSOptionalParameter,
    getAWSParameter,
    getHostUrl,
    awsClient,
};
