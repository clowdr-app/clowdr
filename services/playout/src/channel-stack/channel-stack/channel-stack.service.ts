import { App } from "@aws-cdk/core";
import { DescribeStacksCommandOutput, StackStatus } from "@aws-sdk/client-cloudformation";
import { ChannelState, DescribeChannelResponse } from "@aws-sdk/client-medialive";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import parseArn from "@unbounce/parse-aws-arn";
import assert from "assert";
import { DeployStackResult } from "aws-cdk/lib/api/deploy-stack";
import pThrottle from "p-throttle";
import { AwsService } from "../../aws/aws.service";
import { CloudFormationService } from "../../aws/cloud-formation/cloud-formation.service";
import { MediaLiveService } from "../../aws/medialive/medialive.service";
import { Video_JobStatus_Enum } from "../../generated/graphql";
import { ChannelStackCreateJobService } from "../../hasura-data/channel-stack-create-job/channel-stack-create-job.service";
import { ChannelStackDeleteJobService } from "../../hasura-data/channel-stack-delete-job/channel-stack-delete-job.service";
import { ChannelStackDataService } from "../../hasura-data/channel-stack/channel-stack.service";
import { shortId } from "../../utils/id";
import { ChannelStack, ChannelStackDescription, ChannelStackProps } from "./channelStack";

@Injectable()
export class ChannelStackService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private configService: ConfigService,
        private awsService: AwsService,
        private cloudFormationService: CloudFormationService,
        private channelStackCreateJobService: ChannelStackCreateJobService,
        private channelStackDeleteJobService: ChannelStackDeleteJobService,
        private channelStackDataService: ChannelStackDataService,
        private mediaLiveService: MediaLiveService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async handleCompletedChannelStack(
        stackLogicalResourceId: string,
        stackPhysicalResourceId: string
    ): Promise<void> {
        const job = await this.channelStackCreateJobService.findChannelStackCreateJobByLogicalResourceId(
            stackLogicalResourceId
        );

        if (!job) {
            this.logger.warn(
                { stackLogicalResourceId, stackPhysicalResourceId },
                "Could not find a job associated with the completed channel stack"
            );
            return;
        }

        const description = await this.describeChannelStack(stackLogicalResourceId);
        await this.channelStackDataService.createChannelStack(
            description,
            stackPhysicalResourceId,
            job.jobId,
            job.conferenceId,
            job.roomId
        );
        await this.channelStackCreateJobService.completeChannelStackCreateJob(job.jobId);
    }

    public async handleFailedChannelStack(stackLogicalResourceId: string, reason: string): Promise<void> {
        const job = await this.channelStackCreateJobService.findChannelStackCreateJobByLogicalResourceId(
            stackLogicalResourceId
        );

        if (!job) {
            this.logger.warn(
                { stackLogicalResourceId },
                "Could not find a job associated with the failed channel stack"
            );
            return;
        }

        await this.cloudFormationService.cloudFormation.deleteStack({
            StackName: stackLogicalResourceId,
        });
        await this.channelStackCreateJobService.failChannelStackCreateJob(job.jobId, reason);
    }

    public async describeChannelStack(stackName: string): Promise<ChannelStackDescription> {
        const description = await this.cloudFormationService.cloudFormation.describeStacks({
            StackName: stackName,
        });

        if (!description.Stacks || description.Stacks.length !== 1) {
            throw new Error(`Could not find stack ${stackName}`);
        }

        function findOutput(key: string): string | null {
            assert(description.Stacks);
            const value = description.Stacks[0].Outputs?.find((x) => x.OutputKey === key)?.OutputValue;
            return value ?? null;
        }

        function findExpectedOutput(key: string): string {
            const value = findOutput(key);
            assert(value, `Could not find output with key '${key}'`);
            return value;
        }

        const rtmpAInputUri = findExpectedOutput("RtmpAInputUri");
        const rtmpAInputId = findExpectedOutput("RtmpAInputId");
        const rtmpBInputUri = findExpectedOutput("RtmpBInputUri");
        const rtmpBInputId = findExpectedOutput("RtmpBInputId");
        const mp4InputId = findExpectedOutput("Mp4InputId");
        const loopingMp4InputId = findExpectedOutput("LoopingMp4InputId");
        const mp4InputAttachmentName = findExpectedOutput("Mp4InputAttachmentName");
        const loopingMp4InputAttachmentName = findExpectedOutput("LoopingMp4InputAttachmentName");
        const rtmpAInputAttachmentName = findExpectedOutput("RtmpAInputAttachmentName");
        const rtmpBInputAttachmentName = findExpectedOutput("RtmpBInputAttachmentName");
        const mediaLiveChannelId = findExpectedOutput("MediaLiveChannelId");
        const mediaPackageChannelId = findExpectedOutput("MediaPackageChannelId");
        const cloudFrontDistributionId = findExpectedOutput("CloudFrontDistributionId");
        const cloudFrontDomain = findExpectedOutput("CloudFrontDomain");
        const endpointUri = findExpectedOutput("EndpointUri");
        const rtmpOutputUri = findOutput("RtmpOutputUri");
        const rtmpOutputStreamKey = findOutput("RtmpOutputStreamKey");
        const rtmpOutputDestinationId = findOutput("RtmpOutputDestinationId");

        return {
            rtmpAInputUri,
            rtmpAInputId,
            rtmpBInputUri,
            rtmpBInputId,
            mp4InputId,
            loopingMp4InputId,
            mp4InputAttachmentName,
            loopingMp4InputAttachmentName,
            rtmpAInputAttachmentName,
            rtmpBInputAttachmentName,
            mediaLiveChannelId,
            mediaPackageChannelId,
            cloudFrontDistributionId,
            cloudFrontDomain,
            endpointUri,
            rtmpOutputUri,
            rtmpOutputStreamKey,
            rtmpOutputDestinationId,
        };
    }

    public async createNewChannelStack(
        roomId: string,
        roomName: string,
        conferenceId: string,
        stackLogicalResourceId: string,
        rtmpOutputUrl: string | undefined,
        rtmpOutputStreamKey: string | undefined
    ): Promise<DeployStackResult> {
        const awsPrefix = this.configService.get<string>("AWS_PREFIX");
        assert(awsPrefix, "Missing AWS_PREFIX");
        const inputSecurityGroupId = this.configService.get<string>("AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID");
        assert(inputSecurityGroupId, "Missing AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID");
        const mediaLiveServiceRoleArn = this.configService.get<string>("AWS_MEDIALIVE_SERVICE_ROLE_ARN");
        assert(mediaLiveServiceRoleArn, "Missing AWS_MEDIALIVE_SERVICE_ROLE_ARN");
        const cloudFormationNotificationsTopicArn = this.configService.get<string>(
            "AWS_CLOUDFORMATION_NOTIFICATIONS_TOPIC_ARN"
        );
        const awsContentBucketId = this.configService.get<string>("AWS_CONTENT_BUCKET_ID");
        assert(awsContentBucketId, "Missing AWS_CONTENT_BUCKET_ID");
        assert(cloudFormationNotificationsTopicArn, "Missing AWS_CLOUDFORMATION_NOTIFICATIONS_TOPIC_ARN");
        const region = this.configService.get<string>("AWS_REGION");
        assert(region, "Missing AWS_REGION");
        const account = this.configService.get<string>("AWS_ACCOUNT_ID");
        assert(account, "Missing AWS_ACCOUNT_ID");

        const options: ChannelStackProps = {
            awsPrefix,
            generateId: shortId,
            inputSecurityGroupId,
            roomId,
            roomName,
            conferenceId,
            rtmpOutputUrl,
            rtmpOutputStreamKey,
            tags: {
                roomId,
                roomName,
                conferenceId,
            },
            env: {
                account,
                region,
            },
            description: `Broadcast channel stack for room ${roomId}`,
            mediaLiveServiceRoleArn,
            awsContentBucketId,
        };

        this.logger.info("Starting deployment");
        const app = new App();
        const stack = new ChannelStack(app, stackLogicalResourceId, options);
        return this.awsService.deployCdkStack(app, stack, cloudFormationNotificationsTopicArn);
    }

    /**
     * @summary Creates the job to delete the channel CloudFormation stack and deletes the ChannelStack record.
     */
    public async startChannelStackDeletion(channelStackId: string, mediaLiveChannelId: string): Promise<void> {
        this.logger.info({ channelStackId }, "Deleting channel stack");

        await this.channelStackDataService.createChannelStackDeleteJob(channelStackId, mediaLiveChannelId);
        await this.channelStackDataService.deleteChannelStackRecord(channelStackId);
    }

    /**
     * Actually start deletion of the channel stack. Will not start deletion if the MediaLive channel is still running.
     */
    async deleteChannelStack(cloudFormationStackArn: string, mediaLiveChannelId: string): Promise<void> {
        let channelState: string | null = null;
        try {
            channelState = await this.mediaLiveService.getChannelState(mediaLiveChannelId);
        } catch (err) {
            this.logger.warn(
                { err, mediaLiveChannelId, cloudFormationStackArn },
                "Couldn't get MediaLive channel state. Attempting to continue with deletion."
            );
        }
        try {
            if (channelState && [ChannelState.RUNNING.toString(), ChannelState.STARTING].includes(channelState)) {
                await this.mediaLiveService.stopChannel(mediaLiveChannelId);
                throw new Error(
                    "MediaLive channel is still running. Stopping the channel, but can't start deletion yet."
                );
            }
        } catch (err) {
            this.logger.warn({ err, mediaLiveChannelId }, "Failed to ensure channel stack stopped before deletion");
            throw new Error("Couldn't ensure that MediaLive channel was stopped.");
        }

        const arn = parseArn(cloudFormationStackArn);
        const stackName = arn.resourceId?.split("/")[0];
        let description: DescribeStacksCommandOutput;
        try {
            description = await this.cloudFormationService.cloudFormation.describeStacks({
                StackName: stackName,
            });
        } catch (err) {
            this.logger.error({ stackName, err }, "Failed to get channel stack description");
            throw err;
        }

        if (!description.Stacks || description.Stacks.length === 0) {
            this.logger.error({ cloudFormationStackArn, mediaLiveChannelId }, "No channel stack found, skipping");
            throw new Error("Channel stack does not exist");
        } else if (
            description.Stacks[0].StackStatus &&
            [StackStatus.DELETE_COMPLETE as string, StackStatus.DELETE_IN_PROGRESS].includes(
                description.Stacks[0].StackStatus
            )
        ) {
            this.logger.info(
                { cloudFormationStackArn, mediaLiveChannelId },
                "Channel stack deletion has already started, skipping"
            );
            return;
        } else {
            this.logger.info({ cloudFormationStackArn, mediaLiveChannelId }, "Starting channel stack teardown");
            try {
                await this.cloudFormationService.cloudFormation.deleteStack({
                    StackName: stackName,
                });
            } catch (err) {
                this.logger.error({ stackName, err }, "Failed to trigger channel stack teardown");
                throw err;
            }
            return;
        }
    }

    public async processChannelStackDeleteJobs(): Promise<void> {
        const newJobs = await this.channelStackDeleteJobService.getNewChannelStackDeleteJobs();

        for (const job of newJobs) {
            try {
                await this.deleteChannelStack(job.cloudFormationStackArn, job.mediaLiveChannelId);
                await this.channelStackDeleteJobService.setStatusChannelStackDeleteJob(
                    job.cloudFormationStackArn,
                    Video_JobStatus_Enum.InProgress,
                    null
                );
            } catch (err) {
                this.logger.error({ err }, "Failed to process new channel stack delete job");
            }
        }

        const oldJobs = await this.channelStackDeleteJobService.getStuckChannelStackDeleteJobs();

        for (const job of oldJobs) {
            try {
                this.logger.error({ job }, "Channel stack delete job seems to be stuck, marking it as failed");
                await this.channelStackDeleteJobService.setStatusChannelStackDeleteJob(
                    job.cloudFormationStackArn,
                    Video_JobStatus_Enum.Failed,
                    "Job got stuck"
                );
            } catch (err) {
                this.logger.error({ err }, "Failed to update stuck channel stack delete job");
            }
        }
    }

    public async getChannelStacks(): Promise<
        {
            roomId: string;
            channelStackId: string;
            conferenceId: string;
            channel: DescribeChannelResponse;
        }[]
    > {
        const channelStacks = await this.channelStackDataService.getChannelStacks();

        const throttle = pThrottle({
            interval: 1000,
            limit: 5,
        });
        const throttledGetChannel = throttle(this.mediaLiveService.describeChannel.bind(this.mediaLiveService));

        const result = await Promise.all(
            channelStacks.map(async (channelStack) => {
                const details = await throttledGetChannel(channelStack.mediaLiveChannelId);

                return { channel: details, ...channelStack };
            })
        );

        return result;
    }
}
