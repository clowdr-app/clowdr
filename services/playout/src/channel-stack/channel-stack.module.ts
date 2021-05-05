import { Module } from "@nestjs/common";
import { ChannelStackSyncService } from "./channel-stack-sync/channel-stack-sync.service";
import { ChannelStackService } from "./channel-stack/channel-stack.service";

@Module({
    providers: [ChannelStackService, ChannelStackSyncService],
    imports: [],
    exports: [ChannelStackService, ChannelStackSyncService],
})
export class ChannelStackModule {}
