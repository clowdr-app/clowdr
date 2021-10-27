import { gql } from "@apollo/client/core";
import { StackStatus } from "@aws-sdk/client-cloudformation";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { add, sub } from "date-fns";
import { CloudFormationService } from "../../aws/cloud-formation/cloud-formation.service";
import {
    GetChannelStacksThatMightNeedUpdateDocument,
    GetObsoleteChannelStacksDocument,
    GetRoomsNeedingChannelStackDocument,
} from "../../generated/graphql";
import { ChannelStackCreateJobService } from "../../hasura-data/channel-stack-create-job/channel-stack-create-job.service";
import { GraphQlService } from "../../hasura-data/graphql/graphql.service";
import { shortId } from "../../utils/id";
import { ChannelStackService } from "../channel-stack/channel-stack.service";

@Injectable()
export class ChannelStackSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private cloudFormationService: CloudFormationService,
        private graphQlService: GraphQlService,
        private channelStackCreateJobService: ChannelStackCreateJobService,
        private channelsService: ChannelStackService
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
            try {
                await this.ensureChannelStacksUpdated();
            } catch (e) {
                this.logger.error(e, "Failure while ensuring channel stacks updated");
            }
            this.syncInProgress = false;
        } else {
            this.logger.info("Channel sync already in progress, skipping");
        }
    }

    public async getRoomsNeedingChannelStack(): Promise<
        {
            roomId: string;
            roomName: string;
            conferenceId: string;
            rtmpOutputUrl: string | undefined;
            rtmpOutputStreamKey: string | undefined;
        }[]
    > {
        const now = new Date();
        const future = add(now, { hours: 1 });

        gql`
            query GetRoomsNeedingChannelStack($now: timestamptz, $future: timestamptz) {
                room_Room(
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
                                { channelStack: {} }
                            ]
                        }
                    }
                ) {
                    id
                    conferenceId
                    name
                    rtmpOutput {
                        id
                        url
                        streamKey
                    }
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

        return result.data.room_Room.map((room) => ({
            conferenceId: room.conferenceId,
            roomId: room.id,
            roomName: room.name,
            rtmpOutputUrl: room.rtmpOutput?.url,
            rtmpOutputStreamKey: room.rtmpOutput?.streamKey,
        }));
    }

    public async getObsoleteChannelStacks(): Promise<
        { channelStackId: string; cloudFormationStackArn?: string | null; mediaLiveChannelId: string }[]
    > {
        gql`
            query GetObsoleteChannelStacks($past: timestamptz) {
                video_ChannelStack(
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
                    channelStackId: id
                    cloudFormationStackArn
                    mediaLiveChannelId
                }
            }
        `;

        // Look for rooms that have no events ending since at least 6 hours ago
        const past = sub(new Date(), { hours: 6 });

        const result = await this.graphQlService.apolloClient.query({
            query: GetObsoleteChannelStacksDocument,
            variables: {
                past: past.toISOString(),
            },
        });

        return result.data.video_ChannelStack;
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
                    stackLogicalResourceId,
                    roomNeedingChannelStack.rtmpOutputUrl,
                    roomNeedingChannelStack.rtmpOutputStreamKey
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
                await this.channelsService.startChannelStackDeletion(
                    obsoleteChannelStack.channelStackId,
                    obsoleteChannelStack.mediaLiveChannelId
                );
            } catch (e) {
                this.logger.error({ obsoleteChannelStack, err: e }, "Failed to clean up an obsolete channel stack");
            }
        }

        await this.channelsService.processChannelStackDeleteJobs();
    }

    public async pollOldChannelStackCreateJobs(): Promise<void> {
        this.logger.info("Polling status of old channel stack create jobs");

        const oldJobs = await this.channelStackCreateJobService.findPotentiallyStuckChannelStackCreateJobs();

        for (const oldJob of oldJobs) {
            try {
                this.logger.info({ oldJob }, "Polling status of a potentially stuck channel stack");
                const stack = await this.cloudFormationService.getStackStatus(oldJob.stackLogicalResourceId);
                if (!stack) {
                    this.logger.warn({ oldJob }, "Could not retrieve status of a channel stack");
                } else if (
                    [StackStatus.CREATE_COMPLETE as string, StackStatus.UPDATE_COMPLETE].includes(stack.stackStatus)
                ) {
                    await this.channelsService.handleCompletedChannelStack(oldJob.stackLogicalResourceId, stack.arn);
                }
            } catch (e) {
                this.logger.error({ err: e, oldJob }, "Failed to poll status of stuck channel stack");
            }
        }
    }

    public async getChannelStacksNeedingUpdate(): Promise<
        { channelStackId: string; cloudFormationStackArn?: string | null; mediaLiveChannelId: string }[]
    > {
        gql`
            query GetChannelStacksThatMightNeedUpdate {
                video_ChannelStack(
                    where: {
                        _or: [
                            { channelStackCreateJobId: { _is_null: true } }
                            { channelStackCreateJob: { jobStatusName: { _nin: [NEW, IN_PROGRESS] } } }
                        ]
                        roomId: { _is_null: false }
                        _not: { channelStackUpdateJobs: { jobStatusName: { _in: [NEW, IN_PROGRESS] } } }
                    }
                ) {
                    id
                    cloudFormationStackArn
                    mediaLiveChannelId
                    rtmpOutputUri
                    rtmpOutputStreamKey
                    rtmpOutputDestinationId
                    room {
                        id
                        rtmpOutput {
                            id
                            url
                            streamKey
                        }
                    }
                }
            }
        `;

        const response = await this.graphQlService.apolloClient.query({
            query: GetChannelStacksThatMightNeedUpdateDocument,
        });

        return response.data.video_ChannelStack
            .filter(
                (stack) =>
                    stack.room &&
                    (stack.rtmpOutputUri != stack.room.rtmpOutput?.url ||
                        stack.rtmpOutputStreamKey != stack.room.rtmpOutput?.streamKey)
            )
            .map((stack) => ({
                channelStackId: stack.id,
                mediaLiveChannelId: stack.mediaLiveChannelId,
                cloudFormationStackArn: stack.cloudFormationStackArn,
            }));
    }

    public async ensureChannelStacksUpdated(): Promise<void> {
        this.logger.info("Ensuring channel stacks are updated");

        const channelStacksToUpdate = await this.getChannelStacksNeedingUpdate();

        if (channelStacksToUpdate.length > 0) {
            this.logger.info({ channelStacks: channelStacksToUpdate }, "Found channels stacks needing an update");
        }

        for (const channelStackToUpdate of channelStacksToUpdate) {
            try {
                this.logger.info({ channelStackToUpdate }, "Updating channel stack");
                await this.channelsService.startChannelStackUpdate(
                    channelStackToUpdate.channelStackId,
                    channelStackToUpdate.mediaLiveChannelId
                );
            } catch (e) {
                this.logger.error({ channelStackToUpdate, err: e }, "Failed to update channel stack");
            }
        }

        await this.channelsService.processChannelStackUpdateJobs();
    }
}
