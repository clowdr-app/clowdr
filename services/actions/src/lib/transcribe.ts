import { gql } from "@apollo/client/core";
import { LanguageCode } from "@aws-sdk/client-transcribe";
import { AWSJobStatus, VideoContentBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import path from "path";
import R from "ramda";
import { assertType, is } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import {
    ContentItemAddNewVersionDocument,
    CreateTranscriptionJobDocument,
    GetTranscriptionJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3, Transcribe } from "./aws/awsClient";
import { getS3TextObject } from "./aws/s3";
import { getLatestVersion } from "./contentItem";
import { AmazonTranscribeOutput, convertJsonToSrt } from "./subtitleConvert";

gql`
    mutation CreateTranscriptionJob(
        $awsTranscribeJobName: String!
        $contentItemId: uuid!
        $videoS3Url: String!
        $transcriptionS3Url: String!
        $languageCode: String!
    ) {
        insert_TranscriptionJob_one(
            object: {
                awsTranscribeJobName: $awsTranscribeJobName
                contentItemId: $contentItemId
                videoS3Url: $videoS3Url
                transcriptionS3Url: $transcriptionS3Url
                languageCode: $languageCode
            }
        ) {
            id
        }
    }

    query GetTranscriptionJob($awsTranscribeJobName: String!) {
        TranscriptionJob(where: { awsTranscribeJobName: { _eq: $awsTranscribeJobName } }) {
            videoS3Url
            contentItemId
            transcriptionS3Url
            languageCode
            id
        }
    }
`;

function replaceExtension(key: string, extension: string): string {
    return path.posix.format({
        ...path.posix.parse(key),
        base: undefined,
        ext: extension,
    });
}

export async function completeTranscriptionJob(awsTranscribeJobName: string): Promise<void> {
    // Find our stored record of this transcription job
    const transcriptionJobResult = await apolloClient.query({
        query: GetTranscriptionJobDocument,
        variables: {
            awsTranscribeJobName,
        },
    });

    if (transcriptionJobResult.data.TranscriptionJob.length !== 1) {
        throw new Error("Could not find the specified transcription job");
    }

    const job = transcriptionJobResult.data.TranscriptionJob[0];

    const { latestVersion } = await getLatestVersion(job.contentItemId);
    assert(latestVersion, `Could not find latest version of content item ${job.contentItemId}`);

    // Convert the Transcribe output to SRT and save to S3

    const { bucket, key } = AmazonS3URI(job.transcriptionS3Url);
    assert(bucket, "Could not parse bucket from S3 URI");
    assert(key, "Could not parse key from S3 URI");

    const transcriptText = await getS3TextObject(bucket, key);
    const transcriptJson = await JSON.parse(transcriptText);

    assertType<AmazonTranscribeOutput>(transcriptJson);

    const transcriptSrt = convertJsonToSrt(transcriptJson);
    const transcriptSrtKey = replaceExtension(key, ".srt");

    await S3.putObject({
        Bucket: bucket,
        Key: transcriptSrtKey,
        Body: transcriptSrt,
    });

    // Save the new version of the content item
    const newVersion = R.clone(latestVersion);
    assert(is<VideoContentBlob>(newVersion.data), `Content item ${job.contentItemId} is not a video`);

    newVersion.data.subtitles = {};
    newVersion.data.subtitles[job.languageCode] = {
        s3Url: `s3://${bucket}/${transcriptSrtKey}`,
        status: AWSJobStatus.Completed,
    };

    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    await apolloClient.mutate({
        mutation: ContentItemAddNewVersionDocument,
        variables: {
            id: job.contentItemId,
            newVersion,
        },
    });

    if (transcriptionJobResult.errors) {
        console.error(
            `Failed to record completed transcription for ${job.contentItemId}`,
            transcriptionJobResult.errors
        );
        throw new Error(`Failed to record completed transcription for ${job.contentItemId}`);
    }
}

export async function failTranscriptionJob(awsTranscribeJobName: string): Promise<void> {
    // Find our stored record of this transcription job
    const transcriptionJobResult = await apolloClient.query({
        query: GetTranscriptionJobDocument,
        variables: {
            awsTranscribeJobName,
        },
    });

    if (transcriptionJobResult.data.TranscriptionJob.length !== 1) {
        throw new Error("Could not find the specified transcription job");
    }

    const job = transcriptionJobResult.data.TranscriptionJob[0];

    const { latestVersion } = await getLatestVersion(job.contentItemId);
    assert(latestVersion, `Could not find latest version of content item ${job.contentItemId}`);

    // Save the new version of the content item
    const newVersion = R.clone(latestVersion);
    assert(is<VideoContentBlob>(newVersion.data), `Content item ${job.contentItemId} is not a video`);

    newVersion.data.subtitles = {};
    newVersion.data.subtitles[job.languageCode] = {
        s3Url: "",
        status: AWSJobStatus.Failed,
        message: `Job ${awsTranscribeJobName} failed`,
    };

    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "system";

    await apolloClient.mutate({
        mutation: ContentItemAddNewVersionDocument,
        variables: {
            id: job.contentItemId,
            newVersion,
        },
    });

    if (transcriptionJobResult.errors) {
        console.error(`Failed to record failure of transcribe for ${job.contentItemId}`, transcriptionJobResult.errors);
        throw new Error(`Failed to record failure of transcribe for ${job.contentItemId}`);
    }
}

export async function startTranscribe(transcodeS3Url: string, contentItemId: string): Promise<void> {
    console.log(`Starting transcribe for ${transcodeS3Url}`);
    const { bucket, key } = AmazonS3URI(transcodeS3Url);

    if (bucket !== process.env.AWS_CONTENT_BUCKET_ID) {
        console.error("Unexpected S3 bucket", bucket);
        throw new Error(`Unexpected S3 bucket: ${bucket}`);
    }

    if (!key) {
        console.error("Could not parse S3 URL:", transcodeS3Url);
        throw new Error(`Could not parse S3 URL: ${transcodeS3Url}`);
    }

    const outputKey = replaceExtension(key, ".json");

    const transcriptionJobName = uuidv4();

    await Transcribe.startTranscriptionJob({
        Media: {
            MediaFileUri: transcodeS3Url, //todo
        },
        TranscriptionJobName: transcriptionJobName,
        LanguageCode: LanguageCode.EN_US,
        IdentifyLanguage: false,
        JobExecutionSettings: {
            DataAccessRoleArn: process.env.AWS_TRANSCRIBE_SERVICE_ROLE_ARN,
        },
        OutputBucketName: process.env.AWS_CONTENT_BUCKET_ID,
        OutputKey: outputKey,
    });

    await apolloClient.mutate({
        mutation: CreateTranscriptionJobDocument,
        variables: {
            awsTranscribeJobName: transcriptionJobName,
            contentItemId,
            videoS3Url: transcodeS3Url,
            languageCode: "en_US",
            transcriptionS3Url: `s3://${process.env.AWS_CONTENT_BUCKET_ID}/${outputKey}`,
        },
    });

    console.log(`Started transcribe for ${transcodeS3Url}`);
}
