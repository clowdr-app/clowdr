import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import AmazonS3URI from "amazon-s3-uri";
import { ChannelStackDescription } from "../../channel-stack/channel-stack/channelStack";
import {
    CreateMediaLiveChannelDocument,
    DeleteMediaLiveChannelDocument,
    FindMediaLiveChannelsByStackArnDocument,
    GetMediaLiveChannelByRoomDocument,
} from "../../generated/graphql";
import { ConferenceConfigurationService } from "../conference-configuration/conference-configuration.service";
import { GraphQlService } from "../graphql/graphql.service";
import { ChannelStackDetails } from "./channel-stack-details";

@Injectable()
export class MediaLiveChannelService {
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
            query GetMediaLiveChannelByRoom($roomId: uuid!) {
                Room_by_pk(id: $roomId) {
                    id
                    conferenceId
                    mediaLiveChannel {
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
            query: GetMediaLiveChannelByRoomDocument,
            variables: {
                roomId,
            },
        });

        if (!channelResult.data.Room_by_pk?.mediaLiveChannel) {
            return null;
        }

        const fillerVideoKey = await this.getFillerVideoKey(channelResult.data.Room_by_pk.conferenceId);

        return {
            id: channelResult.data.Room_by_pk.mediaLiveChannel.id,
            roomId,
            conferenceId: channelResult.data.Room_by_pk.conferenceId,
            mediaLiveChannelId: channelResult.data.Room_by_pk.mediaLiveChannel.mediaLiveChannelId,
            mp4InputAttachmentName: channelResult.data.Room_by_pk.mediaLiveChannel.mp4InputAttachmentName,
            rtmpAInputAttachmentName: channelResult.data.Room_by_pk.mediaLiveChannel.rtmpAInputAttachmentName,
            rtmpBInputAttachmentName: channelResult.data.Room_by_pk.mediaLiveChannel.rtmpBInputAttachmentName ?? null,
            loopingMp4InputAttachmentName: channelResult.data.Room_by_pk.mediaLiveChannel.loopingMp4InputAttachmentName,
            fillerVideoKey,
        };
    }

    public async createMediaLiveChannel(
        stackDescription: ChannelStackDescription,
        cloudFormationStackArn: string,
        jobId: string,
        conferenceId: string,
        roomId: string
    ): Promise<void> {
        gql`
            mutation CreateMediaLiveChannel(
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
                insert_video_MediaLiveChannel_one(
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
            mutation: CreateMediaLiveChannelDocument,
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
                mediaLiveChannelId: result.data?.insert_video_MediaLiveChannel_one?.id,
            },
            "Created MediaLiveChannel"
        );
    }

    /**
     * @summary Deletes the database entry for a MediaLive channel stack
     */
    public async deleteMediaLiveChannel(
        mediaLiveChannelId: string
    ): Promise<{ cloudFormationStackArn?: string | null }> {
        gql`
            mutation DeleteMediaLiveChannel($id: uuid!) {
                delete_video_MediaLiveChannel_by_pk(id: $id) {
                    id
                    cloudFormationStackArn
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.mutate({
            mutation: DeleteMediaLiveChannelDocument,
            variables: {
                id: mediaLiveChannelId,
            },
        });

        return { cloudFormationStackArn: result.data?.delete_video_MediaLiveChannel_by_pk?.cloudFormationStackArn };
    }

    public async findMediaLiveChannelsByStackArn(stackArn: string): Promise<string[]> {
        gql`
            query FindMediaLiveChannelsByStackArn($stackArn: String!) {
                video_MediaLiveChannel(where: { cloudFormationStackArn: { _eq: $stackArn } }) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: FindMediaLiveChannelsByStackArnDocument,
            variables: {
                stackArn,
            },
        });
        return result.data.video_MediaLiveChannel.map((c) => c.id);
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
}
