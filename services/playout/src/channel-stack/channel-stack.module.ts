import { Module } from "@nestjs/common";
import { ChannelStackCreateJobService } from "./channel-stack-create-job/channel-stack-create-job.service";
import { ChannelStackSyncService } from "./channel-stack-sync/channel-stack-sync.service";
import { ChannelStackService } from "./channel-stack/channel-stack.service";
import { MediaLiveChannelService } from "./media-live-channel/media-live-channel.service";

@Module({
    providers: [ChannelStackService, ChannelStackSyncService, ChannelStackCreateJobService, MediaLiveChannelService],
    imports: [],
    exports: [ChannelStackService, ChannelStackSyncService],
})
export class ChannelStackModule {}
