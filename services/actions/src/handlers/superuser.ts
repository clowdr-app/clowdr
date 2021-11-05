import { gql } from "@apollo/client/core";
import type { InitialiseSuperUserOutput } from "@midspace/hasura/actionTypes";
import type { P } from "pino";
import { InitialiseSuperUserStateDocument, SuperUserStateDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query SuperUserState {
        system_SuperUserState {
            isInitialised
            canBeDirectlyInitialised
        }
        User(limit: 1) {
            id
        }
    }

    mutation InitialiseSuperUserState($userId: String!) {
        insert_system_SuperUserPermissionGrant(
            objects: [
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: CREATE_CONFERENCE_DEMO_CODE
                }
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: DELETE_SU_PERMISSION
                }
                { grantedPermissionName: VIEW_SU_PERMISSION_GRANT, userId: $userId, targetPermissionName: DELETE_USERS }
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: EDIT_USER_REGISTRANTS
                }
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: INSERT_SU_PERMISSION
                }
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: LIST_CONFERENCE_DEMO_CODES
                }
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: SET_SYSTEM_CONFIGURATION
                }
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: VIEW_SU_PERMISSION_GRANT
                }
                {
                    grantedPermissionName: VIEW_SU_PERMISSION_GRANT
                    userId: $userId
                    targetPermissionName: VIEW_SYSTEM_CONFIGURATION
                }
                { grantedPermissionName: VIEW_SU_PERMISSION_GRANT, userId: $userId, targetPermissionName: VIEW_USERS }
                ####
                {
                    grantedPermissionName: INSERT_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: INSERT_SU_PERMISSION
                }
                {
                    grantedPermissionName: INSERT_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: VIEW_SU_PERMISSION_GRANT
                }
                {
                    grantedPermissionName: INSERT_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: VIEW_SYSTEM_CONFIGURATION
                }
                {
                    grantedPermissionName: INSERT_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: SET_SYSTEM_CONFIGURATION
                }
                {
                    grantedPermissionName: INSERT_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: LIST_CONFERENCE_DEMO_CODES
                }
                {
                    grantedPermissionName: INSERT_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: CREATE_CONFERENCE_DEMO_CODE
                }
                { grantedPermissionName: INSERT_SU_PERMISSION, userId: $userId, targetPermissionName: VIEW_USERS }
                { grantedPermissionName: INSERT_SU_PERMISSION, userId: $userId, targetPermissionName: DELETE_USERS }
                {
                    grantedPermissionName: INSERT_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: EDIT_USER_REGISTRANTS
                }
                ####
                {
                    grantedPermissionName: DELETE_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: VIEW_SU_PERMISSION_GRANT
                }
                {
                    grantedPermissionName: DELETE_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: VIEW_SYSTEM_CONFIGURATION
                }
                {
                    grantedPermissionName: DELETE_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: SET_SYSTEM_CONFIGURATION
                }
                {
                    grantedPermissionName: DELETE_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: LIST_CONFERENCE_DEMO_CODES
                }
                {
                    grantedPermissionName: DELETE_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: CREATE_CONFERENCE_DEMO_CODE
                }
                { grantedPermissionName: DELETE_SU_PERMISSION, userId: $userId, targetPermissionName: VIEW_USERS }
                { grantedPermissionName: DELETE_SU_PERMISSION, userId: $userId, targetPermissionName: DELETE_USERS }
                {
                    grantedPermissionName: DELETE_SU_PERMISSION
                    userId: $userId
                    targetPermissionName: EDIT_USER_REGISTRANTS
                }
            ]
        ) {
            affected_rows
        }
    }
`;

export async function handleInitialiseSuperUser(logger: P.Logger): Promise<InitialiseSuperUserOutput> {
    try {
        const queryResponse = await apolloClient.query({
            query: SuperUserStateDocument,
        });

        if (queryResponse.data.system_SuperUserState.length === 0) {
            throw new Error("Superuser state view returned no rows?!");
        }

        if (queryResponse.data.system_SuperUserState[0].isInitialised) {
            return { success: false, error: "Superuser is already initialised." };
        }

        if (!queryResponse.data.system_SuperUserState[0].canBeDirectlyInitialised) {
            return {
                success: false,
                error: "Superuser cannot be directly initialised. Can only be initialised directly if exactly one user exists. Please insert the permission grant manually into Hasura: System.SuperUserPermissionGrant (INSERT_SU_PERMISSION, your user id, INSERT_SU_PERMISSION).",
            };
        }

        if (queryResponse.data.User.length !== 1) {
            return {
                success: false,
                error: "Superuser cannot be directly initialised. No single user available. Not sure how this can have happened because the other checks should have prevented it.",
            };
        }

        await apolloClient.mutate({
            mutation: InitialiseSuperUserStateDocument,
            variables: {
                userId: queryResponse.data.User[0].id,
            },
        });

        return { success: true, error: null };
    } catch (e: any) {
        logger.error({ err: e }, "Unable to fetch current superuser state");
        return { success: false, error: "Could not fetch current superuser state." };
    }
}
