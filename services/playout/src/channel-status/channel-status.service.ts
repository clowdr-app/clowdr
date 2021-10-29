import { gql } from "@apollo/client/core";
import type { Bunyan } from "@eropple/nestjs-bunyan/dist";
import { RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { ChannelStackService } from "../channel-stack/channel-stack/channel-stack.service";
import { ChannelStatus_UpdatedMediaLiveChannelStatusesDocument } from "../generated/graphql";
import { GraphQlService } from "../hasura-data/graphql/graphql.service";

@Injectable()
export class ChannelStatusService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private channelStackService: ChannelStackService,
        private graphQlService: GraphQlService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    @Interval(10000)
    public async handleSyncChannelStatus(): Promise<void> {
        this.logger.info("Syncing channel statuses");

        const channelStacks = await this.channelStackService.getChannelStacks();

        if (channelStacks.length) {
            gql`
                mutation ChannelStatus_UpdatedMediaLiveChannelStatuses(
                    $objects: [video_MediaLiveChannelStatus_insert_input!]!
                ) {
                    insert_video_MediaLiveChannelStatus(
                        objects: $objects
                        on_conflict: {
                            constraint: MediaLiveChannelStatus_channelStackId_key
                            update_columns: [
                                activeInputAttachmentName
                                activeInputSwitchActionName
                                pipelinesRunningCount
                                state
                            ]
                        }
                    ) {
                        affected_rows
                    }
                }
            `;

            await this.graphQlService.apolloClient.mutate({
                mutation: ChannelStatus_UpdatedMediaLiveChannelStatusesDocument,
                variables: {
                    objects: channelStacks.map((channelStack) => ({
                        activeInputAttachmentName:
                            channelStack.channel.PipelineDetails?.[0]?.ActiveInputAttachmentName ?? null,
                        activeInputSwitchActionName:
                            channelStack.channel.PipelineDetails?.[0]?.ActiveInputSwitchActionName ?? null,
                        pipelinesRunningCount: channelStack.channel.PipelinesRunningCount ?? null,
                        channelStackId: channelStack.channelStackId,
                        conferenceId: channelStack.conferenceId,
                        state: channelStack.channel.State,
                    })),
                },
            });
        }
    }
}
