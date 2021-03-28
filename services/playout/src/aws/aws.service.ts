import { App } from "@aws-cdk/core";
import { CloudFront } from "@aws-sdk/client-cloudfront";
import { ElasticTranscoder } from "@aws-sdk/client-elastic-transcoder";
import { IAM } from "@aws-sdk/client-iam";
import { MediaLive } from "@aws-sdk/client-medialive";
import { MediaPackage } from "@aws-sdk/client-mediapackage";
import { Credentials as NewSdkCredentials } from "@aws-sdk/types";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import assert from "assert";
import { SdkProvider } from "aws-cdk/lib/api/aws-auth";
import { CloudFormationDeployments } from "aws-cdk/lib/api/cloudformation-deployments";
import AWS, { CredentialProviderChain } from "aws-sdk";
import * as Bunyan from "bunyan";
import { customAlphabet } from "nanoid";
import { AWS_MODULE_OPTIONS } from "../constants";
import { AwsModuleOptions } from "./aws.module";
import { ChannelStack, ChannelStackProps } from "./channelStack";

@Injectable()
export class AwsService {
    private readonly logger: Bunyan;

    private readonly credentials: NewSdkCredentials;
    private readonly iam: IAM;
    private readonly elasticTranscoder: ElasticTranscoder;
    private readonly mediaLive: MediaLive;
    private readonly mediaPackage: MediaPackage;
    private readonly cloudFront: CloudFront;

    constructor(
        @RootLogger() logger: Bunyan,
        @Inject(AWS_MODULE_OPTIONS) config: AwsModuleOptions,
        private configService: ConfigService
    ) {
        this.logger = logger.child({ component: this.constructor.name });

        this.credentials = config.credentials;
        const region = config.region;

        this.iam = new IAM({
            apiVersion: "2010-05-08",
            credentials: this.credentials,
            region,
        });

        this.elasticTranscoder = new ElasticTranscoder({
            apiVersion: "2012-09-25",
            credentials: this.credentials,
            region,
        });

        this.mediaLive = new MediaLive({
            apiVersion: "2017-10-14",
            credentials: this.credentials,
            region,
        });

        this.mediaPackage = new MediaPackage({
            apiVersion: "2017-10-14",
            credentials: this.credentials,
            region,
        });

        this.cloudFront = new CloudFront({
            apiVersion: "2020-05-31",
            credentials: this.credentials,
            region,
        });
    }

    public shortId(length = 5): string {
        return customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", length)();
    }

    public async createNewChannelStack(roomId: string): Promise<void> {
        const awsPrefix = this.configService.get<string>("AWS_PREFIX");
        assert(awsPrefix, "Missing AWS_PREFIX");
        const inputSecurityGroupId = this.configService.get<string>("AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID");
        assert(inputSecurityGroupId, "Missing AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID");
        const region = this.configService.get<string>("AWS_REGION");
        assert(region, "Missing AWS_REGION");
        const account = this.configService.get<string>("AWS_ACCOUNT_ID");
        assert(account, "Missing AWS_ACCOUNT_ID");

        const options: ChannelStackProps = {
            awsPrefix,
            generateId: this.shortId,
            inputSecurityGroupId,
            roomId,
            tags: {
                roomId,
            },
            env: {
                account,
                region,
            },
            description: `Broadcast channel stack for room ${roomId}`,
        };

        this.logger.info("Starting deployment");
        const app = new App();
        const stack = new ChannelStack(app, `${awsPrefix}-room-${this.shortId()}`, options);

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
        const deployResultPromise = cloudFormation.deployStack({
            stack: stackArtifact,
        });
        const result = await deployResultPromise;
        this.logger.info({
            msg: "Finished deploying",
            stackArn: result.stackArn,
            outputs: result.outputs,
        });
    }
}
