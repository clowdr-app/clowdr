import { App } from "@aws-cdk/core";
import type { DescribeStacksCommandOutput } from "@aws-sdk/client-cloudformation";
import { StackStatus } from "@aws-sdk/client-cloudformation";
import type { DescribeChannelResponse } from "@aws-sdk/client-medialive";
import { ChannelState } from "@aws-sdk/client-medialive";
import type { Bunyan } from "@eropple/nestjs-bunyan/dist";
import { RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import parseArn from "@unbounce/parse-aws-arn";
import assert from "assert";
import type { DeployStackResult } from "aws-cdk/lib/api/deploy-stack";
import pThrottle from "p-throttle";
import type { AwsService } from "../../aws/aws.service";
import type { CloudFormationService } from "../../aws/cloud-formation/cloud-formation.service";
import type { MediaLiveService } from "../../aws/medialive/medialive.service";
import { Job_Queues_JobStatus_Enum } from "../../generated/graphql";
import type { ChannelStackCreateJobService } from "../../hasura-data/channel-stack-create-job/channel-stack-create-job.service";
import type { ChannelStackDeleteJobService } from "../../hasura-data/channel-stack-delete-job/channel-stack-delete-job.service";
import type { ChannelStackUpdateJobService } from "../../hasura-data/channel-stack-update-job/channel-stack-update-job.service";
import type { ChannelStackDataService } from "../../hasura-data/channel-stack/channel-stack.service";
import { shortId } from "../../utils/id";
import type { ChannelStackDescription, ChannelStackProps } from "./channelStack";
import { ChannelStack } from "./channelStack";

function transformKeyNames(value: any): any {
    let result: any = {};

    if (value && value instanceof Array) {
        result = [];
        for (const item of value) {
            result.push(transformKeyNames(item));
        }
    } else if (typeof value === "object") {
        for (const key in value) {
            if (key in value) {
                const innerValue = transformKeyNames(value[key]);
                if (typeof key === "string") {
                    result[key[0].toUpperCase() + key.slice(1)] = innerValue;
                } else {
                    result[key] = innerValue;
                }
            }
        }
    } else {
        result = value;
    }

    return result;
}

@Injectable()
export class ChannelStackService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private configService: ConfigService,
        private awsService: AwsService,
        private cloudFormationService: CloudFormationService,
        private channelStackCreateJobService: ChannelStackCreateJobService,
        private channelStackUpdateJobService: ChannelStackUpdateJobService,
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
     * @summary Creates the job to update the channel CloudFormation stack.
     */
    public async startChannelStackUpdate(channelStackId: string, mediaLiveChannelId: string): Promise<void> {
        this.logger.info({ channelStackId }, "Update channel stack");

        await this.channelStackDataService.createChannelStackUpdateJob(channelStackId, mediaLiveChannelId);
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
     * Actually start updating the channel stack. Will not start updating if the MediaLive channel is still running.
     */
    async updateChannelStack(
        cloudFormationStackArn: string,
        mediaLiveChannelId: string,
        newRtmpOutputUri: string | null,
        newRtmpOutputStreamKey: string | null
    ): Promise<boolean> {
        let channelState: string | null = null;
        try {
            channelState = await this.mediaLiveService.getChannelState(mediaLiveChannelId);
        } catch (err) {
            this.logger.warn(
                { err, mediaLiveChannelId, cloudFormationStackArn },
                "Couldn't get MediaLive channel state. Attempting to continue with update."
            );
        }
        try {
            if (channelState && [ChannelState.RUNNING.toString(), ChannelState.STARTING].includes(channelState)) {
                await this.mediaLiveService.stopChannel(mediaLiveChannelId);
                throw new Error(
                    "MediaLive channel is still running. Stopping the channel, but can't start updating yet."
                );
            }
        } catch (err) {
            this.logger.warn({ err, mediaLiveChannelId }, "Failed to ensure channel stack stopped before update");
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
            if (err.toString().includes(`Stack with id ${stackName} does not exist`)) {
                this.logger.info(
                    { stackName, err },
                    "Channel stack does not exist - it has already been deleted. Update is no longer relevant."
                );
                await this.channelStackUpdateJobService.setStatusChannelStackUpdateJob(
                    cloudFormationStackArn,
                    Job_Queues_JobStatus_Enum.Completed,
                    "Stack has been deleted. This update is obsolete."
                );
                return false;
            } else {
                this.logger.error({ stackName, err }, "Failed to get channel stack description");
                throw err;
            }
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
                "Channel stack deletion has started, skipping"
            );
            await this.channelStackUpdateJobService.setStatusChannelStackUpdateJob(
                cloudFormationStackArn,
                Job_Queues_JobStatus_Enum.Completed,
                "Stack is being deleted. This update is obsolete."
            );
            return false;
        } else if (
            description.Stacks[0].StackStatus &&
            [
                StackStatus.UPDATE_IN_PROGRESS as string,
                StackStatus.UPDATE_ROLLBACK_IN_PROGRESS,
                StackStatus.UPDATE_COMPLETE_CLEANUP_IN_PROGRESS,
            ].includes(description.Stacks[0].StackStatus)
        ) {
            this.logger.info(
                { cloudFormationStackArn, mediaLiveChannelId },
                "A channel stack update is ongoing, skipping"
            );
            return true;
        } else if (
            description.Stacks[0].StackStatus &&
            [StackStatus.CREATE_IN_PROGRESS as string].includes(description.Stacks[0].StackStatus)
        ) {
            this.logger.info(
                { cloudFormationStackArn, mediaLiveChannelId },
                "Channel stack is still being created, skipping"
            );
            return false;
        } else {
            this.logger.info({ cloudFormationStackArn, mediaLiveChannelId }, "Starting channel stack update");
            try {
                const channelDescription = await this.mediaLiveService.describeChannel(mediaLiveChannelId);

                if (!channelDescription.EncoderSettings) {
                    throw new Error("Channel description does not include encoder settings");
                }
                if (!channelDescription.EncoderSettings.VideoDescriptions) {
                    throw new Error("Channel description does not include encoder settings: video descriptions");
                }
                if (!channelDescription.EncoderSettings.AudioDescriptions) {
                    throw new Error("Channel description does not include encoder settings: audio descriptions");
                }
                if (!channelDescription.EncoderSettings.OutputGroups) {
                    throw new Error("Channel description does not include encoder settings: output groups");
                }
                if (!channelDescription.Destinations) {
                    throw new Error("Channel description does not include destinations");
                }

                const hasExternalRTMP = channelDescription.EncoderSettings.OutputGroups.some((desc) =>
                    desc.Name?.endsWith("-ExternalRTMP")
                );

                let rtmpOutputDestinationId: string | null = null;
                if (!hasExternalRTMP) {
                    if (newRtmpOutputUri && newRtmpOutputStreamKey) {
                        const video1080p30HQDescription = ChannelStack.createVideoDescription_1080p30HQ(shortId());
                        channelDescription.EncoderSettings.VideoDescriptions.push(
                            transformKeyNames(video1080p30HQDescription)
                        );

                        const audioHQDescriptionName = channelDescription.EncoderSettings.AudioDescriptions.find((x) =>
                            x.Name?.endsWith("-HQ")
                        )?.Name;
                        assert(audioHQDescriptionName, "Could not find HQ Audio Description Name");

                        rtmpOutputDestinationId = `${shortId()}-ExternalRTMP`;
                        const outputDescription = ChannelStack.createOutputGroup_ExternalRTMP(
                            `${shortId()}-ExternalRTMP`,
                            rtmpOutputDestinationId,
                            video1080p30HQDescription.name,
                            audioHQDescriptionName
                        );
                        channelDescription.EncoderSettings.OutputGroups.push(transformKeyNames(outputDescription));
                    }
                } else if (!(newRtmpOutputUri && newRtmpOutputStreamKey)) {
                    channelDescription.EncoderSettings.VideoDescriptions =
                        channelDescription.EncoderSettings.VideoDescriptions.filter(
                            (x) => x.CodecSettings?.H264Settings?.QvbrQualityLevel !== 8
                        );

                    channelDescription.EncoderSettings.OutputGroups =
                        channelDescription.EncoderSettings.OutputGroups.filter(
                            (x) => !x.Name?.endsWith("-ExternalRTMP")
                        );
                }

                const existingRtmpOutputDestinationId = channelDescription.Destinations.find((x) =>
                    x.Id?.endsWith("-ExternalRTMP")
                )?.Id;
                if (hasExternalRTMP) {
                    if (newRtmpOutputUri && newRtmpOutputStreamKey) {
                        channelDescription.Destinations.forEach((destination) => {
                            if (destination.Id === existingRtmpOutputDestinationId) {
                                if (!destination.Settings?.length) {
                                    throw new Error("Existing RTMP Destination data does not include the Settings");
                                }
                                destination.Settings[0].Url = newRtmpOutputUri;
                                destination.Settings[0].StreamName = newRtmpOutputStreamKey;
                            }
                        });
                    } else {
                        channelDescription.Destinations = channelDescription.Destinations.filter(
                            (x) => x.Id !== existingRtmpOutputDestinationId
                        );
                    }
                } else {
                    if (newRtmpOutputUri && newRtmpOutputStreamKey) {
                        assert(rtmpOutputDestinationId, "RTMP Output Destination Id not created.");

                        const destination = ChannelStack.createDestination_ExernalRTMP(
                            rtmpOutputDestinationId,
                            newRtmpOutputUri,
                            newRtmpOutputStreamKey
                        );
                        channelDescription.Destinations.push(transformKeyNames(destination));
                    }
                }

                await this.mediaLiveService.updateChannel(
                    mediaLiveChannelId,
                    channelDescription.EncoderSettings,
                    channelDescription.Destinations
                );

                return true;
            } catch (err) {
                this.logger.error({ stackName, err }, "Failed to trigger channel stack update");
                throw err;
            }
        }
    }

    /**
     * Actually start deletion of the channel stack. Will not start deletion if the MediaLive channel is still running.
     */
    async deleteChannelStack(cloudFormationStackArn: string, mediaLiveChannelId: string): Promise<boolean> {
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
            if (err.toString().includes(`Stack with id ${stackName} does not exist`)) {
                this.logger.info({ stackName, err }, "Channel stack does not exist - it has already been deleted.");
                await this.channelStackDeleteJobService.setStatusChannelStackDeleteJob(
                    cloudFormationStackArn,
                    Job_Queues_JobStatus_Enum.Completed,
                    null
                );
                return false;
            } else {
                this.logger.error({ stackName, err }, "Failed to get channel stack description");
                throw err;
            }
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
            return true;
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
            return true;
        }
    }

    public async processChannelStackUpdateJobs(): Promise<void> {
        const newJobs = await this.channelStackUpdateJobService.getNewChannelStackUpdateJobs();

        for (const job of newJobs) {
            try {
                const inProgress = await this.updateChannelStack(
                    job.cloudFormationStackArn,
                    job.mediaLiveChannelId,
                    job.newRtmpOutputUri,
                    job.newRtmpOutputStreamKey
                );
                if (inProgress) {
                    await this.channelStackUpdateJobService.setStatusChannelStackUpdateJob(
                        job.cloudFormationStackArn,
                        Job_Queues_JobStatus_Enum.InProgress,
                        null
                    );
                }
            } catch (err) {
                this.logger.error({ err }, "Failed to process new channel stack update job");
            }
        }

        const oldJobs = await this.channelStackUpdateJobService.getStuckChannelStackUpdateJobs();

        for (const job of oldJobs) {
            try {
                this.logger.error({ job }, "Channel stack update job seems to be stuck, marking it as failed");
                await this.channelStackUpdateJobService.setStatusChannelStackUpdateJob(
                    job.cloudFormationStackArn,
                    Job_Queues_JobStatus_Enum.Failed,
                    "Job got stuck"
                );
            } catch (err) {
                this.logger.error({ err }, "Failed to update stuck channel stack update job");
            }
        }
    }

    public async processChannelStackDeleteJobs(): Promise<void> {
        const newJobs = await this.channelStackDeleteJobService.getNewChannelStackDeleteJobs();

        for (const job of newJobs) {
            try {
                const inProgress = await this.deleteChannelStack(job.cloudFormationStackArn, job.mediaLiveChannelId);
                if (inProgress) {
                    await this.channelStackDeleteJobService.setStatusChannelStackDeleteJob(
                        job.cloudFormationStackArn,
                        Job_Queues_JobStatus_Enum.InProgress,
                        null
                    );
                }
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
                    Job_Queues_JobStatus_Enum.Failed,
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
