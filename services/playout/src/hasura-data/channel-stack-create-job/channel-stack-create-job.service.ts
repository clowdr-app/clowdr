import { gql } from "@apollo/client/core";
import type { Bunyan} from "@eropple/nestjs-bunyan";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import { sub } from "date-fns";
import {
    CompleteChannelStackCreateJobDocument,
    CreateChannelStackCreateJobDocument,
    FailChannelStackCreateJobDocument,
    FindChannelStackCreateJobByLogicalResourceIdDocument,
    FindPotentiallyStuckChannelStackCreateJobsDocument,
    GetChannelStackCreateJobDocument,
    Video_JobStatus_Enum,
} from "../../generated/graphql";
import type { GraphQlService } from "../graphql/graphql.service";

@Injectable()
export class ChannelStackCreateJobService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async createChannelStackCreateJob(
        roomId: string,
        conferenceId: string,
        stackLogicalResourceId: string
    ): Promise<string> {
        gql`
            mutation CreateChannelStackCreateJob(
                $conferenceId: uuid!
                $roomId: uuid!
                $stackLogicalResourceId: String!
            ) {
                insert_job_queues_ChannelStackCreateJob_one(
                    object: {
                        conferenceId: $conferenceId
                        jobStatusName: IN_PROGRESS
                        roomId: $roomId
                        stackLogicalResourceId: $stackLogicalResourceId
                    }
                ) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.mutate({
            mutation: CreateChannelStackCreateJobDocument,
            variables: {
                roomId,
                conferenceId,
                stackLogicalResourceId,
            },
        });

        return result.data?.insert_job_queues_ChannelStackCreateJob_one?.id;
    }

    public async failChannelStackCreateJob(jobId: string, message: string): Promise<void> {
        gql`
            query GetChannelStackCreateJob($id: uuid!) {
                job_queues_ChannelStackCreateJob_by_pk(id: $id) {
                    id
                    jobStatusName
                }
            }

            mutation FailChannelStackCreateJob($id: uuid!, $message: String!) {
                update_job_queues_ChannelStackCreateJob_by_pk(
                    pk_columns: { id: $id }
                    _set: { jobStatusName: FAILED, message: $message }
                ) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: GetChannelStackCreateJobDocument,
            variables: {
                id: jobId,
            },
        });

        if (result.data.job_queues_ChannelStackCreateJob_by_pk?.jobStatusName !== Video_JobStatus_Enum.Failed) {
            await this.graphQlService.apolloClient.mutate({
                mutation: FailChannelStackCreateJobDocument,
                variables: {
                    id: jobId,
                    message,
                },
            });
        }
    }

    public async completeChannelStackCreateJob(jobId: string): Promise<void> {
        gql`
            mutation CompleteChannelStackCreateJob($id: uuid!) {
                update_job_queues_ChannelStackCreateJob_by_pk(
                    pk_columns: { id: $id }
                    _set: { jobStatusName: COMPLETED }
                ) {
                    id
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: CompleteChannelStackCreateJobDocument,
            variables: {
                id: jobId,
            },
        });
    }

    public async findChannelStackCreateJobByLogicalResourceId(
        stackLogicalResourceId: string
    ): Promise<{ jobId: string; conferenceId: string; roomId: string } | null> {
        gql`
            query FindChannelStackCreateJobByLogicalResourceId($stackLogicalResourceId: String!) {
                job_queues_ChannelStackCreateJob(where: { stackLogicalResourceId: { _eq: $stackLogicalResourceId } }) {
                    id
                    conferenceId
                    roomId
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: FindChannelStackCreateJobByLogicalResourceIdDocument,
            variables: {
                stackLogicalResourceId,
            },
        });

        if (result.data.job_queues_ChannelStackCreateJob.length > 0) {
            return {
                jobId: result.data.job_queues_ChannelStackCreateJob[0].id,
                conferenceId: result.data.job_queues_ChannelStackCreateJob[0].conferenceId,
                roomId: result.data.job_queues_ChannelStackCreateJob[0].roomId,
            };
        } else {
            return null;
        }
    }

    public async findPotentiallyStuckChannelStackCreateJobs(): Promise<
        { jobId: string; stackLogicalResourceId: string }[]
    > {
        gql`
            query FindPotentiallyStuckChannelStackCreateJobs($past: timestamptz!) {
                job_queues_ChannelStackCreateJob(
                    where: { updated_at: { _lte: $past }, jobStatusName: { _eq: IN_PROGRESS } }
                ) {
                    jobId: id
                    stackLogicalResourceId
                }
            }
        `;

        const past = sub(new Date(), { minutes: 15 }).toISOString();

        const result = await this.graphQlService.apolloClient.query({
            query: FindPotentiallyStuckChannelStackCreateJobsDocument,
            variables: {
                past,
            },
        });

        return result.data.job_queues_ChannelStackCreateJob;
    }
}
