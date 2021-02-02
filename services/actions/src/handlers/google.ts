import { gql } from "@apollo/client/core";
import { ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import { Credentials } from "google-auth-library";
import { google } from "googleapis";
import jwt_decode from "jwt-decode";
import * as R from "ramda";
import stream from "stream";
import { assertType } from "typescript-is";
import {
    CompleteUploadYouTubeVideoJobDocument,
    FailUploadYouTubeVideoJobDocument,
    Google_CreateAttendeeGoogleAccountDocument,
    MarkAndSelectNewUploadYouTubeVideoJobsDocument,
    SelectNewUploadYouTubeVideoJobsDocument,
    UnmarkUploadYouTubeVideoJobsDocument,
    UploadYouTubeVideoJobDataFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { attendeeBelongsToUser, getAttendeeByConferenceSlug } from "../lib/authorisation";
import { S3 } from "../lib/aws/awsClient";
import { createOAuth2Client, GoogleIdToken } from "../lib/googleAuth";
import { callWithRetry } from "../utils";

assert(process.env.FRONTEND_DOMAIN, "FRONTEND_DOMAIN environment variable not provided.");
process.env.FRONTEND_PROTOCOL =
    process.env.FRONTEND_PROTOCOL || (process.env.FRONTEND_DOMAIN.startsWith("localhost") ? "http" : "https");

export async function handleGetGoogleOAuthUrl(
    params: getGoogleOAuthUrlArgs,
    userId: string,
    conferenceSlug: string
): Promise<GetGoogleOAuthUrlOutput> {
    const attendee = await getAttendeeByConferenceSlug(userId, conferenceSlug);

    const oauth2Client = createOAuth2Client();

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [...params.scopes, "openid email"],
        include_granted_scopes: true,
        state: attendee.id,
        prompt: "consent",
        redirect_uri: `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/googleoauth`,
    });

    return {
        url,
    };
}

gql`
    mutation Google_CreateAttendeeGoogleAccount(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $googleAccountEmail: String!
        $tokenData: jsonb!
    ) {
        insert_AttendeeGoogleAccount_one(
            object: {
                attendeeId: $attendeeId
                conferenceId: $conferenceId
                googleAccountEmail: $googleAccountEmail
                tokenData: $tokenData
            }
            on_conflict: {
                constraint: AttendeeGoogleAccount_attendeeId_googleAccountEmail_key
                update_columns: tokenData
            }
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
        const validAttendee = await attendeeBelongsToUser(params.state, userId);
        assert(validAttendee, "Attendee does not belong to the user");

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
        oauth2Client.verifyIdToken({
            idToken: token.tokens.id_token,
            audience: oauth2Client._clientId,
        });

        const tokenData = jwt_decode<GoogleIdToken>(token.tokens.id_token);

        console.log("Saving Google OAuth tokens", userId, params.state);
        await apolloClient.mutate({
            mutation: Google_CreateAttendeeGoogleAccountDocument,
            variables: {
                attendeeId: params.state,
                conferenceId: validAttendee.conferenceId,
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

async function startUploadYouTubeVideoJob(job: UploadYouTubeVideoJobDataFragment): Promise<void> {
    try {
        const contentItemDataBlob = assertType<ContentItemDataBlob>(job.contentItem.data);

        const latestVersion = R.last(contentItemDataBlob);

        assert(latestVersion, "Could not find any versions of content item");
        assert(latestVersion.data.baseType === ContentBaseType.Video, "Cannot upload non-video content to YouTube");

        // TODO: use broadcast version if available? Or somehow upload subtitles.
        const { bucket, key } = new AmazonS3Uri(latestVersion.data.s3Url);
        assert(bucket && key, `Could not parse S3 URI of video item: ${latestVersion.data.s3Url}`);
        const object = await S3.getObject({
            Bucket: bucket,
            Key: key,
        });

        if (object.Body instanceof stream.Readable) {
            console.log("stream.Readable");
        } else if (object.Body instanceof ReadableStream) {
            console.log("ReadableStream");
        } else if (object.Body instanceof Blob) {
            console.log("Blob");
        } else {
            throw new Error("Could not parse S3 object");
        }

        assertType<Credentials>(job.attendeeGoogleAccount.tokenData);

        const client = createOAuth2Client();
        client.setCredentials(job.attendeeGoogleAccount.tokenData);

        const youtubeClient = google.youtube({
            auth: client,
            version: "v3",
            onUploadProgress: (event) => {
                if (event.bytesRead % 1000 === 0) {
                    console.log("YouTube upload progress", event.bytesRead, job.id);
                }
            },
        });

        youtubeClient.videos
            .insert({
                media: {
                    mimeType: object.ContentType,
                    body: object.Body,
                },
                part: ["snippet", "id"],
                requestBody: {
                    snippet: {
                        title: job.contentItem.contentGroup.title,
                    },
                },
            })
            .catch(async (error) => {
                console.error("YouTube upload failed", job.id, error);
                await callWithRetry(async () => {
                    await apolloClient.mutate({
                        mutation: FailUploadYouTubeVideoJobDocument,
                        variables: {
                            id: job.id,
                            message: JSON.stringify(error),
                        },
                    });
                });
            })
            .then(async (result) => {
                console.log("Finished uploading YouTube video", job.id, result);
                await callWithRetry(async () => {
                    await apolloClient.mutate({
                        mutation: CompleteUploadYouTubeVideoJobDocument,
                        variables: {
                            id: job.id,
                        },
                    });
                });
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
        jobStatusName
        retriesCount
        attendeeGoogleAccount {
            id
            tokenData
            googleAccountEmail
        }
        contentItem {
            data
            id
            contentGroup {
                id
                title
            }
        }
    }

    mutation UnmarkUploadYouTubeVideoJobs($ids: [uuid!]!) {
        update_job_queues_UploadYouTubeVideoJob(where: { id: { _in: $ids } }, _set: { jobStatusName: FAILED }) {
            affected_rows
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
