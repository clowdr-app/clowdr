import { App, Stack } from "@aws-cdk/core";
import { SNS } from "@aws-sdk/client-sns";
import { Credentials as NewSdkCredentials } from "@aws-sdk/types";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import assert from "assert";
import { DeployStackResult, SdkProvider } from "aws-cdk";
import { CloudFormationDeployments } from "aws-cdk/lib/api/cloudformation-deployments";
import { CloudFormationStackArtifact } from "aws-cdk/node_modules/@aws-cdk/cx-api/lib/artifacts/cloudformation-artifact";
import AWS, { CredentialProviderChain } from "aws-sdk";
import * as Bunyan from "bunyan";
import { AWS_MODULE_OPTIONS } from "../constants";
import { AwsModuleOptions } from "./aws.module";

@Injectable()
export class AwsService implements OnModuleInit {
    private readonly logger: Bunyan;

    private readonly credentials: NewSdkCredentials;
    private readonly region: string;
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
        this.sns = new SNS({
            apiVersion: "2010-03-31",
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

    public async deployCdkStack(app: App, stack: Stack, notificationTopicArn: string): Promise<DeployStackResult> {
        const stackArtifact = app.synth().getStackByName(stack.stackName);
        const credentials = new AWS.Credentials({
            accessKeyId: this.credentials.accessKeyId,
            secretAccessKey: this.credentials.secretAccessKey,
        });
        const credentialProviderChain = new CredentialProviderChain();
        credentialProviderChain.providers.push(credentials);
        const sdkProvider = new SdkProvider(credentialProviderChain, this.region, {
            credentials,
        });
        const cloudFormation = new CloudFormationDeployments({ sdkProvider });
        return cloudFormation.deployStack({
            stack: (stackArtifact as unknown) as CloudFormationStackArtifact,
            notificationArns: [notificationTopicArn],
            quiet: true,
        });
    }
}
