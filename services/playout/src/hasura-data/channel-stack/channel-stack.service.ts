import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import AmazonS3URI from "amazon-s3-uri";
import { add } from "date-fns";
import * as R from "ramda";
import { ChannelStackDescription } from "../../channel-stack/channel-stack/channelStack";
import {
    ChannelStack_CreateChannelStackDeleteJobDocument,
    ChannelStack_DeleteDocument,
    ChannelStack_DetachDocument,
    ChannelStack_GetChannelStackCloudFormationStackArnDocument,
    ChannelStack_GetChannelStacksDocument,
    ChannelStack_GetCurrentEventDocument,
    CreateChannelStackDocument,
    FindChannelStacksByStackArnDocument,
    GetChannelStackByRoomDocument,
} from "../../generated/graphql";
import { ConferenceConfigurationService } from "../conference-configuration/conference-configuration.service";
import { GraphQlService } from "../graphql/graphql.service";
import { ChannelStackDetails } from "./channel-stack-details";

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
                $endpointUri: String!
                $cloudFrontDomain: String!
                $mp4InputAttachmentName: String!
                $loopingMp4InputAttachmentName: String!
                $rtmpAInputAttachmentName: String!
                $rtmpBInputAttachmentName: String!
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
                        roomId: $roomId
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
                roomId,
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

    public async getCurrentOrUpcomingEventByMediaLiveChannelId(
        mediaLiveChannelId: string
    ): Promise<{ eventId: string | null; roomId: string | null; conferenceId: string | null }> {
        gql`
            query ChannelStack_GetCurrentEvent(
                $mediaLiveChannelId: String!
                $now: timestamptz!
                $future: timestamptz!
            ) {
                video_ChannelStack(where: { mediaLiveChannelId: { _eq: $mediaLiveChannelId } }, limit: 1) {
                    id
                    conferenceId
                    room {
                        id
                        events(where: { startTime: { _lte: $now }, endTime: { _gte: $future } }) {
                            id
                        }
                    }
                }
            }
        `;

        const now = new Date();
        const future = add(now, { seconds: 15 });

        const result = await this.graphQlService.apolloClient.query({
            query: ChannelStack_GetCurrentEventDocument,
            variables: {
                mediaLiveChannelId,
                now: now.toISOString(),
                future: future.toISOString(),
            },
        });

        if (result.data.video_ChannelStack.length !== 1 || !result.data.video_ChannelStack[0].room) {
            return { roomId: null, eventId: null, conferenceId: null };
        }

        if (result.data.video_ChannelStack[0].room.events.length !== 1) {
            return {
                roomId: result.data.video_ChannelStack[0].room.id,
                eventId: null,
                conferenceId: result.data.video_ChannelStack[0].conferenceId,
            };
        }

        return {
            roomId: result.data.video_ChannelStack[0].room.id,
            eventId: result.data.video_ChannelStack[0].room.events[0].id,
            conferenceId: result.data.video_ChannelStack[0].conferenceId,
        };
    }
}
