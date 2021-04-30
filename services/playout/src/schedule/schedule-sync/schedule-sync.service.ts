import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { MediaLiveService } from "../../aws/medialive/medialive.service";
import { GraphQlService } from "../../hasura-data/graphql/graphql.service";
import { MediaLiveChannelService } from "../../hasura-data/media-live-channel/media-live-channel.service";
import { ScheduleService } from "../../hasura-data/schedule/schedule.service";

export class ScheduleSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private graphQlService: GraphQlService,
        private mediaLiveService: MediaLiveService,
        private mediaLiveChannelService: MediaLiveChannelService,
        private scheduleService: ScheduleService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async fullScheduleSync(): Promise<void> {
        this.logger.info("Fully syncing channel schedules");
    }

    public async syncChannelSchedule(roomId: string): Promise<void> {
        this.logger.info({ roomId }, "Syncing channel schedule");

        const channelDetails = await this.mediaLiveChannelService.getChannelStackDetails(roomId);

        if (!channelDetails) {
            this.logger.warn({ roomId }, "No MediaLive channel found for room. Skipping schedule sync.");
            return;
        }

        const channelStatus = await this.mediaLiveService.getChannelState(channelDetails.mediaLiveChannelId);

        if (!channelStatus) {
            this.logger.warn(
                { roomId, mediaLiveChannelId: channelDetails.mediaLiveChannelId },
                "Could not retrieve status of MediaLive channel. Skipping schedule sync."
            );
            return;
        }

        if (!["IDLE", "RUNNING"].includes(channelStatus)) {
            this.logger.warn(
                { roomId, mediaLiveChannelId: channelDetails.mediaLiveChannelId, channelStatus },
                "Channel status precludes schedule sync. Skipping schedule sync."
            );
        }
    }

    public async computeExpectedSchedule(roomId: string): Promise<void> {
        const scheduleData = await this.scheduleService.getScheduleData(roomId);
    }
}
