import { Module } from "@nestjs/common";
import { ChannelStackModule } from "../channel-stack/channel-stack.module";
import { ChannelStatusService } from "./channel-status.service";

@Module({
    providers: [ChannelStatusService],
    imports: [ChannelStackModule],
    exports: [],
})
export class ChannelStatusModule {}
