import { LoggingModule } from "@eropple/nestjs-bunyan";
import { HasuraModule } from "@golevelup/nestjs-hasura";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ROOT_LOGGER } from "./logger";

@Module({
    imports: [
        ConfigModule.forRoot(),
        LoggingModule.forRoot(ROOT_LOGGER, {
            dropHeaders: ["x-hasura-event-secret"],
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
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
