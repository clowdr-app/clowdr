import { gql } from "@apollo/client/core";
import {
    AudioSelectorType,
    CaptionSourceType,
    ContainerType,
    EmbeddedConvert608To708,
    Input,
    OutputGroupType,
} from "@aws-sdk/client-mediaconvert";
import { ContentBaseType, ContentItemDataBlob, ContentType_Enum } from "@clowdr-app/shared-types/build/content";
import { TranscodeMode } from "@clowdr-app/shared-types/build/sns/mediaconvert";
import assert from "assert";
import * as R from "ramda";
import { assertType } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import {
    CombineVideosJob_CompleteJobDocument,
    CombineVideosJob_CreateContentItemDocument,
    CombineVideosJob_FailJobDocument,
    CombineVideosJob_GetContentItemsDocument,
    CombineVideosJob_StartJobDocument,
    JobStatus_Enum,
    MediaConvert_GetCombineVideosJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { MediaConvert } from "../lib/aws/awsClient";
import { audioDescription, videoDescription } from "../lib/transcode";
import { CombineVideosJobData, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";

gql`
    query CombineVideosJob_GetContentItems($conferenceId: uuid!, $contentItemIds: [uuid!]!) {
        ContentItem(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $contentItemIds } }) {
            id
            data
            contentGroupId
        }
    }
`;

export async function handleCombineVideosJobInserted(payload: Payload<CombineVideosJobData>): Promise<void> {
    assert(payload.event.data.new, "Payload must contain new row data");
    const newRow = payload.event.data.new;

    if (newRow.jobStatusName !== JobStatus_Enum.New) {
        return;
    }

    try {
        const result = await apolloClient.query({
            query: CombineVideosJob_GetContentItemsDocument,
            variables: {
                conferenceId: newRow.conferenceId,
                contentItemIds: newRow.data.inputContentItems.map((item) => item.contentItemId),
            },
        });

        const contentGroupIds = R.uniq(result.data.ContentItem.map((item) => item.contentGroupId));

        if (contentGroupIds.length > 1 || contentGroupIds.length === 0) {
            console.error("Can only combine content items from exactly one content group", newRow.id, contentGroupIds);
            throw new Error("Can only combine content items from exactly one content group");
        }

        const inputs = result.data.ContentItem.map((item) => {
            const blob = assertType<ContentItemDataBlob>(item.data);

            const latestVersion = R.last(blob);

            if (!latestVersion) {
                throw new Error(`Missing latest version of content item ${item.id}`);
            }

            if (latestVersion.data.baseType !== ContentBaseType.Video) {
                throw new Error(`Content item ${item.id} is not a video`);
            }

            const input: Input = {
                FileInput: latestVersion.data.broadcastTranscode?.s3Url ?? latestVersion.data.s3Url,
                AudioSelectors: {
                    "Audio Selector 1": {
                        SelectorType: AudioSelectorType.TRACK,
                    },
                },
                CaptionSelectors: {
                    "Caption Selector 1": {
                        SourceSettings: {
                            EmbeddedSourceSettings: {
                                Convert608To708: EmbeddedConvert608To708.UPCONVERT,
                            },
                            SourceType: CaptionSourceType.EMBEDDED,
                        },
                    },
                },
            };

            return input;
        });

        const destinationKey = uuidv4();

        assert(MediaConvert, "AWS MediaConvert client is not initialised");
        const mediaConvertJobResult = await MediaConvert.createJob({
            Role: process.env.AWS_MEDIACONVERT_SERVICE_ROLE_ARN,
            UserMetadata: {
                mode: TranscodeMode.COMBINE,
                combineVideosJobId: newRow.id,
                contentGroupId: contentGroupIds[0],
                environment: process.env.AWS_PREFIX ?? "unknown",
            },
            Settings: {
                Inputs: inputs,
                OutputGroups: [
                    {
                        CustomName: "File Group",
                        OutputGroupSettings: {
                            FileGroupSettings: {
                                Destination: `s3://${process.env.AWS_CONTENT_BUCKET_ID}/${destinationKey}`,
                            },
                            Type: OutputGroupType.FILE_GROUP_SETTINGS,
                        },
                        Outputs: [
                            {
                                ContainerSettings: {
                                    Mp4Settings: {},
                                    Container: ContainerType.MP4,
                                },
                                AudioDescriptions: [audioDescription],
                                VideoDescription: videoDescription,
                            },
                        ],
                    },
                ],
            },
        });

        assert(
            mediaConvertJobResult.Job?.Id && mediaConvertJobResult.Job.CreatedAt,
            `Failed to create MediaConvert job for CombineVideosJob, ${newRow.id}`
        );

        startCombineVideosJob(newRow.id, mediaConvertJobResult.Job.Id);

        console.log("Started CombineVideosJob MediaConvert job", newRow.id, mediaConvertJobResult.Job.Id);
    } catch (e) {
        console.error("Error while handling CombineVideosJob inserted", e);
        await failCombineVideosJob(newRow.id, e.message);
    }
}

gql`
    mutation CombineVideosJob_FailJob($combineVideosJobId: uuid!, $message: String!) {
        update_job_queues_CombineVideosJob(
            where: { id: { _eq: $combineVideosJobId } }
            _set: { jobStatusName: FAILED, message: $message }
        ) {
            affected_rows
        }
    }
`;

export async function failCombineVideosJob(combineVideosJobId: string, message: string): Promise<void> {
    console.log("Recording CombineVideosJob as failed", combineVideosJobId, message);
    await callWithRetry(async () =>
        apolloClient.mutate({
            mutation: CombineVideosJob_FailJobDocument,
            variables: {
                combineVideosJobId,
                message,
            },
        })
    );
}

gql`
    mutation CombineVideosJob_StartJob($combineVideosJobId: uuid!, $mediaConvertJobId: String!) {
        update_job_queues_CombineVideosJob(
            where: { id: { _eq: $combineVideosJobId } }
            _set: { jobStatusName: IN_PROGRESS, mediaConvertJobId: $mediaConvertJobId }
        ) {
            affected_rows
        }
    }
`;

async function startCombineVideosJob(combineVideosJobId: string, mediaConvertJobId: string) {
    console.log("Recording CombineVideosJob as started", combineVideosJobId, mediaConvertJobId);
    await callWithRetry(
        async () =>
            await apolloClient.mutate({
                mutation: CombineVideosJob_StartJobDocument,
                variables: {
                    combineVideosJobId,
                    mediaConvertJobId,
                },
            })
    );
}

gql`
    mutation CombineVideosJob_CompleteJob($combineVideosJobId: uuid!) {
        update_job_queues_CombineVideosJob(
            where: { id: { _eq: $combineVideosJobId } }
            _set: { jobStatusName: COMPLETED }
        ) {
            affected_rows
        }
    }

    query MediaConvert_GetCombineVideosJob($combineVideosJobId: uuid!) {
        job_queues_CombineVideosJob_by_pk(id: $combineVideosJobId) {
            id
            conferenceId
        }
    }

    mutation CombineVideosJob_CreateContentItem(
        $data: jsonb!
        $name: String!
        $contentGroupId: uuid!
        $conferenceId: uuid!
    ) {
        insert_ContentItem_one(
            object: {
                data: $data
                isHidden: true
                name: $name
                contentTypeName: VIDEO_FILE
                contentGroupId: $contentGroupId
                conferenceId: $conferenceId
            }
        ) {
            id
        }
    }
`;

export async function completeCombineVideosJob(
    combineVideosJobId: string,
    transcodeS3Url: string,
    contentGroupId: string
): Promise<void> {
    console.log("Recording CombineVideosJob as completed", combineVideosJobId);

    try {
        const combineVideosJobResult = await callWithRetry(
            async () =>
                await apolloClient.query({
                    query: MediaConvert_GetCombineVideosJobDocument,
                    variables: {
                        combineVideosJobId,
                    },
                })
        );

        if (!combineVideosJobResult.data.job_queues_CombineVideosJob_by_pk) {
            console.error("Could not find related CombineVideosJob", combineVideosJobId);
            throw new Error("Could not find related CombineVideosJob");
        }

        const data: ContentItemDataBlob = [
            {
                createdAt: Date.now(),
                createdBy: "system",
                data: {
                    baseType: ContentBaseType.Video,
                    s3Url: transcodeS3Url,
                    sourceHasEmbeddedSubtitles: true,
                    subtitles: {},
                    type: ContentType_Enum.VideoFile,
                    broadcastTranscode: {
                        updatedTimestamp: Date.now(),
                        s3Url: transcodeS3Url,
                    },
                },
            },
        ];

        await callWithRetry(
            async () =>
                await apolloClient.mutate({
                    mutation: CombineVideosJob_CreateContentItemDocument,
                    variables: {
                        conferenceId: combineVideosJobResult.data.job_queues_CombineVideosJob_by_pk?.conferenceId,
                        contentGroupId,
                        data,
                        name: "Combined video",
                    },
                })
        );

        await callWithRetry(
            async () =>
                await apolloClient.mutate({
                    mutation: CombineVideosJob_CompleteJobDocument,
                    variables: {
                        combineVideosJobId,
                    },
                })
        );
    } catch (e) {
        failCombineVideosJob(combineVideosJobId, e.message);
    }
}
