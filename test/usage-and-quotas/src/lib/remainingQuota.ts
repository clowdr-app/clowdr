import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    GetRemainingQuotaQuery,
    GetRemainingQuotaQueryVariables,
    RemainingQuotaFragment,
} from "../generated/graphql";
import { GetRemainingQuotaDocument } from "../generated/graphql";

gql`
    fragment RemainingQuota on conference_RemainingQuota {
        conferenceId
        remainingSubconferences
        remainingStreamingEventTotalMinutes
        remainingVideoChatEventTotalMinutes
        remainingRegistrants
        remainingVideoChatNonEventTotalMinutes
        remainingSupportMeetingMinutes
        remainingStreamingProgramRooms
        remainingNonStreamingProgramRooms
        remainingPublicSocialRooms
        remainingContentItems
    }

    query GetRemainingQuota($conferenceId: uuid!) {
        conference_RemainingQuota(where: { conferenceId: { _eq: $conferenceId } }) {
            ...RemainingQuota
        }
    }
`;

export async function getRemainingQuota(conferenceId: string): Promise<RemainingQuotaFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetRemainingQuotaQuery, GetRemainingQuotaQueryVariables>(GetRemainingQuotaDocument, {
            conferenceId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data) {
        throw new Error("No data");
    }
    return response.data.conference_RemainingQuota[0];
}
