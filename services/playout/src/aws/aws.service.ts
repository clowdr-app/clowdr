import { App } from "@aws-cdk/core";
import { CloudFormation, StackStatus } from "@aws-sdk/client-cloudformation";
import { SNS } from "@aws-sdk/client-sns";
import { Credentials as NewSdkCredentials } from "@aws-sdk/types";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import parseArn from "@unbounce/parse-aws-arn";
import assert from "assert";
import { SdkProvider } from "aws-cdk/lib/api/aws-auth";
import { CloudFormationDeployments } from "aws-cdk/lib/api/cloudformation-deployments";
import { DeployStackResult } from "aws-cdk/lib/api/deploy-stack";
import AWS, { CredentialProviderChain } from "aws-sdk";
import * as Bunyan from "bunyan";
import { AWS_MODULE_OPTIONS } from "../constants";
import { shortId } from "../utils/id";
import { AwsModuleOptions } from "./aws.module";
import { ChannelStack, ChannelStackProps } from "./channelStack";

export interface ChannelStackDescription {
    rtmpAInputUri: string;
    rtmpAInputId: string;
    rtmpBInputUri: string;
    rtmpBInputId: string;
    mp4InputId: string;
    loopingMp4InputId: string;
    mp4InputAttachmentName: string;
    loopingMp4InputAttachmentName: string;
    rtmpAInputAttachmentName: string;
    rtmpBInputAttachmentName: string;
    mediaLiveChannelId: string;
    mediaPackageChannelId: string;
    cloudFrontDistributionId: string;
    cloudFrontDomain: string;
    endpointUri: string;
}

@Injectable()
export class AwsService implements OnModuleInit {
    private readonly logger: Bunyan;

    private readonly credentials: NewSdkCredentials;
    private readonly region: string;
    // private iam: IAM;
    // private elasticTranscoder: ElasticTranscoder;
    // private mediaLive: MediaLive;
    // private mediaPackage: MediaPackage;
    // private cloudFront: CloudFront;
    private cloudFormation: CloudFormation;
    private sns: SNS;

    constructor(
        @RootLogger() logger: Bunyan,
        @Inject(AWS_MODULE_OPTIONS) config: AwsModuleOptions,
        private configService: ConfigService
    ) {
        this.logger = logger.child({ component: this.constructor.name });

        this.credentials = config.credentials;
        this.region = config.region;
    }
    onModuleInit(): void {
        // this.iam = new IAM({
        //     apiVersion: "2010-05-08",
        //     credentials: this.credentials,
        //     region: this.region,
        // });

        // this.elasticTranscoder = new ElasticTranscoder({
        //     apiVersion: "2012-09-25",
        //     credentials: this.credentials,
        //     region: this.region,
        // });

        // this.mediaLive = new MediaLive({
        //     apiVersion: "2017-10-14",
        //     credentials: this.credentials,
        //     region: this.region,
        // });

        // this.mediaPackage = new MediaPackage({
        //     apiVersion: "2017-10-14",
        //     credentials: this.credentials,
        //     region: this.region,
        // });

        // this.cloudFront = new CloudFront({
        //     apiVersion: "2020-05-31",
        //     credentials: this.credentials,
        //     region: this.region,
        // });

        this.sns = new SNS({
            apiVersion: "2010-03-31",
            credentials: this.credentials,
            region: this.region,
        });

        this.cloudFormation = new CloudFormation({
            apiVersion: "2010-05-15",
            credentials: this.credentials,
            region: this.region,
        });
    }

    public getHostUrl(): string {
        const hostDomain = this.configService.get<string>("HOST_DOMAIN");
        assert(hostDomain, "Missing HOST_DOMAIN.");
        const hostSecureProtocols = this.configService.get<string>("HOST_SECURE_PROTOCOLS") !== "false";

        return `${hostSecureProtocols ? "https" : "http"}://${hostDomain}`;
    }

    public async subscribeToTopic(topicArn: string, endpointUri: string): Promise<void> {
        const hostSecureProtocols = this.configService.get<string>("HOST_SECURE_PROTOCOLS") !== "false";

        await this.sns.subscribe({
            Protocol: hostSecureProtocols ? "https" : "http",
            TopicArn: topicArn,
            Endpoint: endpointUri,
        });
    }

    public async describeChannelStack(stackName: string): Promise<ChannelStackDescription> {
        const description = await this.cloudFormation.describeStacks({
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
        };

        this.logger.info("Starting deployment");
        const app = new App();
        const stack = new ChannelStack(app, stackLogicalResourceId, options);

        const stackArtifact = app.synth().getStackByName(stack.stackName);
        const credentials = new AWS.Credentials({
            accessKeyId: this.credentials.accessKeyId,
            secretAccessKey: this.credentials.secretAccessKey,
        });
        const credentialProviderChain = new CredentialProviderChain();
        credentialProviderChain.providers.push(credentials);
        const sdkProvider = new SdkProvider(credentialProviderChain, region, {
            credentials,
        });
        const cloudFormation = new CloudFormationDeployments({ sdkProvider });
        return cloudFormation.deployStack({
            stack: stackArtifact,
            notificationArns: [cloudFormationNotificationsTopicArn],
            quiet: true,
        });
    }

    /**
     * @summary Starts deletion of the channel CloudFormation stack (does not await completion)
     * @param stackArn Arn of the CloudFormation stack to delete
     * @returns `true` if deletion is already complete
     */
    public async deleteChannelStack(stackArn: string): Promise<boolean> {
        this.logger.info({ msg: "Deleting channel stack", stackArn });
        const arn = parseArn(stackArn);

        const description = await this.cloudFormation.describeStacks({
            StackName: arn.resourceId,
        });

        if (!description.Stacks || description.Stacks.length === 0) {
            this.logger.info({ msg: "No channel stack found, reporting as already deleted", stackArn });
            return true;
        }

        const stack = description.Stacks[0];

        if (stack.StackStatus === StackStatus.DELETE_COMPLETE) {
            this.logger.info({ msg: "Channel stack deletion has already completed, reporting as deleted", stackArn });
            return true;
        }

        if (stack.StackStatus !== StackStatus.DELETE_IN_PROGRESS) {
            this.logger.info({ msg: "Channel stack can be deleted, starting", stackArn });
            await this.cloudFormation.deleteStack({
                StackName: arn.resourceId,
            });
            return false;
        }

        this.logger.info({ msg: "Channel stack deletion is already in progress, skipping", stackArn });
        return false;
    }
}
