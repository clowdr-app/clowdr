import { gql } from "@apollo/client/core";
import type { Bunyan } from "@eropple/nestjs-bunyan";
import { RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import type { ChannelStackDescription } from "../../channel-stack/channel-stack/channelStack";
import {
    ChannelStack_CreateChannelStackDeleteJobDocument,
    ChannelStack_CreateChannelStackUpdateJobDocument,
    ChannelStack_DeleteDocument,
    ChannelStack_DetachDocument,
    ChannelStack_GetChannelStackCloudFormationStackArnDocument,
    ChannelStack_GetChannelStacksDocument,
    ChannelStack_GetFirstSyncableEventDocument,
    ChannelStack_UpdateJob_GetChannelStackDocument,
    CreateChannelStackDocument,
    FindChannelStacksByStackArnDocument,
    GetChannelStackByRoomDocument,
} from "../../generated/graphql";
import { ConferenceConfigurationService } from "../conference-configuration/conference-configuration.service";
import { GraphQlService } from "../graphql/graphql.service";
import type { ChannelStackDetails } from "./channel-stack-details";

@Injectable()
export class ChannelStackDataService {
    private logger: Bunyan;

    constructor(
        @RootLogger() logger: Bunyan,
        private graphQlService: GraphQlService,
        private conferenceConfigurationService: ConferenceConfigurationService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async getChannelStackDetails(roomId: string): Promise<ChannelStackDetails | null> {
        gql`
            query GetChannelStackByRoom($roomId: uuid!) {
                room_Room_by_pk(id: $roomId) {
                    id
                    conferenceId
                    channelStack {
                        id
                        mediaLiveChannelId
                        mp4InputAttachmentName
                        rtmpAInputAttachmentName
                        rtmpBInputAttachmentName
                        loopingMp4InputAttachmentName
                        rtmpRoomInputId
                        rtmpRoomInputAttachmentName
                    }
                }
            }
        `;
        const channelResult = await this.graphQlService.apolloClient.query({
            query: GetChannelStackByRoomDocument,
            variables: {
                roomId,
            },
        });

        if (!channelResult.data.room_Room_by_pk?.channelStack) {
            return null;
        }

        const fillerVideoKey = await this.getFillerVideoKey(channelResult.data.room_Room_by_pk.conferenceId);

        return {
            id: channelResult.data.room_Room_by_pk.channelStack.id,
            roomId,
            conferenceId: channelResult.data.room_Room_by_pk.conferenceId,
            mediaLiveChannelId: channelResult.data.room_Room_by_pk.channelStack.mediaLiveChannelId,
            mp4InputAttachmentName: channelResult.data.room_Room_by_pk.channelStack.mp4InputAttachmentName,
            rtmpAInputAttachmentName: channelResult.data.room_Room_by_pk.channelStack.rtmpAInputAttachmentName,
            rtmpBInputAttachmentName: channelResult.data.room_Room_by_pk.channelStack.rtmpBInputAttachmentName ?? null,
            loopingMp4InputAttachmentName:
                channelResult.data.room_Room_by_pk.channelStack.loopingMp4InputAttachmentName,
            fillerVideoKey,
            rtmpRoomInput:
                channelResult.data.room_Room_by_pk.channelStack.rtmpRoomInputId &&
                channelResult.data.room_Room_by_pk.channelStack.rtmpRoomInputAttachmentName
                    ? {
                          inputId: channelResult.data.room_Room_by_pk.channelStack.rtmpRoomInputId,
                          attachmentName: channelResult.data.room_Room_by_pk.channelStack.rtmpRoomInputAttachmentName,
                      }
                    : null,
        };
    }

    public async createChannelStack(
        stackDescription: ChannelStackDescription,
        cloudFormationStackArn: string,
        jobId: string,
        conferenceId: string,
        roomId: string
    ): Promise<void> {
        gql`
            mutation CreateChannelStack(
                $cloudFormationStackArn: String!
                $cloudFrontDistributionId: String!
                $mediaLiveChannelId: String!
                $mediaPackageChannelId: String!
                $mp4InputId: String!
                $rtmpAInputId: String!
                $rtmpAInputUri: String!
                $rtmpBInputId: String!
                $rtmpBInputUri: String!
                $rtmpRoomInputId: String
                $endpointUri: String!
                $cloudFrontDomain: String!
                $mp4InputAttachmentName: String!
                $loopingMp4InputAttachmentName: String!
                $rtmpAInputAttachmentName: String!
                $rtmpBInputAttachmentName: String!
                $rtmpRoomInputAttachmentName: String
                $rtmpOutputUri: String
                $rtmpOutputStreamKey: String
                $rtmpOutputDestinationId: String
                $conferenceId: uuid!
                $channelStackCreateJobId: uuid!
                $roomId: uuid!
            ) {
                insert_video_ChannelStack_one(
                    object: {
                        cloudFormationStackArn: $cloudFormationStackArn
                        cloudFrontDistributionId: $cloudFrontDistributionId
                        mediaLiveChannelId: $mediaLiveChannelId
                        mediaPackageChannelId: $mediaPackageChannelId
                        mp4InputId: $mp4InputId
                        rtmpAInputId: $rtmpAInputId
                        rtmpAInputUri: $rtmpAInputUri
                        rtmpBInputId: $rtmpBInputId
                        rtmpBInputUri: $rtmpBInputUri
                        endpointUri: $endpointUri
                        cloudFrontDomain: $cloudFrontDomain
                        mp4InputAttachmentName: $mp4InputAttachmentName
                        loopingMp4InputAttachmentName: $loopingMp4InputAttachmentName
                        rtmpAInputAttachmentName: $rtmpAInputAttachmentName
                        rtmpBInputAttachmentName: $rtmpBInputAttachmentName
                        conferenceId: $conferenceId
                        channelStackCreateJobId: $channelStackCreateJobId
                        rtmpOutputUri: $rtmpOutputUri
                        rtmpOutputStreamKey: $rtmpOutputStreamKey
                        rtmpOutputDestinationId: $rtmpOutputDestinationId
                        roomId: $roomId
                        rtmpRoomInputId: $rtmpRoomInputId
                        rtmpRoomInputAttachmentName: $rtmpRoomInputAttachmentName
                    }
                ) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.mutate({
            mutation: CreateChannelStackDocument,
            variables: {
                channelStackCreateJobId: jobId,
                cloudFormationStackArn,
                cloudFrontDistributionId: stackDescription.cloudFrontDistributionId,
                cloudFrontDomain: stackDescription.cloudFrontDomain,
                conferenceId,
                endpointUri: stackDescription.endpointUri,
                loopingMp4InputAttachmentName: stackDescription.loopingMp4InputAttachmentName,
                mediaLiveChannelId: stackDescription.mediaLiveChannelId,
                mediaPackageChannelId: stackDescription.mediaPackageChannelId,
                mp4InputAttachmentName: stackDescription.mp4InputAttachmentName,
                mp4InputId: stackDescription.mp4InputId,
                rtmpAInputId: stackDescription.rtmpAInputId,
                rtmpAInputUri: stackDescription.rtmpAInputUri,
                rtmpAInputAttachmentName: stackDescription.rtmpAInputAttachmentName,
                rtmpBInputId: stackDescription.rtmpBInputId,
                rtmpBInputUri: stackDescription.rtmpBInputUri,
                rtmpBInputAttachmentName: stackDescription.rtmpBInputAttachmentName,
                rtmpOutputUri: stackDescription.rtmpOutputUri,
                rtmpOutputStreamKey: stackDescription.rtmpOutputStreamKey,
                rtmpOutputDestinationId: stackDescription.rtmpOutputDestinationId,
                roomId,
                rtmpRoomInputId: stackDescription.rtmpRoomInputId,
                rtmpRoomInputAttachmentName: stackDescription.rtmpRoomInputAttachmentName,
            },
        });

        this.logger.info(
            {
                channelStackId: result.data?.insert_video_ChannelStack_one?.id,
            },
            "Created ChannelStack"
        );
    }

    /**
     * @summary Deletes the database entry for a MediaLive channel stack
     */
    public async deleteChannelStackRecord(channelStackId: string): Promise<{ cloudFormationStackArn?: string | null }> {
        gql`
            mutation ChannelStack_Delete($channelStackId: uuid!) {
                delete_video_ChannelStack_by_pk(id: $channelStackId) {
                    id
                    cloudFormationStackArn
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_DeleteDocument,
            variables: {
                channelStackId,
            },
        });

        return { cloudFormationStackArn: result.data?.delete_video_ChannelStack_by_pk?.cloudFormationStackArn };
    }

    public async findChannelStackIdsByStackArn(stackArn: string): Promise<string[]> {
        gql`
            query FindChannelStacksByStackArn($stackArn: String!) {
                video_ChannelStack(where: { cloudFormationStackArn: { _eq: $stackArn } }) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: FindChannelStacksByStackArnDocument,
            variables: {
                stackArn,
            },
        });
        return result.data.video_ChannelStack.map((c) => c.id);
    }

    async getFillerVideoKey(conferenceId: string): Promise<string | null> {
        const fillerVideos = await this.conferenceConfigurationService.getFillerVideos(conferenceId);
        const fillerVideo = fillerVideos?.length ? fillerVideos[0] : null;
        let fillerVideoKey = null;
        try {
            if (fillerVideo) {
                const { key } = new AmazonS3URI(fillerVideo);
                fillerVideoKey = key;
            }
        } catch (e) {
            this.logger.warn({ conferenceId, fillerVideo }, "Could not parse filler video URI");
        }

        return fillerVideoKey;
    }

    public async detachChannelStack(channelStackId: string): Promise<void> {
        gql`
            mutation ChannelStack_Detach($id: uuid!) {
                update_video_ChannelStack_by_pk(pk_columns: { id: $id }, _set: { roomId: null }) {
                    id
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_DetachDocument,
            variables: {
                id: channelStackId,
            },
        });
    }

    public async createChannelStackUpdateJob(channelStackId: string, mediaLiveChannelId: string): Promise<void> {
        gql`
            query ChannelStack_UpdateJob_GetChannelStack($channelStackId: uuid!) {
                video_ChannelStack_by_pk(id: $channelStackId) {
                    id
                    cloudFormationStackArn
                    rtmpOutputUri
                    rtmpOutputStreamKey
                    rtmpOutputDestinationId
                    rtmpRoomInputId
                    rtmpRoomInputAttachmentName
                    room {
                        id
                        rtmpInput {
                            id
                            inputId
                            inputName
                        }
                        rtmpOutput {
                            id
                            url
                            streamKey
                        }
                    }
                }
            }

            mutation ChannelStack_CreateChannelStackUpdateJob(
                $channelStackId: uuid!
                $cloudFormationStackArn: String!
                $mediaLiveChannelId: String!
                $oldRtmpOutputUri: String
                $oldRtmpOutputStreamKey: String
                $oldRtmpOutputDestinationId: String
                $newRtmpOutputUri: String
                $newRtmpOutputStreamKey: String
                $oldRtmpRoomInputId: String
                $oldRtmpRoomInputAttachmentName: String
                $newRtmpRoomInputId: String
                $newRtmpRoomInputAttachmentName: String
            ) {
                insert_job_queues_ChannelStackUpdateJob_one(
                    object: {
                        channelStackId: $channelStackId
                        cloudFormationStackArn: $cloudFormationStackArn
                        jobStatusName: NEW
                        mediaLiveChannelId: $mediaLiveChannelId
                        oldRtmpOutputUri: $oldRtmpOutputUri
                        oldRtmpOutputStreamKey: $oldRtmpOutputStreamKey
                        oldRtmpOutputDestinationId: $oldRtmpOutputDestinationId
                        newRtmpOutputUri: $newRtmpOutputUri
                        newRtmpOutputStreamKey: $newRtmpOutputStreamKey
                        oldRtmpRoomInputId: $oldRtmpRoomInputId
                        oldRtmpRoomInputAttachmentName: $oldRtmpRoomInputAttachmentName
                        newRtmpRoomInputId: $newRtmpRoomInputId
                        newRtmpRoomInputAttachmentName: $newRtmpRoomInputAttachmentName
                    }
                ) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStack_UpdateJob_GetChannelStackDocument,
            variables: {
                channelStackId,
            },
        });

        if (!result.data.video_ChannelStack_by_pk) {
            this.logger.warn({ channelStackId }, "Could not find channel stack to be updated");
            return;
        }

        if (!result.data.video_ChannelStack_by_pk.cloudFormationStackArn) {
            this.logger.warn(
                { channelStackId },
                "Found channel stack to be updated, but it does not have a CloudFormation stack Arn"
            );
            return;
        }

        this.logger.info(
            { channelStackId, cloudFormationStackArn: result.data.video_ChannelStack_by_pk.cloudFormationStackArn },
            "Creating channel stack update job"
        );
        const hasNewRtmpRoomInput =
            result.data.video_ChannelStack_by_pk.room?.rtmpInput?.inputId &&
            result.data.video_ChannelStack_by_pk.room?.rtmpInput?.inputName;
        await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_CreateChannelStackUpdateJobDocument,
            variables: {
                cloudFormationStackArn: result.data.video_ChannelStack_by_pk.cloudFormationStackArn,
                mediaLiveChannelId,
                channelStackId,
                oldRtmpOutputUri: result.data.video_ChannelStack_by_pk.rtmpOutputUri,
                oldRtmpOutputStreamKey: result.data.video_ChannelStack_by_pk.rtmpOutputStreamKey,
                oldRtmpOutputDestinationId: result.data.video_ChannelStack_by_pk.rtmpOutputDestinationId,
                newRtmpOutputUri: result.data.video_ChannelStack_by_pk.room?.rtmpOutput?.url ?? null,
                newRtmpOutputStreamKey: result.data.video_ChannelStack_by_pk.room?.rtmpOutput?.streamKey ?? null,
                oldRtmpRoomInputId: result.data.video_ChannelStack_by_pk.rtmpRoomInputId ?? null,
                oldRtmpRoomInputAttachmentName:
                    result.data.video_ChannelStack_by_pk.rtmpRoomInputAttachmentName ?? null,
                newRtmpRoomInputId: hasNewRtmpRoomInput
                    ? result.data.video_ChannelStack_by_pk.room?.rtmpInput?.inputId ?? null
                    : null,
                newRtmpRoomInputAttachmentName: hasNewRtmpRoomInput
                    ? result.data.video_ChannelStack_by_pk.room?.rtmpInput?.inputName ?? null
                    : null,
            },
        });
    }

    public async createChannelStackDeleteJob(channelStackId: string, mediaLiveChannelId: string): Promise<void> {
        gql`
            query ChannelStack_GetChannelStackCloudFormationStackArn($channelStackId: uuid!) {
                video_ChannelStack_by_pk(id: $channelStackId) {
                    id
                    cloudFormationStackArn
                }
            }

            mutation ChannelStack_CreateChannelStackDeleteJob(
                $cloudFormationStackArn: String!
                $mediaLiveChannelId: String!
            ) {
                insert_job_queues_ChannelStackDeleteJob_one(
                    object: {
                        cloudFormationStackArn: $cloudFormationStackArn
                        jobStatusName: NEW
                        mediaLiveChannelId: $mediaLiveChannelId
                    }
                ) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStack_GetChannelStackCloudFormationStackArnDocument,
            variables: {
                channelStackId,
            },
        });

        if (!result.data.video_ChannelStack_by_pk) {
            this.logger.warn({ channelStackId }, "Could not find channel stack to be deleted");
            return;
        }

        if (!result.data.video_ChannelStack_by_pk.cloudFormationStackArn) {
            this.logger.warn(
                { channelStackId },
                "Found channel stack to be deleted, but it does not have a CloudFormation stack Arn"
            );
            await this.deleteChannelStackRecord(channelStackId);
            return;
        }

        this.logger.info(
            { channelStackId, cloudFormationStackArn: result.data.video_ChannelStack_by_pk.cloudFormationStackArn },
            "Creating channel stack delete job"
        );
        await this.graphQlService.apolloClient.mutate({
            mutation: ChannelStack_CreateChannelStackDeleteJobDocument,
            variables: {
                cloudFormationStackArn: result.data.video_ChannelStack_by_pk.cloudFormationStackArn,
                mediaLiveChannelId,
            },
        });
    }

    public async getChannelStacks(): Promise<
        { channelStackId: string; roomId: string; mediaLiveChannelId: string; conferenceId: string }[]
    > {
        gql`
            query ChannelStack_GetChannelStacks {
                video_ChannelStack(where: { roomId: {} }) {
                    channelStackId: id
                    conferenceId
                    mediaLiveChannelId
                    roomId
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStack_GetChannelStacksDocument,
        });

        return R.flatten(
            result.data.video_ChannelStack.map<
                {
                    channelStackId: string;
                    roomId: string;
                    mediaLiveChannelId: string;
                    conferenceId: string;
                }[]
            >((channelStack) =>
                channelStack.roomId
                    ? [
                          {
                              channelStackId: channelStack.channelStackId,
                              mediaLiveChannelId: channelStack.mediaLiveChannelId,
                              roomId: channelStack.roomId,
                              conferenceId: channelStack.conferenceId,
                          },
                      ]
                    : []
            )
        );
    }

    public async getFirstSyncableEventByMediaLiveChannelId(
        mediaLiveChannelId: string,
        now: Date,
        syncCutoff: Date
    ): Promise<{ eventId: string | null; roomId: string | null; conferenceId: string | null }> {
        gql`
            query ChannelStack_GetFirstSyncableEvent(
                $mediaLiveChannelId: String!
                $now: timestamptz!
                $syncCutoff: timestamptz!
            ) {
                video_ChannelStack(where: { mediaLiveChannelId: { _eq: $mediaLiveChannelId } }, limit: 1) {
                    id
                    conferenceId
                    room {
                        id
                        immediateEvent: events(
                            where: {
                                startTime: { _lte: $now }
                                endTime: { _gte: $syncCutoff }
                                intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                            }
                            limit: 1
                        ) {
                            id
                        }
                        delayedImmediateEvent: events(
                            where: {
                                startTime: { _gt: $now, _lt: $syncCutoff }
                                intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                            }
                            order_by: { startTime: desc_nulls_last }
                            limit: 1
                        ) {
                            id
                        }
                        fixedEvent: events(
                            where: {
                                startTime: { _gte: $syncCutoff }
                                intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                            }
                            order_by: { startTime: asc_nulls_last }
                            limit: 1
                        ) {
                            id
                        }
                    }
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStack_GetFirstSyncableEventDocument,
            variables: {
                mediaLiveChannelId,
                now: now.toISOString(),
                syncCutoff: syncCutoff.toISOString(),
            },
        });

        if (result.data.video_ChannelStack.length !== 1 || !result.data.video_ChannelStack[0].room) {
            return { roomId: null, eventId: null, conferenceId: null };
        }

        if (result.data.video_ChannelStack[0].room.immediateEvent.length === 1) {
            return {
                roomId: result.data.video_ChannelStack[0].room.id,
                eventId: result.data.video_ChannelStack[0].room.immediateEvent[0].id,
                conferenceId: result.data.video_ChannelStack[0].conferenceId,
            };
        }

        if (result.data.video_ChannelStack[0].room.delayedImmediateEvent.length === 1) {
            return {
                roomId: result.data.video_ChannelStack[0].room.id,
                eventId: result.data.video_ChannelStack[0].room.delayedImmediateEvent[0].id,
                conferenceId: result.data.video_ChannelStack[0].conferenceId,
            };
        }

        if (result.data.video_ChannelStack[0].room.fixedEvent.length === 1) {
            return {
                roomId: result.data.video_ChannelStack[0].room.id,
                eventId: result.data.video_ChannelStack[0].room.fixedEvent[0].id,
                conferenceId: result.data.video_ChannelStack[0].conferenceId,
            };
        }

        return {
            roomId: result.data.video_ChannelStack[0].room.id,
            eventId: null,
            conferenceId: result.data.video_ChannelStack[0].conferenceId,
        };
    }
}
