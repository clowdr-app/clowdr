import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { AwsService } from "../aws/aws.service";

@Injectable()
export class ChannelSyncService {
    private readonly logger: Bunyan;
    constructor(@RootLogger() logger: Bunyan, private awsService: AwsService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    private syncInProgress = false;

    public async channelSync(): Promise<void> {
        this.logger.info("Channel Sync service");
        if (!this.syncInProgress) {
            this.syncInProgress = true;
            this.logger.info("Executing sync");

            await this.awsService.createNewChannelStack("myroom123");

            //this.syncInProgress = false;
        } else {
            this.logger.info("Channel sync already in progress, skipping");
        }
    }
}
