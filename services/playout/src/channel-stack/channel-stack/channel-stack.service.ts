import { App } from "@aws-cdk/core";
import { DescribeStacksCommandOutput, StackStatus } from "@aws-sdk/client-cloudformation";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import parseArn from "@unbounce/parse-aws-arn";
import assert from "assert";
import { DeployStackResult } from "aws-cdk/lib/api/deploy-stack";
import { AwsService } from "../../aws/aws.service";
import { CloudFormationService } from "../../aws/cloud-formation/cloud-formation.service";
import { MediaLiveChannelService } from "../../hasura-data/media-live-channel/media-live-channel.service";
import { shortId } from "../../utils/id";
import { ChannelStackCreateJobService } from "../channel-stack-create-job/channel-stack-create-job.service";
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
        private mediaLiveChannelService: MediaLiveChannelService
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
        await this.mediaLiveChannelService.createMediaLiveChannel(
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

        function findOutput(key: string): string {
            assert(description.Stacks);
            const value = description.Stacks[0].Outputs?.find((x) => x.OutputKey === key)?.OutputValue;
            assert(value, `Could not find output with key '${key}'`);
            return value;
        }

        const rtmpAInputUri = findOutput("RtmpAInputUri");
        const rtmpAInputId = findOutput("RtmpAInputId");
        const rtmpBInputUri = findOutput("RtmpBInputUri");
        const rtmpBInputId = findOutput("RtmpBInputId");
        const mp4InputId = findOutput("Mp4InputId");
        const loopingMp4InputId = findOutput("LoopingMp4InputId");
        const mp4InputAttachmentName = findOutput("Mp4InputAttachmentName");
        const loopingMp4InputAttachmentName = findOutput("LoopingMp4InputAttachmentName");
        const rtmpAInputAttachmentName = findOutput("RtmpAInputAttachmentName");
        const rtmpBInputAttachmentName = findOutput("RtmpBInputAttachmentName");
        const mediaLiveChannelId = findOutput("MediaLiveChannelId");
        const mediaPackageChannelId = findOutput("MediaPackageChannelId");
        const cloudFrontDistributionId = findOutput("CloudFrontDistributionId");
        const cloudFrontDomain = findOutput("CloudFrontDomain");
        const endpointUri = findOutput("EndpointUri");

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
        };
    }

    public async createNewChannelStack(
        roomId: string,
        roomName: string,
        conferenceId: string,
        stackLogicalResourceId: string
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

    public async deleteChannelStacksByArn(stackArn: string): Promise<void> {
        const mediaLiveChannelIds = await this.mediaLiveChannelService.findMediaLiveChannelsByStackArn(stackArn);

        for (const mediaLiveChannelId of mediaLiveChannelIds) {
            await this.deleteChannelStack(mediaLiveChannelId);
        }
    }

    /**
     * @summary Deletes the MediaLiveChannel and starts teardown of the channel CloudFormation stack (does not await completion)
     */
    public async deleteChannelStack(mediaLiveChannelId: string): Promise<void> {
        this.logger.info({ mediaLiveChannelId }, "Deleting channel stack");
        const { cloudFormationStackArn } = await this.mediaLiveChannelService.deleteMediaLiveChannel(
            mediaLiveChannelId
        );

        if (!cloudFormationStackArn) {
            this.logger.info({ mediaLiveChannelId }, "Channel had empty stackArn record, skipping teardown");
            return;
        }

        this.logger.info({ mediaLiveChannelId }, "Deleting channel stack record, now tearing down stack");

        const arn = parseArn(cloudFormationStackArn);
        const stackName = arn.resourceId?.split("/")[0];
        let description: DescribeStacksCommandOutput;
        try {
            description = await this.cloudFormationService.cloudFormation.describeStacks({
                StackName: stackName,
            });
        } catch (e) {
            this.logger.error({ stackName, err: e }, "Failed to get channel stack description");
            throw e;
        }

        if (!description.Stacks || description.Stacks.length === 0) {
            this.logger.info({ cloudFormationStackArn, mediaLiveChannelId }, "No channel stack found, skipping");
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
        } else {
            this.logger.info({ cloudFormationStackArn, mediaLiveChannelId }, "Starting channel stack teardown");
            try {
                await this.cloudFormationService.cloudFormation.deleteStack({
                    StackName: stackName,
                });
            } catch (e) {
                this.logger.error({ stackName, err: e }, "Failed to trigger channel stack teardown");
                throw e;
            }
        }
    }
}
