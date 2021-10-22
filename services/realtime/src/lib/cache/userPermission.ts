import { gql } from "@apollo/client/core";
import { Permissions_Permission_Enum, UserPermissionsDocument } from "../../generated/graphql";
import { testMode } from "../../testMode";
import { Cache } from "./cache";

gql`
    query UserPermissions($userId: String!) {
        FlatUserPermission(where: { user_id: { _eq: $userId } }) {
            slug
            permission_name
            user_id
        }
    }
`;

export type UserPermission = {
    slug: string;
    permission_name: Permissions_Permission_Enum;
};

const userPermissionCache = new Cache<UserPermission[]>(
    "realtime.caches:UserPermission",
    async (userId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: UserPermissionsDocument,
                    variables: {
                        userId,
                    },
                });

                const result = response.data.FlatUserPermission.map<UserPermission | undefined>((perm) =>
                    perm.permission_name && perm.slug
                        ? {
                              permission_name: perm.permission_name as Permissions_Permission_Enum,
                              slug: perm.slug,
                          }
                        : undefined
                ).filter<UserPermission>((x): x is UserPermission => !!x);

                if (result.length === 0) {
                    return undefined;
                }
                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse
);

export async function hasAtLeastOnePermissionForConfSlug(
    userId: string,
    permissionNames: Permissions_Permission_Enum[],
    conferenceSlugs: string[],
    refetchNow = false
): Promise<string[] | false> {
    const perms = await userPermissionCache.get(
        userId,
        permissionNames.map((permission_name) => ({
            slug: conferenceSlugs[0],
            permission_name,
        })),
        refetchNow
    );
    const result =
        !!perms &&
        perms
            .filter((perm) => conferenceSlugs.includes(perm.slug) && permissionNames.includes(perm.permission_name))
            .map((x) => x.slug);
    // We didn't find the permission we were looking for, we didn't just refetch, but we did get
    // some permissions so the cache might be stale
    if (!result && !refetchNow && perms) {
        return hasAtLeastOnePermissionForConfSlug(userId, permissionNames, conferenceSlugs, true);
    }
    return result;
}
