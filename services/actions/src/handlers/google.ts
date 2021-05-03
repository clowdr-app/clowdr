import { gql } from "@apollo/client/core";
import { ElementBaseType, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import { Credentials } from "google-auth-library";
import { google } from "googleapis";
import jwt_decode from "jwt-decode";
import * as R from "ramda";
import { assertType } from "typescript-is";
import {
    CompleteUploadYouTubeVideoJobDocument,
    CreateYouTubeUploadDocument,
    FailUploadYouTubeVideoJobDocument,
    Google_CreateRegistrantGoogleAccountDocument,
    MarkAndSelectNewUploadYouTubeVideoJobsDocument,
    SelectNewUploadYouTubeVideoJobsDocument,
    UnmarkUploadYouTubeVideoJobsDocument,
    UploadYouTubeVideoJobDataFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { registrantBelongsToUser } from "../lib/authorisation";
import { S3 } from "../lib/aws/awsClient";
import { createOAuth2Client, GoogleIdToken } from "../lib/googleAuth";
import { callWithRetry } from "../utils";

assert(process.env.FRONTEND_DOMAIN, "FRONTEND_DOMAIN environment variable not provided.");
process.env.FRONTEND_PROTOCOL =
    process.env.FRONTEND_PROTOCOL || (process.env.FRONTEND_DOMAIN.startsWith("localhost") ? "http" : "https");

export async function handleGetGoogleOAuthUrl(params: getGoogleOAuthUrlArgs): Promise<GetGoogleOAuthUrlOutput> {
    const oauth2Client = createOAuth2Client();

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [...params.scopes, "openid email"],
        include_granted_scopes: true,
        state: params.registrantId,
        prompt: "select_account",
        redirect_uri: `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/googleoauth`,
    });

    return {
        url,
    };
}

gql`
    mutation Google_CreateRegistrantGoogleAccount(
        $registrantId: uuid!
        $conferenceId: uuid!
        $googleAccountEmail: String!
        $tokenData: jsonb!
    ) {
        insert_registrant_GoogleAccount_one(
            object: {
                registrantId: $registrantId
                conferenceId: $conferenceId
                googleAccountEmail: $googleAccountEmail
                tokenData: $tokenData
            }
            on_conflict: { constraint: GoogleAccount_registrantId_googleAccountEmail_key, update_columns: tokenData }
        ) {
            id
        }
    }
`;

export async function handleSubmitGoogleOAuthToken(
    params: submitGoogleOAuthCodeArgs,
    userId: string
): Promise<SubmitGoogleOAuthCodeOutput> {
    try {
        console.log("Retrieving Google auth token", userId, params.state);
        const validRegistrant = await registrantBelongsToUser(params.state, userId);
        assert(validRegistrant, "Registrant does not belong to the user");

        const oauth2Client = createOAuth2Client();

        console.log(params.code);
        const token = await oauth2Client.getToken({
            code: params.code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/googleoauth`,
        });

        if (!token.tokens.id_token) {
            console.error("Failed to retrieve id_token", userId);
            throw new Error("Failed to retrieve id_token");
        }

        console.log("Retrieved Google auth token", userId);

        console.log("Verifying Google JWT", userId, params.state);
        await oauth2Client.verifyIdToken({
            idToken: token.tokens.id_token,
            audience: oauth2Client._clientId,
        });

        const tokenData = jwt_decode<GoogleIdToken>(token.tokens.id_token);

        console.log("Saving Google OAuth tokens", userId, params.state);
        await apolloClient.mutate({
            mutation: Google_CreateRegistrantGoogleAccountDocument,
            variables: {
                registrantId: params.state,
                conferenceId: validRegistrant.conferenceId,
                googleAccountEmail: tokenData.email,
                tokenData: token.tokens,
            },
        });

        return {
            success: true,
        };
    } catch (e) {
        console.error("Failed to exchange authorisation code for token", e);
        return {
            success: false,
            message: "Failed to exchange authorisation code for token",
        };
    }
}

gql`
    mutation CreateYouTubeUpload(
        $elementId: uuid!
        $videoId: String!
        $videoTitle: String!
        $videoStatus: String!
        $uploadYouTubeVideoJobId: uuid!
        $conferenceId: uuid!
        $videoPrivacyStatus: String!
    ) {
        insert_video_YouTubeUpload_one(
            object: {
                elementId: $elementId
                videoId: $videoId
                videoStatus: $videoStatus
                videoTitle: $videoTitle
                videoPrivacyStatus: $videoPrivacyStatus
                uploadYouTubeVideoJobId: $uploadYouTubeVideoJobId
                conferenceId: $conferenceId
            }
        ) {
            id
        }
    }
`;

async function startUploadYouTubeVideoJob(job: UploadYouTubeVideoJobDataFragment): Promise<void> {
    try {
        const elementDataBlob = assertType<ElementDataBlob>(job.element.data);

        const latestVersion = R.last(elementDataBlob);

        assert(latestVersion, "Could not find any versions of content item");
        assert(latestVersion.data.baseType === ElementBaseType.Video, "Cannot upload non-video content to YouTube");

        const { bucket, key } = new AmazonS3Uri(latestVersion.data.transcode?.s3Url ?? latestVersion.data.s3Url);
        assert(bucket && key, `Could not parse S3 URI of video item: ${latestVersion.data.s3Url}`);
        const object = await S3.getObject({
            Bucket: bucket,
            Key: key,
        });

        assertType<Credentials>(job.registrantGoogleAccount.tokenData);

        const client = createOAuth2Client();
        client.setCredentials(job.registrantGoogleAccount.tokenData);

        let bytesRead = 0;
        const totalBytes = object.ContentLength ?? 0;
        const youtubeClient = google.youtube({
            auth: client,
            version: "v3",
            onUploadProgress: (event: { bytesRead: number }) => {
                const previousPercentage = Math.floor((bytesRead / totalBytes) * 100);
                const newPercentage = Math.floor((event.bytesRead / totalBytes) * 100);
                if (previousPercentage < newPercentage && newPercentage % 10 === 0) {
                    console.log(`YouTube upload: ${newPercentage}%`, job.id);
                }
                bytesRead = event.bytesRead;
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        youtubeClient.videos
            .insert({
                media: {
                    mimeType: object.ContentType,
                    body: object.Body,
                },
                part: ["snippet", "id", "status", "contentDetails"],
                requestBody: {
                    status: {
                        privacyStatus: job.videoPrivacyStatus,
                    },
                    snippet: {
                        title: job.videoTitle,
                        description: job.videoDescription,
                    },
                },
            })
            .catch(async (error) => {
                console.error("YouTube upload failed", job.id, error);
                try {
                    await callWithRetry(async () => {
                        await apolloClient.mutate({
                            mutation: FailUploadYouTubeVideoJobDocument,
                            variables: {
                                id: job.id,
                                message: JSON.stringify(error),
                            },
                        });
                    });
                } catch (e) {
                    console.error("Failure while recording failure of YouTube upload job", e);
                }
            })
            .then(async (result) => {
                try {
                    if (!result || !result.data.id || !result.data.snippet || !result.data.status) {
                        console.error("Missing data from YouTube API on completion of video upload", job.id, result);
                        await callWithRetry(async () => {
                            await apolloClient.mutate({
                                mutation: FailUploadYouTubeVideoJobDocument,
                                variables: {
                                    id: job.id,
                                    message: "No data returned from YouTube API",
                                },
                            });
                        });
                        return;
                    }

                    console.log("Finished uploading YouTube video", job.id, result.data);

                    await callWithRetry(async () => {
                        await apolloClient.mutate({
                            mutation: CompleteUploadYouTubeVideoJobDocument,
                            variables: {
                                id: job.id,
                            },
                        });
                    });
                    await callWithRetry(async () => {
                        assert(result.data.id);
                        assert(result.data.snippet);
                        assert(result.data.status);
                        await apolloClient.mutate({
                            mutation: CreateYouTubeUploadDocument,
                            variables: {
                                elementId: job.element.id,
                                videoId: result.data.id,
                                videoStatus: result.data.status.uploadStatus,
                                videoTitle: result.data.snippet.title,
                                videoPrivacyStatus: result.data.status.privacyStatus,
                                uploadYouTubeVideoJobId: job.id,
                                conferenceId: job.conferenceId,
                            },
                        });
                    });

                    if (job.playlistId) {
                        console.log("Adding YouTube video to playlist", job.id);
                        await youtubeClient.playlistItems.insert({
                            part: ["id", "snippet"],
                            requestBody: {
                                snippet: {
                                    playlistId: job.playlistId,
                                    resourceId: {
                                        videoId: result.data.id,
                                        kind: "youtube#video",
                                    },
                                },
                            },
                        });
                    }

                    if (
                        latestVersion.data.baseType === ElementBaseType.Video &&
                        latestVersion.data.subtitles["en_US"]
                    ) {
                        console.log("Starting YouTube caption upload", job.id);
                        const { bucket: subtitlesBucket, key: subtitlesKey } = new AmazonS3Uri(
                            latestVersion.data.subtitles["en_US"].s3Url
                        );
                        assert(
                            subtitlesBucket && subtitlesKey,
                            `Could not parse S3 URI of video item: ${latestVersion.data.subtitles["en_US"].s3Url}`
                        );
                        const subtitlesObject = await S3.getObject({
                            Bucket: subtitlesBucket,
                            Key: subtitlesKey,
                        });

                        await youtubeClient.captions.insert({
                            media: {
                                mimeType: "*/*",
                                body: subtitlesObject.Body,
                            },
                            part: ["snippet", "id"],
                            requestBody: {
                                snippet: {
                                    videoId: result.data.id,
                                    language: "en-US",
                                    name: "English",
                                },
                            },
                        });
                        console.log("Finished uploading YouTube caption", job.id);
                    } else {
                        console.log("No YouTube captions to upload", job.id);
                    }
                } catch (e) {
                    console.error("Failure while recording completion of YouTube upload", job.id, e);
                    try {
                        await callWithRetry(async () => {
                            await apolloClient.mutate({
                                mutation: FailUploadYouTubeVideoJobDocument,
                                variables: {
                                    id: job.id,
                                    message: `Failure while recording completion of YouTube upload: ${e}`,
                                },
                            });
                        });
                    } catch (e) {
                        console.error("Failure while recording failure to complete YouTube upload", e);
                    }
                }
            });
    } catch (e) {
        console.error("Failure starting UploadYouTubeVideoJob", job.id, e);
        throw new Error("Failure starting job");
    }
}

gql`
    query SelectNewUploadYouTubeVideoJobs {
        job_queues_UploadYouTubeVideoJob(
            limit: 2
            where: { jobStatusName: { _eq: NEW } }
            order_by: { createdAt: asc }
        ) {
            id
        }
    }

    mutation MarkAndSelectNewUploadYouTubeVideoJobs($ids: [uuid!]!) {
        update_job_queues_UploadYouTubeVideoJob(
            where: { id: { _in: $ids }, jobStatusName: { _eq: NEW } }
            _set: { jobStatusName: IN_PROGRESS }
            _inc: { retriesCount: 1 }
        ) {
            returning {
                ...UploadYouTubeVideoJobData
            }
        }
    }

    fragment UploadYouTubeVideoJobData on job_queues_UploadYouTubeVideoJob {
        id
        conferenceId
        jobStatusName
        retriesCount
        registrantGoogleAccount {
            id
            tokenData
            googleAccountEmail
        }
        element {
            data
            id
            item {
                id
                title
            }
        }
        videoTitle
        videoDescription
        videoPrivacyStatus
        playlistId
    }

    mutation UnmarkUploadYouTubeVideoJobs($ids: [uuid!]!) {
        update_job_queues_UploadYouTubeVideoJob(where: { id: { _in: $ids } }, _set: { jobStatusName: FAILED }) {
            affected_rows
            returning {
                id
            }
        }
    }

    mutation FailUploadYouTubeVideoJob($id: uuid!, $message: String!) {
        update_job_queues_UploadYouTubeVideoJob_by_pk(
            pk_columns: { id: $id }
            _set: { message: $message, jobStatusName: FAILED }
        ) {
            id
        }
    }

    mutation CompleteUploadYouTubeVideoJob($id: uuid!) {
        update_job_queues_UploadYouTubeVideoJob_by_pk(pk_columns: { id: $id }, _set: { jobStatusName: COMPLETED }) {
            id
        }
    }
`;

export async function handleUploadYouTubeVideoJobQueue(): Promise<void> {
    console.log("Processing UploadYouTubeVideoJob queue");

    const newJobs = await apolloClient.query({
        query: SelectNewUploadYouTubeVideoJobsDocument,
    });
    const jobs = await apolloClient.mutate({
        mutation: MarkAndSelectNewUploadYouTubeVideoJobsDocument,
        variables: {
            ids: newJobs.data.job_queues_UploadYouTubeVideoJob.map((x) => x.id),
        },
    });
    assert(jobs.data?.update_job_queues_UploadYouTubeVideoJob, "Failed to fetch new UploadYouTubeVideoJobs");

    const snooze = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const unsuccesssfulJobs: (string | undefined)[] = await Promise.all(
        jobs.data.update_job_queues_UploadYouTubeVideoJob.returning.map(async (job) => {
            try {
                if (job.retriesCount < 3) {
                    await snooze(Math.floor(Math.random() * 5 * 1000));
                    await callWithRetry(async () => {
                        await startUploadYouTubeVideoJob(job);
                    });
                }
            } catch (e) {
                console.error("Could not start UploadYouTubeVideoJob", job.id, e);
                return job.id;
            }
            return undefined;
        })
    );

    try {
        await callWithRetry(async () => {
            await apolloClient.mutate({
                mutation: UnmarkUploadYouTubeVideoJobsDocument,
                variables: {
                    ids: unsuccesssfulJobs.filter((x) => !!x),
                },
            });
        });
    } catch (e) {
        console.error("Could not record failed UploadYouTubeVideoJobs", e);
    }
}
