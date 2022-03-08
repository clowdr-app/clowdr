import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    Conference_Quota_Set_Input,
    GetQuotaQuery,
    GetQuotaQueryVariables,
    QuotaFragment,
    UpdateQuotaMutation,
    UpdateQuotaMutationVariables,
} from "../generated/graphql";
import { GetQuotaDocument, UpdateQuotaDocument } from "../generated/graphql";

gql`
    fragment Quota on conference_Quota {
        id
        created_at
        updated_at
        conferenceId
        maxSubconferences
        maxStreamingEventTotalMinutes
        maxStreamingEventIndividualMinutes
        maxVideoChatEventTotalMinutes
        maxVideoChatEventIndividualMinutes
        maxRegistrants
        maxVideoChatNonEventTotalMinutesConsumed
        maxSupportMeetingMinutes
        maxStreamingProgramRooms
        maxNonStreamingProgramRooms
        maxPublicSocialRooms
        maxContentItems
        maxMediaElementsPerContentItem
        maxNonMediaElementsPerContentItem
        maxMediaElementsPerSponsor
        maxNonMediaElementsPerSponsor
        areStreamingEventsAllowed
        areVideoChatEventsAllowed
    }

    query GetQuota($conferenceId: uuid!) {
        conference_Quota(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Quota
        }
    }

    mutation UpdateQuota($conferenceId: uuid!, $set: conference_Quota_set_input!) {
        update_conference_Quota(where: { conferenceId: { _eq: $conferenceId } }, _set: $set) {
            affected_rows
            returning {
                ...Quota
            }
        }
    }
`;

export async function getQuota(conferenceId: string): Promise<QuotaFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetQuotaQuery, GetQuotaQueryVariables>(GetQuotaDocument, {
            conferenceId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data) {
        throw new Error("No data");
    }
    return response.data.conference_Quota[0];
}

export async function updateQuota(conferenceId: string, set: Conference_Quota_Set_Input): Promise<QuotaFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateQuotaMutation, UpdateQuotaMutationVariables>(UpdateQuotaDocument, {
            conferenceId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.update_conference_Quota) {
        throw new Error("No update response");
    }
    if (!response.data.update_conference_Quota.affected_rows) {
        throw new Error("No rows affected");
    }
    return response.data.update_conference_Quota.returning[0];
}
