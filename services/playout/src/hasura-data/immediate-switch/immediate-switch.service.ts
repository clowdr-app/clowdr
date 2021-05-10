import { gql } from "@apollo/client/core";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { Injectable } from "@nestjs/common";
import { ImmediateSwitch_CompleteDocument, ImmediateSwitch_FailDocument } from "../../generated/graphql";
import { GraphQlService } from "../graphql/graphql.service";

@Injectable()
export class ImmediateSwitchDataService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
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
