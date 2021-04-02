import { gql } from "@apollo/client/core";
import { StackStatus } from "@aws-sdk/client-cloudformation";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { add, sub } from "date-fns";
import { CloudFormationService } from "../../aws/cloud-formation/cloud-formation.service";
import { GetObsoleteChannelStacksDocument, GetRoomsNeedingChannelStackDocument } from "../../generated/graphql";
import { GraphQlService } from "../../hasura/graphql.service";
import { shortId } from "../../utils/id";
import { ChannelStackCreateJobService } from "../channel-stack-create-job/channel-stack-create-job.service";
import { ChannelsService } from "../channels/channels.service";
import { MediaLiveChannelService } from "../media-live-channel/media-live-channel.service";

@Injectable()
export class ChannelSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private cloudFormationService: CloudFormationService,
        private graphQlService: GraphQlService,
        private channelStackCreateJobService: ChannelStackCreateJobService,
        private mediaLiveChannelService: MediaLiveChannelService,
        private channelsService: ChannelsService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    private syncInProgress = false;

    public async syncChannelStacks(): Promise<void> {
        this.logger.info("Syncing channel stacks");
        if (!this.syncInProgress) {
            this.syncInProgress = true;
            try {
                await this.ensureChannelStacksCreated();
            } catch (e) {
                this.logger.error(e, "Failure while ensuring channel stacks created");
            }
            try {
                await this.ensureOldChannelStacksDestroyed();
            } catch (e) {
                this.logger.error(e, "Failure while ensuring old channel stacks destroyed");
            }
            try {
                await this.pollOldChannelStackCreateJobs();
            } catch (e) {
                this.logger.error(e, "Failure while polling potentially-stuck channel stack create jobs");
            }
            this.syncInProgress = false;
        } else {
            this.logger.info("Channel sync already in progress, skipping");
        }
    }

    public async getRoomsNeedingChannelStack(): Promise<{ roomId: string; roomName: string; conferenceId: string }[]> {
        const now = new Date();
        const future = add(now, { hours: 1 });

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
        const past = sub(new Date(), { hours: 24 });

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
            this.logger.info({ rooms: roomsNeedingChannelStack }, "Found rooms that need a channel stack");
        }

        for (const roomNeedingChannelStack of roomsNeedingChannelStack) {
            this.logger.info(
                {
                    roomId: roomNeedingChannelStack.roomId,
                    roomName: roomNeedingChannelStack.roomName,
                },
                "Creating channel stack"
            );
            const stackLogicalResourceId = `room-${shortId(10)}`;

            const jobId = await this.channelStackCreateJobService.createChannelStackCreateJob(
                roomNeedingChannelStack.roomId,
                roomNeedingChannelStack.conferenceId,
                stackLogicalResourceId
            );
            this.channelsService
                .createNewChannelStack(
                    roomNeedingChannelStack.roomId,
                    roomNeedingChannelStack.roomName,
                    roomNeedingChannelStack.conferenceId,
                    stackLogicalResourceId
                )
                .catch(async (e) => {
                    this.logger.error(
                        e,
                        {
                            roomId: roomNeedingChannelStack.roomId,
                            conferenceId: roomNeedingChannelStack.conferenceId,
                        },
                        "Failed to create channel stack"
                    );
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
                this.logger.info({ obsoleteChannelStack }, "Deleting obsolete channel stack");
                await this.channelsService.deleteChannelStack(obsoleteChannelStack.mediaLiveChannelId);
            } catch (e) {
                this.logger.error({ obsoleteChannelStack, err: e }, "Failed to clean up an obsolete channel stack");
            }
        }
    }

    public async pollOldChannelStackCreateJobs(): Promise<void> {
        this.logger.info("Polling status of old channel stack create jobs");

        const oldJobs = await this.channelStackCreateJobService.findPotentiallyStuckChannelStackCreateJobs();

        for (const oldJob of oldJobs) {
            try {
                this.logger.info({ oldJob }, "Polling status of a potentially stuck channel stack create job");
                const stack = await this.cloudFormationService.getStackStatus(oldJob.stackLogicalResourceId);
                if (!stack) {
                    this.logger.warn({ oldJob }, "Could not retrieve status of a channel stack create job");
                } else if (
                    [StackStatus.CREATE_COMPLETE as string, StackStatus.UPDATE_COMPLETE].includes(stack.stackStatus)
                ) {
                    await this.channelsService.handleCompletedChannelStack(oldJob.stackLogicalResourceId, stack.arn);
                }
            } catch (e) {
                this.logger.error({ err: e, oldJob }, "Failed to poll status of stuck channel stack create job");
            }
        }
    }
}
