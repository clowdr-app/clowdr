import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ChannelStackModule } from "../channel-stack/channel-stack.module";
import { SnsNotificationMiddleware } from "./sns-notification.middleware";
import { SnsController } from "./sns.controller";

@Module({
    imports: [ChannelStackModule],
    controllers: [SnsController],
})
export class SnsModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer.apply(SnsNotificationMiddleware).forRoutes(SnsController);
    }
}
