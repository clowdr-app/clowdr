import { SNS } from "@aws-sdk/client-sns";
import type { Credentials as NewSdkCredentials } from "@aws-sdk/types";
import type { Bunyan } from "@eropple/nestjs-bunyan/dist";
import { RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import assert from "assert";
import { AWS_MODULE_OPTIONS } from "../../constants";
import type { AwsModuleOptions } from "../aws.module";

export class SnsService {
    private readonly logger: Bunyan;

    private readonly credentials: NewSdkCredentials;
    private readonly region: string;
    private _sns: SNS;

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
        this._sns = new SNS({
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

    public async subscribeToTopic(topicArn: string, pathname: string): Promise<void> {
        const hostUrl = this.getHostUrl();
        const endpoint = new URL(hostUrl);
        endpoint.pathname = pathname;
        const hostSecureProtocols = this.configService.get<string>("HOST_SECURE_PROTOCOLS") !== "false";

        await this._sns.subscribe({
            Protocol: hostSecureProtocols ? "https" : "http",
            TopicArn: topicArn,
            Endpoint: endpoint.toString(),
        });
    }
}
