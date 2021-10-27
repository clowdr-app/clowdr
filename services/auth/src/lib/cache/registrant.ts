import { gql } from "@urql/core";
import type {
    GetRegistrantQuery,
    GetRegistrantQueryVariables,
    Registrant_RegistrantRole_Enum,
} from "../../generated/graphql";
import { GetRegistrantDocument } from "../../generated/graphql";
import { gqlClient } from "../../graphqlClient";
import { Cache } from "./cache";

gql`
    query GetRegistrant($id: uuid!) {
        registrant_Registrant_by_pk(id: $id) {
            id
            conferenceRole
            subconferenceMemberships {
                id
                subconferenceId
                role
            }
        }
    }
`;

export type SubconferenceMembership = { id: string; subconferenceId: string; role: Registrant_RegistrantRole_Enum };

export type Registrant = {
    id: string;
    conferenceRole: Registrant_RegistrantRole_Enum;
    subconferenceMemberships: SubconferenceMembership[];
};

const RegistrantCache = new Cache<Registrant>(
    "auth.caches:Registrant",
    async (registrantId) => {
        const response = await gqlClient
            ?.query<GetRegistrantQuery, GetRegistrantQueryVariables>(GetRegistrantDocument, {
                id: registrantId,
            })
            .toPromise();

        const data = response?.data?.registrant_Registrant_by_pk;
        if (data) {
            // Remapping is necessary to remove __typename
            return {
                id: data.id,
                conferenceRole: data.conferenceRole,
                subconferenceMemberships: data.subconferenceMemberships.map((x) => ({
                    id: x.id,
                    role: x.role,
                    subconferenceId: x.subconferenceId,
                })),
            };
        }
        return undefined;
    },
    JSON.stringify,
    JSON.parse,
    7 * 24 * 60 * 60 * 1000, // Refetch registrant every 7 days
    5 * 60 * 1000
);

export async function getRegistrant(registrantId: string, refetchNow = false): Promise<Registrant | undefined> {
    const info = await RegistrantCache.get(registrantId, refetchNow);
    if (!info && !refetchNow) {
        return getRegistrant(registrantId, true);
    }
    return info;
}

export async function invalidateCachedRegistrant(registrantId: string): Promise<void> {
    await RegistrantCache.delete(registrantId);
}

export async function updateCachedRegistrant(
    registrantId: string,
    conferenceRole: Registrant_RegistrantRole_Enum
): Promise<void> {
    await RegistrantCache.update(
        registrantId,
        (existing) => {
            if (existing) {
                return {
                    ...existing,
                    conferenceRole,
                };
            }
            return existing;
        },
        false
    );
}

export async function updateCachedRegistrantSubconferenceMemberships(
    registrantId: string,
    updateSubconferenceMemberships: (subconferenceMemberships: SubconferenceMembership[]) => SubconferenceMembership[]
): Promise<void> {
    await RegistrantCache.update(
        registrantId,
        (existing) => {
            if (existing) {
                return {
                    ...existing,
                    subconferenceMemberships: updateSubconferenceMemberships(existing.subconferenceMemberships),
                };
            }
            return existing;
        },
        false
    );
}
