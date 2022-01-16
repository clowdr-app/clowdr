import { gql } from "@apollo/client/core";
import type { Input } from "@aws-sdk/client-mediaconvert";
import {
    AudioSelectorType,
    CaptionDestinationType,
    CaptionSourceType,
    ContainerType,
    EmbeddedConvert608To708,
    LanguageCode,
    OutputGroupType,
} from "@aws-sdk/client-mediaconvert";
import type { CombineVideosJobDataBlob } from "@midspace/shared-types/combineVideosJob";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { AWSJobStatus, Content_ElementType_Enum, ElementBaseType } from "@midspace/shared-types/content";
import { TranscodeMode } from "@midspace/shared-types/sns/mediaconvert";
import assert from "assert";
import type { P } from "pino";
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
    Job_Queues_JobStatus_Enum,
    MediaConvert_GetCombineVideosJobDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { awsClient, getAWSParameter, MediaConvert } from "../lib/aws/awsClient";
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

export async function processCombineVideosJobQueue(logger: P.Logger): Promise<void> {
    const jobsResponse = await (
        await apolloClient
    ).query({
        query: CombineVideosJob_GetJobsDocument,
    });

    jobsResponse.data.job_queues_CombineVideosJob.forEach(async (row) => {
        if (row.jobStatusName !== Job_Queues_JobStatus_Enum.New) {
            if (Date.now() - Date.parse(row.created_at) > 6 * 60 * 60 * 1000) {
                logger.error(
                    "Error: CombineVideosJob timed out after 6 hours (failing the job to avoid queue starvation)"
                );
                await failCombineVideosJob(logger, row.id, "Timed out after 6 hours");
            }
            return;
        }

        try {
            const data = assertType<CombineVideosJobDataBlob>(row.data);

            const result = await (
                await apolloClient
            ).query({
                query: CombineVideosJob_GetElementsDocument,
                variables: {
                    conferenceId: row.conferenceId,
                    elementIds: data.inputElements.map((item) => item.elementId),
                },
            });

            const itemIds = R.uniq(result.data.content_Element.map((item) => item.itemId));

            if (itemIds.length > 1 || itemIds.length === 0) {
                logger.error(
                    { jobId: row.id, itemIds },
                    "Can only combine content items from exactly one content group"
                );
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
                Role: await getAWSParameter("MEDIACONVERT_SERVICE_ROLE_ARN"),
                UserMetadata: {
                    mode: TranscodeMode.COMBINE,
                    combineVideosJobId: row.id,
                    itemId: itemIds[0],
                    environment: awsClient.prefix ?? "unknown",
                },
                Settings: {
                    Inputs: inputs,
                    OutputGroups: [
                        {
                            CustomName: "File Group",
                            OutputGroupSettings: {
                                FileGroupSettings: {
                                    Destination: `s3://${await getAWSParameter("CONTENT_BUCKET_ID")}/${destinationKey}`,
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

            await startCombineVideosJob(logger, row.id, mediaConvertJobResult.Job.Id);

            logger.info(
                { combineVideosJobId: row.id, mediaConvertJobId: mediaConvertJobResult.Job.Id },
                "Started CombineVideosJob MediaConvert job"
            );
        } catch (e: any) {
            logger.error({ err: e }, "Error while handling process CombineVideosJob");
            await failCombineVideosJob(logger, row.id, e.message);
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

export async function failCombineVideosJob(
    logger: P.Logger,
    combineVideosJobId: string,
    message: string
): Promise<void> {
    logger.info({ combineVideosJobId, message }, "Recording CombineVideosJob as failed");
    await callWithRetry(
        async () =>
            await (
                await apolloClient
            ).mutate({
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

async function startCombineVideosJob(logger: P.Logger, combineVideosJobId: string, mediaConvertJobId: string) {
    logger.info({ combineVideosJobId, mediaConvertJobId }, "Recording CombineVideosJob as started");
    await callWithRetry(
        async () =>
            await (
                await apolloClient
            ).mutate({
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

    query MediaConvert_GetCombineVideosJob($combineVideosJobId: uuid!, $itemId: uuid!) {
        job_queues_CombineVideosJob_by_pk(id: $combineVideosJobId) {
            id
            conferenceId
            outputName
        }
        content_Item_by_pk(id: $itemId) {
            id
            subconferenceId
        }
    }

    mutation CombineVideosJob_CreateElement(
        $data: jsonb!
        $name: String!
        $itemId: uuid!
        $conferenceId: uuid!
        $subconferenceId: uuid!
    ) {
        insert_content_Element_one(
            object: {
                data: $data
                isHidden: true
                name: $name
                typeName: VIDEO_FILE
                itemId: $itemId
                conferenceId: $conferenceId
                subconferenceId: $subconferenceId
            }
        ) {
            id
        }
    }
`;

export async function completeCombineVideosJob(
    logger: P.Logger,
    combineVideosJobId: string,
    transcodeS3Url: string,
    subtitleS3Url: string,
    itemId: string
): Promise<void> {
    logger.info({ combineVideosJobId }, "Recording CombineVideosJob as completed");

    try {
        const combineVideosJobResult = await callWithRetry(
            async () =>
                await (
                    await apolloClient
                ).query({
                    query: MediaConvert_GetCombineVideosJobDocument,
                    variables: {
                        combineVideosJobId,
                        itemId,
                    },
                })
        );

        if (!combineVideosJobResult.data.job_queues_CombineVideosJob_by_pk) {
            logger.error({ combineVideosJobId }, "Could not find related CombineVideosJob");
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
                await (
                    await apolloClient
                ).mutate({
                    mutation: CombineVideosJob_CreateElementDocument,
                    variables: {
                        conferenceId: combineVideosJobResult.data.job_queues_CombineVideosJob_by_pk?.conferenceId,
                        subconferenceId: combineVideosJobResult.data.content_Item_by_pk?.subconferenceId ?? null,
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
                await (
                    await apolloClient
                ).mutate({
                    mutation: CombineVideosJob_CompleteJobDocument,
                    variables: {
                        combineVideosJobId,
                    },
                })
        );
    } catch (e: any) {
        await failCombineVideosJob(logger, combineVideosJobId, e.message);
    }
}
