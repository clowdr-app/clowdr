import { gql } from "@apollo/client/core";
import type { Bunyan } from "@eropple/nestjs-bunyan/dist";
import { RootLogger } from "@eropple/nestjs-bunyan/dist";
import { ImmediateSwitchData, ImmediateSwitchExecutedSignal } from "@midspace/shared-types/video/immediateSwitchData";
import { Injectable } from "@nestjs/common";
import {
    ImmediateSwitch_CompleteDocument,
    ImmediateSwitch_FailDocument,
    ImmediateSwitch_NotifyDetailsDocument,
} from "../../generated/graphql";
import { VonageClientService } from "../../vonage/vonage/vonage-client.service";
import { GraphQlService } from "../graphql/graphql.service";

@Injectable()
export class ImmediateSwitchDataService {
    private logger: Bunyan;

    constructor(
        @RootLogger() logger: Bunyan,
        private graphQlService: GraphQlService,
        private vonageClientService: VonageClientService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async completeImmediateSwitch(immediateSwitchId: string): Promise<void> {
        gql`
            mutation ImmediateSwitch_Complete($immediateSwitchId: uuid!, $executedAt: timestamptz!) {
                update_video_ImmediateSwitch_by_pk(
                    pk_columns: { id: $immediateSwitchId }
                    _set: { executedAt: $executedAt }
                ) {
                    id
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: ImmediateSwitch_CompleteDocument,
            variables: {
                immediateSwitchId,
                executedAt: new Date().toISOString(),
            },
        });
    }

    public async notifyImmediateSwitchExecuted(immediateSwitchId: string): Promise<void> {
        gql`
            query ImmediateSwitch_NotifyDetails($immediateSwitchId: uuid!) {
                video_ImmediateSwitch_by_pk(id: $immediateSwitchId) {
                    executedAt
                    data
                    event {
                        eventVonageSession {
                            id
                            sessionId
                        }
                        id
                    }
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ImmediateSwitch_NotifyDetailsDocument,
            variables: {
                immediateSwitchId,
            },
        });

        if (result.data.video_ImmediateSwitch_by_pk?.event?.eventVonageSession) {
            const data: ImmediateSwitchExecutedSignal = {
                executedAtMillis: Date.parse(result.data.video_ImmediateSwitch_by_pk.executedAt),
                immediateSwitch: ImmediateSwitchData.parse(result.data.video_ImmediateSwitch_by_pk.data),
            };

            this.vonageClientService.sendSignal(
                result.data.video_ImmediateSwitch_by_pk.event.eventVonageSession.sessionId,
                null,
                {
                    data,
                    type: "immediate-switch-executed",
                }
            );
        }
    }

    public async failImmediateSwitch(immediateSwitchId: string, errorMessage: string): Promise<void> {
        gql`
            mutation ImmediateSwitch_Fail($immediateSwitchId: uuid!, $errorMessage: String!) {
                update_video_ImmediateSwitch_by_pk(
                    pk_columns: { id: $immediateSwitchId }
                    _set: { errorMessage: $errorMessage }
                ) {
                    id
                }
            }
        `;

        await this.graphQlService.apolloClient.mutate({
            mutation: ImmediateSwitch_FailDocument,
            variables: {
                immediateSwitchId,
                errorMessage,
            },
        });
    }
}
