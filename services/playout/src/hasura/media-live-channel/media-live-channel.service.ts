import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import { ChannelStackDescription } from "../../aws/aws.service";
import { CreateMediaLiveChannelDocument, DeleteMediaLiveChannelDocument } from "../../generated/graphql";
import { GraphQlService } from "../graphql.service";

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
        conferenceId: string
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
                cloudFormationStackArn: cloudFormationStackArn,
                cloudFrontDistributionId: stackDescription.cloudFrontDistributionId,
                cloudFrontDomain: stackDescription.cloudFrontDomain,
                conferenceId: conferenceId,
                endpointUri: stackDescription.endpointUri,
                loopingMp4InputAttachmentName: stackDescription.loopingMp4InputAttachmentName,
                mediaLiveChannelId: stackDescription.mediaLiveChannelId,
                mediaPackageChannelId: stackDescription.mediaPackageChannelId,
                mp4InputAttachmentName: stackDescription.mp4InputAttachmentName,
                mp4InputId: stackDescription.mp4InputId,
                rtmpInputId: stackDescription.rtmpAInputId,
                rtmpInputUri: stackDescription.rtmpAInputUri,
                vonageInputAttachmentName: stackDescription.rtmpAInputAttachmentName,
            },
        });

        this.logger.info({
            msg: "Created MediaLiveChannel",
            mediaLiveChannelId: result.data?.insert_MediaLiveChannel_one?.id,
        });
    }

    /**
     * @summary Deletes the database entry for a MediaLive channel stack
     */
    public async deleteMediaLiveChannel(mediaLiveChannelId: string): Promise<void> {
        gql`
            mutation DeleteMediaLiveChannel($id: uuid!) {
                delete_MediaLiveChannel_by_pk(id: $id) {
                    id
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: DeleteMediaLiveChannelDocument,
            variables: {
                id: mediaLiveChannelId,
            },
        });
    }
}
