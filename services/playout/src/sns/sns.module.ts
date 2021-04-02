import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ChannelsModule } from "../channels/channels.module";
import { SnsNotificationMiddleware } from "./sns-notification.middleware";
import { SnsController } from "./sns.controller";

@Module({
    imports: [ChannelsModule],
    controllers: [SnsController],
})
export class SnsModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer.apply(SnsNotificationMiddleware).forRoutes(SnsController);
    }
}
