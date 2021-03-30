import { Module } from "@nestjs/common";
import { ChannelSyncService } from "./channel-sync.service";

@Module({
    providers: [ChannelSyncService],
    imports: [],
    exports: [ChannelSyncService],
})
export class ChannelSyncModule {}
