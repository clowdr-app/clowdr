import type { MiddlewareConsumer, NestModule } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { ChannelStackModule } from "../channel-stack/channel-stack.module";
import { ScheduleModule } from "../schedule/schedule.module";
import { SnsNotificationMiddleware } from "./sns-notification.middleware";
import { SnsController } from "./sns.controller";

@Module({
    imports: [ChannelStackModule, ScheduleModule],
    controllers: [SnsController],
})
export class SnsModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer.apply(SnsNotificationMiddleware).forRoutes(SnsController);
    }
}
