import type { Bunyan} from "@eropple/nestjs-bunyan";
import { RootLogger } from "@eropple/nestjs-bunyan";
import type { DynamicModule, FactoryProvider, ModuleMetadata } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import assert from "assert";
import { AWS_MODULE_OPTIONS } from "../constants";
import { AwsService } from "./aws.service";
import { CloudFormationService } from "./cloud-formation/cloud-formation.service";
import { MediaLiveService } from "./medialive/medialive.service";
import { SnsService } from "./sns/sns.service";

export type AwsModuleOptions = {
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    };
    prefix: string;
    region: string;
    mediaLiveServiceRoleArn: string;
};

@Global()
@Module({
    providers: [AwsService, CloudFormationService, MediaLiveService, SnsService],
    exports: [AwsService, CloudFormationService, MediaLiveService, SnsService],
})
export class AwsModule {
    static forRoot(config: AwsModuleOptions): DynamicModule {
        return {
            module: AwsModule,
            imports: [],
            providers: [
                AwsService,
                {
                    provide: AWS_MODULE_OPTIONS,
                    useValue: config,
                },
            ],
            exports: [AwsService],
        };
    }

    static forRootAsync(
        config: Omit<FactoryProvider<AwsModuleOptions | Promise<AwsModuleOptions>>, "provide"> &
            Pick<ModuleMetadata, "imports">
    ): DynamicModule {
        return {
            module: AwsModule,
            imports: config.imports ?? [],
            providers: [
                AwsService,
                {
                    provide: AWS_MODULE_OPTIONS,
                    useFactory: config.useFactory,
                    inject: config.inject,
                },
            ],
            exports: [AwsService],
        };
    }

    private readonly logger: Bunyan;

    constructor(private snsService: SnsService, @RootLogger() logger: Bunyan, private configService: ConfigService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    async onModuleInit(): Promise<void> {
        this.logger.info("Subscribing to CloudFormation SNS notifications");
        const cloudFormationNotificationsTopicArn = this.configService.get<string>(
            "AWS_CLOUDFORMATION_NOTIFICATIONS_TOPIC_ARN"
        );
        assert(cloudFormationNotificationsTopicArn, "Missing AWS_CLOUDFORMATION_NOTIFICATIONS_TOPIC_ARN");
        await this.snsService.subscribeToTopic(cloudFormationNotificationsTopicArn, "/aws/cloudformation/notify");

        this.logger.info("Subscribing to MediaLive SNS notifications");
        const mediaLiveNotificationsTopicArn = this.configService.get<string>("AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN");
        assert(mediaLiveNotificationsTopicArn, "Missing AWS_MEDIALIVE_NOTIFICATIONS_TOPIC_ARN");
        await this.snsService.subscribeToTopic(mediaLiveNotificationsTopicArn, "/aws/medialive/notify");
    }
}
