import { Module } from "@nestjs/common";
import { ChannelSyncService } from "./channel-sync.service";

@Module({
    providers: [ChannelSyncService],
    exports: [ChannelSyncService],
})
export class ChannelSyncModule {}
