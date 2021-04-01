import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { AwsService } from "../aws/aws.service";
import { GetObsoleteChannelStacksDocument, GetRoomsNeedingChannelStackDocument } from "../generated/graphql";
import { ChannelStackCreateJobService } from "../hasura/channel-stack-create-job/channel-stack-create-job.service";
import { GraphQlService } from "../hasura/graphql.service";
import { MediaLiveChannelService } from "../hasura/media-live-channel/media-live-channel.service";
import { shortId } from "../utils/id";

@Injectable()
export class ChannelSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private awsService: AwsService,
        private graphQlService: GraphQlService,
        private channelStackCreateJobService: ChannelStackCreateJobService,
        private mediaLiveChannelService: MediaLiveChannelService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    private syncInProgress = false;

    public async syncChannelStacks(): Promise<void> {
        this.logger.info("Syncing channel stacks");
        if (!this.syncInProgress) {
            this.syncInProgress = true;
            await this.ensureChannelStacksCreated();
            await this.ensureOldChannelStacksDestroyed();
            this.syncInProgress = false;
        } else {
            this.logger.info("Channel sync already in progress, skipping");
        }
    }

    public async getRoomsNeedingChannelStack(): Promise<{ roomId: string; roomName: string; conferenceId: string }[]> {
        const now = new Date();
        const future = new Date(now.getTime() + 60 * 60 * 1000);

        gql`
            query GetRoomsNeedingChannelStack($now: timestamptz, $future: timestamptz) {
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
            query: GetRoomsNeedingChannelStackDocument,
            variables: {
                now: now.toISOString(),
                future: future.toISOString(),
            },
        });

        return result.data.Room;
    }

    public async getObsoleteChannelStacks(): Promise<
        { mediaLiveChannelId: string; cloudFormationStackArn?: string | null }[]
    > {
        gql`
            query GetObsoleteChannelStacks($past: timestamptz) {
                MediaLiveChannel(
                    where: {
                        _or: [
                            {
                                _not: {
                                    room: {
                                        events: {
                                            endTime: { _gte: $past }
                                            intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                                        }
                                    }
                                }
                            }
                            { roomId: { _is_null: true } }
                        ]
                    }
                ) {
                    mediaLiveChannelId: id
                    cloudFormationStackArn
                }
            }
        `;

        // Look for rooms that have no events ending since at least 24 hours ago
        const past = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

        const result = await this.graphQlService.apolloClient.query({
            query: GetObsoleteChannelStacksDocument,
            variables: {
                past: past.toISOString(),
            },
        });

        return result.data.MediaLiveChannel;
    }

    public async ensureChannelStacksCreated(): Promise<void> {
        this.logger.info("Ensuring channel stacks are created for rooms with upcoming events");

        const roomsNeedingChannelStack = await this.getRoomsNeedingChannelStack();

        if (roomsNeedingChannelStack.length > 0) {
            this.logger.info({ msg: "Found rooms that need a channel stack", rooms: roomsNeedingChannelStack });
        }

        for (const roomNeedingChannelStack of roomsNeedingChannelStack) {
            this.logger.info({
                msg: "Creating channel stack",
                roomId: roomNeedingChannelStack.roomId,
                roomName: roomNeedingChannelStack.roomName,
            });
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

    public async ensureOldChannelStacksDestroyed(): Promise<void> {
        this.logger.info("Ensuring old channel stacks are destroyed");

        const obsoleteChannelStacks = await this.getObsoleteChannelStacks();

        if (obsoleteChannelStacks.length > 0) {
            this.logger.info({ channelStacks: obsoleteChannelStacks }, "Found obsolete channels stacks");
        }

        for (const obsoleteChannelStack of obsoleteChannelStacks) {
            try {
                if (obsoleteChannelStack.cloudFormationStackArn) {
                    this.logger.info({ obsoleteChannelStack }, "Deleting channel stack");
                    const alreadyDeleted = await this.awsService.deleteChannelStack(
                        obsoleteChannelStack.cloudFormationStackArn
                    );
                    if (alreadyDeleted) {
                        this.logger.info({ obsoleteChannelStack }, "Channel stack is already deleted, removing record");
                        await this.mediaLiveChannelService.deleteMediaLiveChannel(
                            obsoleteChannelStack.mediaLiveChannelId
                        );
                    }
                } else {
                    this.logger.info({ obsoleteChannelStack }, "No known Arn for channel stack, removing record");
                    await this.mediaLiveChannelService.deleteMediaLiveChannel(obsoleteChannelStack.mediaLiveChannelId);
                }
            } catch (e) {
                this.logger.error({ obsoleteChannelStack, err: e }, "Failed to clean up an obsolete channel stack");
            }
        }
    }
}
