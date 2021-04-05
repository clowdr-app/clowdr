import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import {
    CreateMediaLiveChannelDocument,
    DeleteMediaLiveChannelDocument,
    FindMediaLiveChannelsByStackArnDocument,
} from "../../generated/graphql";
import { GraphQlService } from "../../hasura/graphql.service";
import { ChannelStackDescription } from "../channels/channelStack";

@Injectable()
export class MediaLiveChannelService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
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
                $rtmpInputId: String!
                $rtmpInputUri: String!
                $endpointUri: String!
                $cloudFrontDomain: String!
                $mp4InputAttachmentName: String!
                $loopingMp4InputAttachmentName: String!
                $vonageInputAttachmentName: String!
                $conferenceId: uuid!
                $channelStackCreateJobId: uuid!
                $roomId: uuid!
            ) {
                insert_MediaLiveChannel_one(
                    object: {
                        cloudFormationStackArn: $cloudFormationStackArn
                        cloudFrontDistributionId: $cloudFrontDistributionId
                        mediaLiveChannelId: $mediaLiveChannelId
                        mediaPackageChannelId: $mediaPackageChannelId
                        mp4InputId: $mp4InputId
                        rtmpInputId: $rtmpInputId
                        rtmpInputUri: $rtmpInputUri
                        endpointUri: $endpointUri
                        cloudFrontDomain: $cloudFrontDomain
                        mp4InputAttachmentName: $mp4InputAttachmentName
                        loopingMp4InputAttachmentName: $loopingMp4InputAttachmentName
                        vonageInputAttachmentName: $vonageInputAttachmentName
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
                rtmpInputId: stackDescription.rtmpAInputId,
                rtmpInputUri: stackDescription.rtmpAInputUri,
                vonageInputAttachmentName: stackDescription.rtmpAInputAttachmentName,
                roomId,
            },
        });

        this.logger.info(
            {
                mediaLiveChannelId: result.data?.insert_MediaLiveChannel_one?.id,
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
                delete_MediaLiveChannel_by_pk(id: $id) {
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

        return { cloudFormationStackArn: result.data?.delete_MediaLiveChannel_by_pk?.cloudFormationStackArn };
    }

    public async findMediaLiveChannelsByStackArn(stackArn: string): Promise<string[]> {
        gql`
            query FindMediaLiveChannelsByStackArn($stackArn: String!) {
                MediaLiveChannel(where: { cloudFormationStackArn: { _eq: $stackArn } }) {
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
        return result.data.MediaLiveChannel.map((c) => c.id);
    }
}
