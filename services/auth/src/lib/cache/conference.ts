import { gql } from "@urql/core";
import type {
    Conference_VisibilityLevel_Enum,
    GetConferenceQuery,
    GetConferenceQueryVariables,
} from "../../generated/graphql";
import { GetConferenceDocument } from "../../generated/graphql";
import { gqlClient } from "../../graphqlClient";
import { Cache } from "./cache";

gql`
    query GetConference($id: uuid!) {
        conference_Conference_by_pk(id: $id) {
            id
            conferenceVisibilityLevel
            createdBy
            subconferences {
                id
            }
        }
    }
`;

export type Conference = {
    id: string;
    createdBy: string;
    conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
    subconferenceIds: string[];
};

const ConferenceCache = new Cache<Conference>(
    "auth.caches:Conference",
    async (conferenceId) => {
        const response = await gqlClient
            ?.query<GetConferenceQuery, GetConferenceQueryVariables>(GetConferenceDocument, {
                id: conferenceId,
            })
            .toPromise();

        const data = response?.data?.conference_Conference_by_pk;
        if (data) {
            // Remapping is necessary to remove __typename
            return {
                id: data.id,
                createdBy: data.createdBy,
                conferenceVisibilityLevel: data.conferenceVisibilityLevel,
                subconferenceIds: data.subconferences.map((x) => x.id),
            };
        }
        return undefined;
    },
    JSON.stringify,
    JSON.parse,
    7 * 24 * 60 * 60 * 1000, // Refetch conference every 7 days
    5 * 60 * 1000
);

export async function getConference(conferenceId: string, refetchNow = false): Promise<Conference | undefined> {
    const info = await ConferenceCache.get(conferenceId, refetchNow);
    if (!info && !refetchNow) {
        return getConference(conferenceId, true);
    }
    return info;
}

export async function invalidateCachedConference(conferenceId: string): Promise<void> {
    await ConferenceCache.delete(conferenceId);
}
