import { LoggingModule } from "@eropple/nestjs-bunyan";
import { HasuraModule } from "@golevelup/nestjs-hasura";
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import assert from "assert";
import { v4 as uuidv4 } from "uuid";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AwsModule, AwsModuleOptions } from "./aws/aws.module";
import { ChannelsModule } from "./channels/channels.module";
import { HasuraDataModule, HasuraDataModuleOptions } from "./hasura/hasura-data.module";
import { JsonBodyMiddleware } from "./json-body.middleware";
import { ROOT_LOGGER } from "./logger";
import { SnsModule } from "./sns/sns.module";
import { TextBodyMiddleware } from "./text-body.middleware";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggingModule.forRoot(ROOT_LOGGER, {
            dropHeaders: ["x-hasura-event-secret"],
            correlationIdHeader: "x-b3-traceid",
        }),
        HasuraModule.forRootAsync(HasuraModule, {
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                webhookConfig: {
                    secretFactory: configService.get<string>("EVENT_SECRET") ?? uuidv4(),
                    secretHeader: "x-hasura-event-secret",
                },
            }),
            inject: [ConfigService],
        }),
        AwsModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const accessKeyId = configService.get<string>("AWS_ACCESS_KEY_ID");
                assert(accessKeyId, "Missing AWS_ACCESS_KEY_ID");
                const secretAccessKey = configService.get<string>("AWS_SECRET_ACCESS_KEY");
                assert(secretAccessKey, "Missing AWS_SECRET_ACCESS_KEY");
                const region = configService.get<string>("AWS_REGION");
                assert(region, "Missing AWS_REGION");

                const config: AwsModuleOptions = {
                    credentials: {
                        accessKeyId,
                        secretAccessKey,
                    },
                    mediaLiveServiceRoleArn: "",
                    prefix: "",
                    region,
                };
                return config;
            },
            inject: [ConfigService],
        }),
        HasuraDataModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const useSecureProtocols = configService.get<string>("GRAPHQL_API_SECURE_PROTOCOLS") !== "false";
                const graphQlApiDomain = configService.get<string>("GRAPHQL_API_DOMAIN");
                assert(graphQlApiDomain, "Missing GRAPHQL_API_DOMAIN");
                const hasuraAdminSecret = configService.get<string>("HASURA_ADMIN_SECRET");
                assert(hasuraAdminSecret, "Missing HASURA_ADMIN_SECRET");
                const config: HasuraDataModuleOptions = {
                    graphQlApiDomain,
                    useSecureProtocols,
                    hasuraAdminSecret,
                };
                return config;
            },
            inject: [ConfigService],
        }),
        ChannelsModule,
        SnsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(TextBodyMiddleware)
            .forRoutes({
                path: "/aws/cloudformation/notify",
                method: RequestMethod.POST,
            })
            .apply(JsonBodyMiddleware)
            .forRoutes("*");
    }
}
