import { gql } from "@apollo/client/core";
import type { Bunyan } from "@eropple/nestjs-bunyan";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import { sub } from "date-fns";
import type { Job_Queues_JobStatus_Enum } from "../../generated/graphql";
import {
    ChannelStackSync_GetChannelStackUpdateJobsDocument,
    ChannelStackSync_GetStuckChannelStackUpdateJobsDocument,
    ChannelStack_SetChannelStackUpdateJobStatusByMlciDocument,
    ChannelStack_SetChannelStackUpdateJobStatusDocument,
    ChannelStack_UpdateChannelStackDocument,
} from "../../generated/graphql";
import { GraphQlService } from "../graphql/graphql.service";

@Injectable()
export class ChannelStackUpdateJobService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async getNewChannelStackUpdateJobs(): Promise<
        {
            id: string;
            mediaLiveChannelId: string;
            cloudFormationStackArn: string;
            oldRtmpRoomInput: {
                inputId: string;
                attachmentName: string;
            } | null;
            newRtmpRoomInput: {
                inputId: string;
                attachmentName: string;
            } | null;
            oldRtmpBInput: {
                inputId: string;
                attachmentName: string;
            } | null;
            newRtmpBInput: {
                inputId: string;
                attachmentName: string;
            } | null;
            newRtmpOutputUri: string | null;
            newRtmpOutputStreamKey: string | null;
        }[]
    > {
        gql`
            query ChannelStackSync_GetChannelStackUpdateJobs {
                job_queues_ChannelStackUpdateJob(where: { jobStatusName: { _eq: NEW } }) {
                    id
                    channelStackId
                    mediaLiveChannelId
                    cloudFormationStackArn
                    oldRtmpOutputUri
                    oldRtmpOutputStreamKey
                    oldRtmpOutputDestinationId
                    newRtmpOutputUri
                    newRtmpOutputStreamKey
                    oldRtmpRoomInputId
                    oldRtmpRoomInputAttachmentName
                    newRtmpRoomInputId
                    newRtmpRoomInputAttachmentName
                    oldRtmpBInputId
                    oldRtmpBInputAttachmentName
                    newRtmpBInputId
                    newRtmpBInputAttachmentName
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStackSync_GetChannelStackUpdateJobsDocument,
        });

        return result.data.job_queues_ChannelStackUpdateJob.map((x) => ({
            cloudFormationStackArn: x.cloudFormationStackArn,
            id: x.id,
            mediaLiveChannelId: x.mediaLiveChannelId,
            oldRtmpRoomInput:
                x.oldRtmpRoomInputId && x.oldRtmpRoomInputAttachmentName
                    ? {
                          inputId: x.oldRtmpRoomInputId,
                          attachmentName: x.oldRtmpRoomInputAttachmentName,
                      }
                    : null,
            newRtmpRoomInput:
                x.newRtmpRoomInputId && x.newRtmpRoomInputAttachmentName
                    ? {
                          inputId: x.newRtmpRoomInputId,
                          attachmentName: x.newRtmpRoomInputAttachmentName,
                      }
                    : null,
            newRtmpOutputStreamKey: x.newRtmpOutputStreamKey ?? null,
            newRtmpOutputUri: x.newRtmpOutputUri ?? null,
            oldRtmpBInput:
                x.oldRtmpBInputId && x.oldRtmpBInputAttachmentName
                    ? {
                          inputId: x.oldRtmpBInputId,
                          attachmentName: x.oldRtmpBInputAttachmentName,
                      }
                    : null,
            newRtmpBInput:
                x.newRtmpBInputId && x.newRtmpBInputAttachmentName
                    ? {
                          inputId: x.newRtmpBInputId,
                          attachmentName: x.newRtmpBInputAttachmentName,
                      }
                    : null,
        }));
    }

    public async getStuckChannelStackUpdateJobs(): Promise<
        { id: string; mediaLiveChannelId: string; cloudFormationStackArn: string }[]
    > {
        gql`
            query ChannelStackSync_GetStuckChannelStackUpdateJobs($cutoff: timestamptz!) {
                job_queues_ChannelStackUpdateJob(
                    where: { jobStatusName: { _eq: IN_PROGRESS }, updated_at: { _lt: $cutoff } }
                ) {
                    id
                    channelStackId
                    mediaLiveChannelId
                    cloudFormationStackArn
                }
            }
        `;

        const cutoff = sub(Date.now(), { hours: 1 });

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStackSync_GetStuckChannelStackUpdateJobsDocument,
            variables: {
                cutoff,
            },
        });

        return result.data.job_queues_ChannelStackUpdateJob;
    }

    public async setUpdatedChannelConfiguration(
        mediaLiveChannelId: string,
        rtmpOutputUri: string | null,
        rtmpOutputStreamKey: string | null,
        rtmpOutputDestinationId: string | null
    ): Promise<void> {
        gql`
            mutation ChannelStack_UpdateChannelStack(
                $mediaLiveChannelId: String!
                $rtmpOutputUri: String
                $rtmpOutputStreamKey: String
                $rtmpOutputDestinationId: String
            ) {
                update_video_ChannelStack(
                    where: { mediaLiveChannelId: { _eq: $mediaLiveChannelId } }
                    _set: {
                        rtmpOutputUri: $rtmpOutputUri
                        rtmpOutputStreamKey: $rtmpOutputStreamKey
                        rtmpOutputDestinationId: $rtmpOutputDestinationId
                    }
                ) {
                    affected_rows
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_UpdateChannelStackDocument,
            variables: {
                mediaLiveChannelId,
                rtmpOutputUri,
                rtmpOutputStreamKey,
                rtmpOutputDestinationId,
            },
        });
    }

    public async setStatusChannelStackUpdateJob(
        cloudFormationStackArn: string,
        status: Job_Queues_JobStatus_Enum,
        message: string | null
    ): Promise<void> {
        gql`
            mutation ChannelStack_SetChannelStackUpdateJobStatus(
                $cloudFormationStackArn: String!
                $status: job_queues_JobStatus_enum!
                $message: String
            ) {
                update_job_queues_ChannelStackUpdateJob(
                    where: {
                        cloudFormationStackArn: { _eq: $cloudFormationStackArn }
                        jobStatusName: { _in: [NEW, IN_PROGRESS] }
                    }
                    _set: { jobStatusName: $status, message: $message }
                ) {
                    affected_rows
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_SetChannelStackUpdateJobStatusDocument,
            variables: {
                cloudFormationStackArn,
                status,
                message,
            },
        });
    }

    public async setStatusChannelStackUpdateJobByMediaLiveChannelId(
        mediaLiveChannelId: string,
        status: Job_Queues_JobStatus_Enum,
        message: string | null
    ): Promise<void> {
        gql`
            mutation ChannelStack_SetChannelStackUpdateJobStatusByMLCI(
                $mediaLiveChannelId: String!
                $status: job_queues_JobStatus_enum!
                $message: String
            ) {
                update_job_queues_ChannelStackUpdateJob(
                    where: {
                        mediaLiveChannelId: { _eq: $mediaLiveChannelId }
                        jobStatusName: { _in: [NEW, IN_PROGRESS] }
                    }
                    _set: { jobStatusName: $status, message: $message }
                ) {
                    affected_rows
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_SetChannelStackUpdateJobStatusByMlciDocument,
            variables: {
                mediaLiveChannelId,
                status,
                message,
            },
        });
    }
}
