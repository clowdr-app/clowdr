import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    CallUpdateUsageMutation,
    CallUpdateUsageMutationVariables,
    Conference_Usage_Set_Input,
    GetUsageQuery,
    GetUsageQueryVariables,
    UpdateUsageMutation,
    UpdateUsageMutationVariables,
    UsageFragment,
} from "../generated/graphql";
import { CallUpdateUsageDocument, GetUsageDocument, UpdateUsageDocument } from "../generated/graphql";
import extractActualError from "./extractError";

gql`
    fragment Usage on conference_Usage {
        id
        created_at
        updated_at
        conferenceId
        consumedStreamingEventTotalMinutes
        consumedVideoChatEventTotalMinutes
        consumedVideoChatNonEventTotalMinutes
        consumedSupportMeetingMinutes
        lastUpdatedConsumedStreamingEventTotalMinutes
        lastUpdatedConsumedVideoChatEventTotalMinutes
        lastUpdatedConsumedVideoChatNonEventTotalMinutes
        lastUpdatedConsumedSupportMeetingMinutes
    }

    query GetUsage($conferenceId: uuid!) {
        conference_Usage(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Usage
        }
    }

    mutation UpdateUsage($conferenceId: uuid!, $set: conference_Usage_set_input!) {
        update_conference_Usage(where: { conferenceId: { _eq: $conferenceId } }, _set: $set) {
            affected_rows
            returning {
                ...Usage
            }
        }
    }

    mutation CallUpdateUsage {
        conference_updateEventUsage {
            ...Usage
        }
    }
`;

export async function getUsage(conferenceId: string): Promise<UsageFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetUsageQuery, GetUsageQueryVariables>(GetUsageDocument, {
            conferenceId,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data) {
        throw new Error("No data");
    }
    return response.data.conference_Usage[0];
}

export async function updateUsage(conferenceId: string, set: Conference_Usage_Set_Input): Promise<UsageFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateUsageMutation, UpdateUsageMutationVariables>(UpdateUsageDocument, {
            conferenceId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.update_conference_Usage) {
        throw new Error("No update response");
    }
    if (!response.data.update_conference_Usage.affected_rows) {
        throw new Error("No rows affected");
    }
    return response.data.update_conference_Usage.returning[0];
}

export async function callUpdateUsage(): Promise<readonly UsageFragment[]> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<CallUpdateUsageMutation, CallUpdateUsageMutationVariables>(CallUpdateUsageDocument)
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.conference_updateEventUsage) {
        throw new Error("No update response");
    }
    return response.data.conference_updateEventUsage;
}
