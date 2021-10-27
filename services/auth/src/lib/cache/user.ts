import { gql } from "@urql/core";
import type { GetUserQuery, GetUserQueryVariables } from "../../generated/graphql";
import { GetUserDocument } from "../../generated/graphql";
import { gqlClient } from "../../graphqlClient";
import { Cache } from "./cache";

gql`
    query GetUser($id: String!) {
        User_by_pk(id: $id) {
            id
            registrants {
                id
                conferenceId
            }
        }
    }
`;

export type User = {
    id: string;
    registrantIds: {
        id: string;
        conferenceId: string;
    }[];
};

const UserCache = new Cache<User>(
    "auth.caches:User",
    async (userId) => {
        const response = await gqlClient
            ?.query<GetUserQuery, GetUserQueryVariables>(GetUserDocument, {
                id: userId,
            })
            .toPromise();

        const data = response?.data?.User_by_pk;
        if (data) {
            // Remapping is necessary to remove __typename
            return {
                id: data.id,
                registrantIds: data.registrants.map((x) => ({
                    id: x.id,
                    conferenceId: x.conferenceId,
                })),
            };
        }
        return undefined;
    },
    JSON.stringify,
    JSON.parse,
    7 * 24 * 60 * 60 * 1000, // Refetch user every 7 days
    5 * 60 * 1000
);

export async function getUser(userId: string, refetchNow = false): Promise<User | undefined> {
    const info = await UserCache.get(userId, refetchNow);
    if (!info && !refetchNow) {
        return getUser(userId, true);
    }
    return info;
}

export async function invalidateCachedUser(userId: string): Promise<void> {
    await UserCache.delete(userId);
}

export async function updateCachedUserRegistrantIds(
    userId: string,
    updateRegistrantIds: (
        registrantIds: {
            id: string;
            conferenceId: string;
        }[]
    ) => {
        id: string;
        conferenceId: string;
    }[]
): Promise<void> {
    await UserCache.update(
        userId,
        (existing) => {
            if (existing) {
                return {
                    ...existing,
                    registrantIds: updateRegistrantIds(existing.registrantIds),
                };
            }
            return existing;
        },
        false
    );
}
