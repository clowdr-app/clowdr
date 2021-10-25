import { gql } from "@apollo/client/core";
import type { Bunyan } from "@eropple/nestjs-bunyan";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import { sub } from "date-fns";
import type { Job_Queues_JobStatus_Enum } from "../../generated/graphql";
import {
    ChannelStackSync_GetChannelStackDeleteJobsDocument,
    ChannelStackSync_GetStuckChannelStackDeleteJobsDocument,
    ChannelStack_CompleteChannelStackDeleteJobDocument,
} from "../../generated/graphql";
import type { GraphQlService } from "../graphql/graphql.service";

@Injectable()
export class ChannelStackDeleteJobService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async getNewChannelStackDeleteJobs(): Promise<
        { id: string; mediaLiveChannelId: string; cloudFormationStackArn: string }[]
    > {
        gql`
            query ChannelStackSync_GetChannelStackDeleteJobs {
                job_queues_ChannelStackDeleteJob(where: { jobStatusName: { _eq: NEW } }) {
                    id
                    mediaLiveChannelId
                    cloudFormationStackArn
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStackSync_GetChannelStackDeleteJobsDocument,
        });

        return result.data.job_queues_ChannelStackDeleteJob;
    }

    public async getStuckChannelStackDeleteJobs(): Promise<
        { id: string; mediaLiveChannelId: string; cloudFormationStackArn: string }[]
    > {
        gql`
            query ChannelStackSync_GetStuckChannelStackDeleteJobs($cutoff: timestamptz!) {
                job_queues_ChannelStackDeleteJob(
                    where: { jobStatusName: { _eq: IN_PROGRESS }, updatedAt: { _lt: $cutoff } }
                ) {
                    id
                    mediaLiveChannelId
                    cloudFormationStackArn
                }
            }
        `;

        const cutoff = sub(Date.now(), { hours: 1 });

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStackSync_GetStuckChannelStackDeleteJobsDocument,
            variables: {
                cutoff,
            },
        });

        return result.data.job_queues_ChannelStackDeleteJob;
    }
    public async setStatusChannelStackDeleteJob(
        cloudFormationStackArn: string,
        status: Job_Queues_JobStatus_Enum,
        message: string | null
    ): Promise<void> {
        gql`
            mutation ChannelStack_CompleteChannelStackDeleteJob(
                $cloudFormationStackArn: String!
                $status: job_queues_JobStatus_enum!
                $message: String
            ) {
                update_job_queues_ChannelStackDeleteJob(
                    where: { cloudFormationStackArn: { _eq: $cloudFormationStackArn } }
                    _set: { jobStatusName: $status, message: $message }
                ) {
                    affected_rows
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_CompleteChannelStackDeleteJobDocument,
            variables: {
                cloudFormationStackArn,
                status,
                message,
            },
        });
    }
}
