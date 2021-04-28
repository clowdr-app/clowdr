import { Module } from "@nestjs/common";
import { ChannelStackCreateJobService } from "./channel-stack-create-job/channel-stack-create-job.service";
import { ChannelStackSyncService } from "./channel-sync/channel-sync.service";
import { ChannelsService } from "./channels/channels.service";
import { MediaLiveChannelService } from "./media-live-channel/media-live-channel.service";

@Module({
    providers: [ChannelsService, ChannelStackSyncService, ChannelStackCreateJobService, MediaLiveChannelService],
    imports: [],
    exports: [ChannelsService, ChannelStackSyncService],
})
export class ChannelsModule {}
