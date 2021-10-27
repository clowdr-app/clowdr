import { gql } from "@urql/core";
import type {
    Conference_VisibilityLevel_Enum,
    GetSubconferenceQuery,
    GetSubconferenceQueryVariables,
} from "../../generated/graphql";
import { GetSubconferenceDocument } from "../../generated/graphql";
import { gqlClient } from "../../graphqlClient";
import { Cache } from "./cache";

gql`
    query GetSubconference($id: uuid!) {
        conference_Subconference_by_pk(id: $id) {
            id
            conferenceVisibilityLevel
        }
    }
`;

export type Subconference = {
    id: string;
    conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
};

const SubconferenceCache = new Cache<Subconference>(
    "auth.caches:Subconference",
    async (conferenceId) => {
        const response = await gqlClient
            ?.query<GetSubconferenceQuery, GetSubconferenceQueryVariables>(GetSubconferenceDocument, {
                id: conferenceId,
            })
            .toPromise();

        const data = response?.data?.conference_Subconference_by_pk;
        if (data) {
            // Remapping is necessary to remove __typename
            return {
                id: data.id,
                conferenceVisibilityLevel: data.conferenceVisibilityLevel,
            };
        }
        return undefined;
    },
    JSON.stringify,
    JSON.parse,
    7 * 24 * 60 * 60 * 1000, // Refetch conference every 7 days
    5 * 60 * 1000
);

export async function getSubconference(
    subconferenceId: string,
    refetchNow = false
): Promise<Subconference | undefined> {
    const info = await SubconferenceCache.get(subconferenceId, refetchNow);
    if (!info && !refetchNow) {
        return getSubconference(subconferenceId, true);
    }
    return info;
}

export async function invalidateCachedSubconference(subconferenceId: string): Promise<void> {
    await SubconferenceCache.delete(subconferenceId);
}

export async function updateCachedSubconference(
    subconferenceId: string,
    conferenceVisibilityLevel: Conference_VisibilityLevel_Enum
): Promise<void> {
    await SubconferenceCache.update(
        subconferenceId,
        (existing) => {
            if (existing) {
                return {
                    ...existing,
                    conferenceVisibilityLevel,
                };
            }
            return existing;
        },
        false
    );
}
