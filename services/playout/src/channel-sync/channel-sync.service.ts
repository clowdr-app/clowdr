import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { AwsService } from "../aws/aws.service";
import { GetRoomsWithEventsStartingDocument } from "../generated/graphql";
import { GraphQlService } from "../hasura/graphql.service";

@Injectable()
export class ChannelSyncService {
    private readonly logger: Bunyan;
    constructor(@RootLogger() logger: Bunyan, private awsService: AwsService, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    private syncInProgress = false;

    public async channelSync(): Promise<void> {
        this.logger.info("Channel Sync service");
        if (!this.syncInProgress) {
            this.syncInProgress = true;
            this.logger.info("Executing sync");

            //await this.awsService.createNewChannelStack("myroom123");

            //this.syncInProgress = false;
        } else {
            this.logger.info("Channel sync already in progress, skipping");
        }
    }

    public async ensureChannelsCreated(): Promise<void> {
        this.logger.info("Ensuring channels created for rooms with upcoming events");
        const now = new Date();
        const from = now.toISOString();
        const to = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

        gql`
            query GetRoomsWithEventsStarting($from: timestamptz, $to: timestamptz) {
                Room(
                    where: {
                        events: {
                            startTime: { _gte: $from, _lte: $to }
                            intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                        }
                    }
                ) {
                    id
                    conferenceId
                    mediaLiveChannel {
                        id
                        mediaLiveChannelId
                    }
                }
            }
        `;

        const roomsResult = await this.graphQlService.apolloClient.query({
            query: GetRoomsWithEventsStartingDocument,
            variables: {
                from,
                to,
            },
        });
    }
}
