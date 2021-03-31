import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { AwsService } from "../aws/aws.service";
import { GetRoomsNeedingMediaLiveChannelDocument } from "../generated/graphql";
import { ChannelStackCreateJobService } from "../hasura/channel-stack-create-job/channel-stack-create-job.service";
import { GraphQlService } from "../hasura/graphql.service";
import { shortId } from "../utils/id";

@Injectable()
export class ChannelSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private awsService: AwsService,
        private graphQlService: GraphQlService,
        private channelStackCreateJobService: ChannelStackCreateJobService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    private syncInProgress = false;

    public async channelSync(): Promise<void> {
        this.logger.info("Channel Sync service");
        this.ensureChannelsCreated();
        if (!this.syncInProgress) {
            this.syncInProgress = true;
            this.logger.info("Executing sync");

            //this.syncInProgress = false;
        } else {
            this.logger.info("Channel sync already in progress, skipping");
        }
    }

    public async getRoomsNeedingChannelStack(): Promise<{ roomId: string; roomName: string; conferenceId: string }[]> {
        const now = new Date();
        const future = new Date(now.getTime() + 60 * 60 * 1000);

        gql`
            query GetRoomsNeedingMediaLiveChannel($now: timestamptz, $future: timestamptz) {
                Room(
                    where: {
                        events: {
                            intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                            _or: [
                                { startTime: { _gte: $now, _lte: $future } }
                                { startTime: { _lte: $now }, endTime: { _gte: $now } }
                            ]
                        }
                        _not: {
                            _or: [
                                { channelStackCreateJobs: { jobStatusName: { _in: [IN_PROGRESS, NEW] } } }
                                { mediaLiveChannel: {} }
                            ]
                        }
                    }
                ) {
                    roomId: id
                    conferenceId
                    roomName: name
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: GetRoomsNeedingMediaLiveChannelDocument,
            variables: {
                now: now.toISOString(),
                future: future.toISOString(),
            },
        });

        return result.data.Room;
    }

    public async ensureChannelsCreated(): Promise<void> {
        this.logger.info("Ensuring channels created for rooms with upcoming events");

        const roomsNeedingChannelStack = await this.getRoomsNeedingChannelStack();

        if (roomsNeedingChannelStack.length > 0) {
            this.logger.info({ msg: "Found rooms that need a channel stack", rooms: roomsNeedingChannelStack });
        }

        for (const roomNeedingChannelStack of roomsNeedingChannelStack) {
            const stackLogicalResourceId = `room-${shortId(10)}`;

            const jobId = await this.channelStackCreateJobService.createChannelStackCreateJob(
                roomNeedingChannelStack.roomId,
                roomNeedingChannelStack.conferenceId,
                stackLogicalResourceId
            );
            this.awsService
                .createNewChannelStack(
                    roomNeedingChannelStack.roomId,
                    roomNeedingChannelStack.roomName,
                    roomNeedingChannelStack.conferenceId,
                    stackLogicalResourceId
                )
                .catch(async (e) => {
                    this.logger.error(e, {
                        msg: "Failed to create channel stack",
                        roomId: roomNeedingChannelStack.roomId,
                        conferenceId: roomNeedingChannelStack.conferenceId,
                    });
                    await this.channelStackCreateJobService.failChannelStackCreateJob(jobId, JSON.stringify(e));
                });
        }
    }
}
