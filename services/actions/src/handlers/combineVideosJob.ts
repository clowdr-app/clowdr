import { gql } from "@apollo/client/core";
import {
    AudioSelectorType,
    CaptionDestinationType,
    CaptionSourceType,
    ContainerType,
    EmbeddedConvert608To708,
    Input,
    LanguageCode,
    OutputGroupType,
} from "@aws-sdk/client-mediaconvert";
import {
    AWSJobStatus,
    Content_ElementType_Enum,
    ElementBaseType,
    ElementDataBlob,
} from "@clowdr-app/shared-types/build/content";
import { TranscodeMode } from "@clowdr-app/shared-types/build/sns/mediaconvert";
import { CombineVideosJobDataBlob } from "@clowdr-app/shared-types/src/combineVideosJob";
import assert from "assert";
import * as R from "ramda";
import { assertType } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import {
    CombineVideosJob_CompleteJobDocument,
    CombineVideosJob_CreateElementDocument,
    CombineVideosJob_FailJobDocument,
    CombineVideosJob_GetElementsDocument,
    CombineVideosJob_GetJobsDocument,
    CombineVideosJob_StartJobDocument,
    MediaConvert_GetCombineVideosJobDocument,
    Video_JobStatus_Enum,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { MediaConvert } from "../lib/aws/awsClient";
import { audioDescription, videoDescription } from "../lib/transcode";
import { callWithRetry } from "../utils";

gql`
    query CombineVideosJob_GetJobs {
        job_queues_CombineVideosJob(
            where: { jobStatusName: { _in: [NEW, IN_PROGRESS] } }
            order_by: { created_at: asc }
            limit: 10
        ) {
            id
            created_at
            conferenceId
            data
            jobStatusName
        }
    }

    query CombineVideosJob_GetElements($conferenceId: uuid!, $elementIds: [uuid!]!) {
        content_Element(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $elementIds } }) {
            id
            data
            itemId
        }
    }
`;

export async function processCombineVideosJobQueue(): Promise<void> {
    const jobsResponse = await apolloClient.query({
        query: CombineVideosJob_GetJobsDocument,
    });

    jobsResponse.data.job_queues_CombineVideosJob.forEach(async (row) => {
        if (row.jobStatusName !== Video_JobStatus_Enum.New) {
            if (Date.now() - Date.parse(row.created_at) > 6 * 60 * 60 * 1000) {
                console.error(
                    "Error: CombineVideosJob timed out after 6 hours (failing the job to avoid queue starvation)"
                );
                await failCombineVideosJob(row.id, "Timed out after 6 hours");
            }
            return;
        }

        try {
            assertType<CombineVideosJobDataBlob>(row.data);
            const data: CombineVideosJobDataBlob = row.data;

            const result = await apolloClient.query({
                query: CombineVideosJob_GetElementsDocument,
                variables: {
                    conferenceId: row.conferenceId,
                    elementIds: data.inputElements.map((item) => item.elementId),
                },
            });

            const itemIds = R.uniq(result.data.content_Element.map((item) => item.itemId));

            if (itemIds.length > 1 || itemIds.length === 0) {
                console.error("Can only combine content items from exactly one content group", row.id, itemIds);
                throw new Error("Can only combine content items from exactly one content group");
            }

            const inputs = R.sortBy(
                (x) => data.inputElements.findIndex((y) => y.elementId === x.id),
                result.data.content_Element
            )
                .sort((a, b) => {
                    const aIndex = data.inputElements.findIndex((x) => x.elementId === a.id);
                    const bIndex = data.inputElements.findIndex((x) => x.elementId === b.id);
                    return aIndex - bIndex;
                })
                .map((item) => {
                    const blob = assertType<ElementDataBlob>(item.data);

                    const latestVersion = R.last(blob);

                    if (!latestVersion) {
                        throw new Error(`Missing latest version of content item ${item.id}`);
                    }

                    if (latestVersion.data.baseType !== ElementBaseType.Video) {
                        throw new Error(`Content item ${item.id} is not a video`);
                    }

                    const input: Input = {
                        FileInput:
                            latestVersion.data.broadcastTranscode?.s3Url ??
                            latestVersion.data.transcode?.s3Url ??
                            latestVersion.data.s3Url,
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
                    combineVideosJobId: row.id,
                    itemId: itemIds[0],
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
                                {
                                    ContainerSettings: {
                                        Container: ContainerType.RAW,
                                    },
                                    CaptionDescriptions: [
                                        {
                                            CaptionSelectorName: "Caption Selector 1",
                                            DestinationSettings: {
                                                DestinationType: CaptionDestinationType.SRT,
                                            },
                                            LanguageCode: LanguageCode.ENG,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });

            assert(
                mediaConvertJobResult.Job?.Id && mediaConvertJobResult.Job.CreatedAt,
                `Failed to create MediaConvert job for CombineVideosJob, ${row.id}`
            );

            await startCombineVideosJob(row.id, mediaConvertJobResult.Job.Id);

            console.log("Started CombineVideosJob MediaConvert job", row.id, mediaConvertJobResult.Job.Id);
        } catch (e) {
            console.error("Error while handling process CombineVideosJob", e);
            await failCombineVideosJob(row.id, e.message);
        }
    });
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
    await callWithRetry(
        async () =>
            await apolloClient.mutate({
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
            outputName
        }
    }

    mutation CombineVideosJob_CreateElement($data: jsonb!, $name: String!, $itemId: uuid!, $conferenceId: uuid!) {
        insert_content_Element_one(
            object: {
                data: $data
                isHidden: true
                name: $name
                typeName: VIDEO_FILE
                itemId: $itemId
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
    subtitleS3Url: string,
    itemId: string
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

        const now = Date.now();

        const data: ElementDataBlob = [
            {
                createdAt: now,
                createdBy: "system",
                data: {
                    baseType: ElementBaseType.Video,
                    s3Url: transcodeS3Url,
                    transcode: {
                        jobId: combineVideosJobId,
                        status: AWSJobStatus.Completed,
                        updatedTimestamp: now,
                        s3Url: transcodeS3Url,
                    },
                    subtitles: {
                        en_US: {
                            s3Url: subtitleS3Url,
                            status: AWSJobStatus.Completed,
                            message: "Generate while combining videos.",
                        },
                    },
                    type: Content_ElementType_Enum.VideoFile,
                    broadcastTranscode: {
                        updatedTimestamp: now,
                        s3Url: transcodeS3Url,
                    },
                },
            },
        ];

        await callWithRetry(
            async () =>
                await apolloClient.mutate({
                    mutation: CombineVideosJob_CreateElementDocument,
                    variables: {
                        conferenceId: combineVideosJobResult.data.job_queues_CombineVideosJob_by_pk?.conferenceId,
                        itemId,
                        data,
                        name:
                            combineVideosJobResult.data.job_queues_CombineVideosJob_by_pk?.outputName ??
                            "Combined video",
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
        await failCombineVideosJob(combineVideosJobId, e.message);
    }
}
