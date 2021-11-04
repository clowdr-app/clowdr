import { gql } from "@apollo/client/core";
import type {
    getGoogleOAuthUrlArgs,
    GetGoogleOAuthUrlOutput,
    submitGoogleOAuthCodeArgs,
    SubmitGoogleOAuthCodeOutput,
} from "@midspace/hasura/actionTypes";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { ElementBaseType } from "@midspace/shared-types/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import type { Credentials } from "google-auth-library";
import { google } from "googleapis";
import jwt_decode from "jwt-decode";
import type { P } from "pino";
import * as R from "ramda";
import { assertType } from "typescript-is";
import type { UploadYouTubeVideoJobDataFragment } from "../generated/graphql";
import {
    CompleteUploadYouTubeVideoJobDocument,
    CreateYouTubeUploadDocument,
    FailUploadYouTubeVideoJobDocument,
    GoogleOAuth_ConferenceConfig_FrontendHostDocument,
    Google_CreateRegistrantGoogleAccountDocument,
    MarkAndSelectNewUploadYouTubeVideoJobsDocument,
    SelectNewUploadYouTubeVideoJobsDocument,
    UnmarkUploadYouTubeVideoJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { registrantBelongsToUser } from "../lib/authorisation";
import { S3 } from "../lib/aws/awsClient";
import type { GoogleIdToken } from "../lib/googleAuth";
import { createOAuth2Client } from "../lib/googleAuth";
import { callWithRetry } from "../utils";
import { handleRefreshYouTubeData } from "./registrantGoogleAccount";

gql`
    query GoogleOAuth_ConferenceConfig_FrontendHost($registrantId: uuid!) {
        registrant: registrant_Registrant_by_pk(id: $registrantId) {
            conference {
                frontendHost: configurations(where: { key: { _eq: FRONTEND_HOST } }) {
                    value
                }
            }
        }

        defaultFrontendHost: system_Configuration_by_pk(key: DEFAULT_FRONTEND_HOST) {
            key
            value
        }
    }
`;

export async function handleGetGoogleOAuthUrl(params: getGoogleOAuthUrlArgs): Promise<GetGoogleOAuthUrlOutput> {
    const configResponse = await apolloClient.query({
        query: GoogleOAuth_ConferenceConfig_FrontendHostDocument,
        variables: {
            registrantId: params.registrantId,
        },
    });
    const frontendHost = configResponse.data.registrant?.conference.frontendHost?.length
        ? configResponse.data.registrant?.conference.frontendHost[0].value
        : configResponse.data.defaultFrontendHost?.value;
    if (!frontendHost) {
        throw new Error("Frontend host not configured!");
    }

    const oauth2Client = createOAuth2Client();

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [...params.scopes, "openid email"],
        include_granted_scopes: true,
        state: params.registrantId,
        prompt: "select_account",
        redirect_uri: `${frontendHost}/googleoauth`,
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
    logger: P.Logger,
    params: submitGoogleOAuthCodeArgs,
    userId: string
): Promise<SubmitGoogleOAuthCodeOutput> {
    try {
        assert(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID environment variable not provided");

        logger.info("Retrieving Google auth token", { userId, registrantId: params.state });
        const validRegistrant = await registrantBelongsToUser(params.state, userId);
        assert(validRegistrant, "Registrant does not belong to the user");

        const configResponse = await apolloClient.query({
            query: GoogleOAuth_ConferenceConfig_FrontendHostDocument,
            variables: {
                registrantId: validRegistrant.id,
            },
        });
        const frontendHost = configResponse.data.registrant?.conference.frontendHost?.length
            ? configResponse.data.registrant?.conference.frontendHost[0].value
            : configResponse.data.defaultFrontendHost?.value;
        if (!frontendHost) {
            throw new Error("Frontend host not configured!");
        }

        const oauth2Client = createOAuth2Client();

        const token = await oauth2Client.getToken({
            code: params.code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: `${frontendHost}/googleoauth`,
        });

        if (!token.tokens.id_token) {
            logger.error("Failed to retrieve id_token", { userId });
            throw new Error("Failed to retrieve id_token");
        }

        logger.info("Retrieved Google auth token", { userId });

        logger.info("Verifying Google JWT", { userId, registrantId: params.state });
        await oauth2Client.verifyIdToken({
            idToken: token.tokens.id_token,
            audience: oauth2Client._clientId,
        });

        const tokenData = jwt_decode<GoogleIdToken>(token.tokens.id_token);

        logger.info("Saving Google OAuth tokens", { userId, registrantId: params.state });
        const result = await apolloClient.mutate({
            mutation: Google_CreateRegistrantGoogleAccountDocument,
            variables: {
                registrantId: params.state,
                conferenceId: validRegistrant.conferenceId,
                googleAccountEmail: tokenData.email,
                tokenData: token.tokens,
            },
        });

        if (result.data?.insert_registrant_GoogleAccount_one?.id) {
            try {
                await handleRefreshYouTubeData(logger, {
                    registrantGoogleAccountId: result.data.insert_registrant_GoogleAccount_one.id,
                    registrantId: params.state,
                });
            } catch (err) {
                logger.error("Failed to refresh data from YouTube account", {
                    registrantGoogleAccountId: result.data.insert_registrant_GoogleAccount_one.id,
                    registrantId: params.state,
                    err,
                });
            }
        }

        return {
            success: true,
        };
    } catch (err) {
        logger.error("Failed to exchange authorisation code for token", { err, userId, registrantId: params.state });
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
        $subconferenceId: uuid!
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
                subconferenceId: $subconferenceId
            }
        ) {
            id
        }
    }
`;

async function startUploadYouTubeVideoJob(logger: P.Logger, job: UploadYouTubeVideoJobDataFragment): Promise<void> {
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
                    logger.info(`YouTube upload: ${newPercentage}%`, job.id);
                }
                bytesRead = event.bytesRead;
            },
        });

        const clowdrTagline = "\n\nCreated with Midspace: https://midspace.app/";
        const description =
            job.videoDescription.length > 5000 - clowdrTagline.length
                ? `${job.videoDescription.substring(0, 5000 - clowdrTagline.length)}${clowdrTagline}`
                : `${job.videoDescription}${clowdrTagline}`;
        const title = job.videoTitle.length > 100 ? job.videoTitle.substring(0, 100) : job.videoTitle;

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
                        title,
                        description,
                    },
                },
            })
            .catch(async (error) => {
                logger.error("YouTube upload failed", job.id, error);
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
                } catch (e: any) {
                    logger.error("Failure while recording failure of YouTube upload job", e);
                }
            })
            .then(async (result) => {
                try {
                    if (!result || !result.data.id || !result.data.snippet || !result.data.status) {
                        logger.error("Missing data from YouTube API on completion of video upload", job.id, result);
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

                    logger.info("Finished uploading YouTube video", job.id, result.data);

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
                        assert(result.data.snippet?.title);
                        assert(result.data.status);
                        assert(result.data.status?.uploadStatus);
                        assert(result.data.status?.privacyStatus);
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
                                subconferenceId: job.subconferenceId,
                            },
                        });
                    });

                    if (job.playlistId) {
                        logger.info("Adding YouTube video to playlist", job.id);
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
                        logger.info("Starting YouTube caption upload", job.id);
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
                        logger.info("Finished uploading YouTube caption", job.id);
                    } else {
                        logger.info("No YouTube captions to upload", job.id);
                    }
                } catch (e: any) {
                    logger.error("Failure while recording completion of YouTube upload", job.id, e);
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
                    } catch (e: any) {
                        logger.error("Failure while recording failure to complete YouTube upload", e);
                    }
                }
            });
    } catch (e: any) {
        logger.error("Failure starting UploadYouTubeVideoJob", job.id, e);
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
        subconferenceId
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

export async function handleUploadYouTubeVideoJobQueue(logger: P.Logger): Promise<void> {
    logger.info("Processing UploadYouTubeVideoJob queue");

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
                        await startUploadYouTubeVideoJob(logger, job);
                    });
                }
            } catch (e: any) {
                logger.error("Could not start UploadYouTubeVideoJob", job.id, e);
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
    } catch (e: any) {
        logger.error("Could not record failed UploadYouTubeVideoJobs", e);
    }
}
